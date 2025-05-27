import { Router } from "express";
import { Bookmark, BookmarkSchema, DocId, Document, DocumentSchema } from "./types";
import { PrismaClient } from '@prisma/client';
import multer from "multer";
import { createHash } from "crypto";
import { APIError } from "./error";
import { withAuth } from "./auth";
import { reorderItems } from "./order";
import { getFromBucket, pdfPipeline, UploadEventEmitter } from "./upload";
import { S3_BUCKET } from "./secrets.json";

const prisma = new PrismaClient();

const uploadMiddleware = multer({ storage: multer.memoryStorage() });

const uploadEmitters: Record<string, UploadEventEmitter> = {};

// This router holds all of the /api/v1/docs routes.
// I'm using a router primarily to skip having to type
// all of that again and again.
export const router = Router();
router.post("/", uploadMiddleware.fields([
  { name: 'pdf', maxCount: 1 }
]), withAuth<DocId>(async (req, res) => { // `POST /api/v1/docs`
  try {
    const doc = await prisma.$transaction(async (tx) => {
      const userId = req.user.id;
    
      const pdfFile = Array.isArray(req.files) ? req.files[0] : req.files?.pdf.at(0);

      if (pdfFile === undefined) {
	throw new APIError("Missing PDF!");
      }

      const key = createHash("sha256").update(pdfFile.buffer).digest("hex");

      const partial = DocumentSchema.pick({ categoryId: true, order: true, name: true }).partial().safeParse(req.body);
      const categories = await tx.category.findMany({
	where: { userId }
      });

      if (partial.success) {
	// Deduplicate - each User "owns" a Document, but those Documents can share a pointer to the underlying, immutable S3 files. 
	let numpages: number;
	let completed: boolean;
	const mirror = await tx.document.findFirst({ where: { s3key: key } });
	if (mirror !== null) {
	  numpages = mirror.numpages;
	  completed = true;
	} else {
	  numpages = 0;
	  completed = false;
	}
	
	let categoryId: string;
	if (partial.data.categoryId !== undefined && categories.some(c => c.id === partial.data.categoryId)) {
	  categoryId = partial.data.categoryId;
	} else if (categories.length !== 0) {
	  categoryId = categories[0].id;
	} else {
	  const cat = await tx.category.create({
	    data: {
	      userId,
	      name: "Recent Uploads",
	      color: "0xFFFFFF",
	      order: await reorderItems({ tx, table: "category", groupField: "userId", groupId: userId,  action: { type: "insert" } })
	    }
	  });
	  categoryId = cat.id;
	}

	const doc = await tx.document.create({
	  data: {
	    categoryId,
	    s3key: key,
	    completed,
	    numpages,
	    name: partial.data.name ?? "New Document",
	    order:  await reorderItems({ tx, table: "document", groupField: "categoryId", groupId: categoryId, action: { type: "insert" } }),
	    bookmarks: {
	      create: {
		page: 0,
		audiotime: 0,
		order: 0
	      } 
	    }
	  }
	});

	const events = new UploadEventEmitter();
	uploadEmitters[doc.id] = events;
	// Start an async watcher
	pdfPipeline(doc.s3key, pdfFile.buffer, events).catch(err => console.error(err));
	events.onAny(([t, d]) => console.log(`DEBUG: Upload for ${doc.id}. Event: ${t}. Data: ${JSON.stringify(d)}`));
	events.on("done", async (ev) => {
	  delete uploadEmitters[doc.id];
	  if (ev.success) {
	    await prisma.document.update({
	      where: { id: doc.id },
	      data: {
		completed: true
	      }
	    });
	  }
	});
	events.on("failure", async () => {
	  await prisma.document.delete({ where: { id: doc.id } });
	});
	events.on("page-done", async (ev) => {
	  await prisma.document.update({
	      where: { id: doc.id },
	      data: {
		numpages: ev.page + 1
	      }
	    });
	});

	return doc;
      } else {
	throw new APIError("Could not parse!" );
      }
    });
    res.status(200).send({ data: { document_id: doc.id }, success: true });
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      console.error(e);
      res.status(500).send({success: false, err: "An unknown error occured!"});
    }
  }
}));

router.get("/", withAuth<Document[]>(async (req, res) => {
  const docs: Document[] = await prisma.document.findMany({
    where: {
      category: {
        userId: req.user.id,
      },
    },
    include: {
      bookmarks: { orderBy: { order: "asc" } },
      category: true
    },
    orderBy: { order: "asc" }
  });

  res.status(200).send({ success: true, data: docs });
}));

function formatSSE(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

router.get("/:docid/stream", withAuth<void>(async (req, res) => {
  const docId = req.params.docid;
      
  // Fetch the document along with its current category.
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { category: true, bookmarks: true },
  });

  if (doc === null || doc.category.userId !== req.user.id) {
    res.status(404).send({ success: false, err: "Not found!" });
    return;
  }

  const emitter = uploadEmitters[docId];

  if (!(emitter instanceof UploadEventEmitter)) {
    res.status(404).send({ success: false, err: "Not found!" });
    return;
  }
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();
  
  res.write(formatSSE("partial", doc));
  
  if (doc.completed) {
    res.write(formatSSE("done", {}));
  }
  
  // Send a keep-alive ping every 10 seconds
  const ping = setInterval(() => {
    res.write(":\n\n");
  }, 10_000);

  // Pipe in new events as they come
  emitter.onAny(([type, payload]) => {
    if (!res.writableEnded && res.writable) {
      res.write(formatSSE(type, payload));
    }
  });

  // Replay past events
  for (const [type, payload] of emitter.getEventLog()) {
    res.write(formatSSE(type, payload));
  }

  req.on("close", () => {
    clearInterval(ping);
  });
}));

router.patch("/:docid", withAuth<Document>(async (req, res) => { // `PATCH /api/v1/docs/<docid>`
  try {
    const ret: Document = await prisma.$transaction(async (tx) => {
      const docId = req.params.docid;
      
      // Fetch the document along with its current category.
      const doc = await tx.document.findUnique({
	where: { id: docId },
	include: { category: true },
      });

      if (doc === null || doc.category.userId !== req.user.id) {
	throw new APIError("Not found!");
      }

      // Parse the request from the user
      const partial = DocumentSchema.pick({ order: true, name: true, categoryId: true }).partial().safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }

      let order: number;
      // Do I need to move things?
      if (partial.data.order !== undefined) {
	// Am I staying in the same category?
	if (partial.data.categoryId === doc.categoryId || partial.data.categoryId === undefined) {
	  order = await reorderItems({ tx, groupId: doc.categoryId, action: { type: "move", oldPosition: doc.order, newPosition: partial.data.order }, table: "document", groupField: "categoryId" });
	} else {
	  // Delete from old category
	  await reorderItems({ tx, groupId: doc.categoryId, action: { type: "delete", position: doc.order }, table: "document", groupField: "categoryId" });
	  // Insert into new category
	  order = await reorderItems({ tx, groupId: partial.data.categoryId, action: { type: "insert", position: partial.data.order }, table: "document", groupField: "categoryId" });
	}
      } else {
	order = doc.order;
      }
   
      // Finally, update the moving document's order.
      return await tx.document.update({
        where: { id: docId },
        data: { ...partial.data, order },
	include: { bookmarks: true }
      });
    });
    res.status(200).send({ success: true, data: ret })
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      console.error(e);
      res.status(500).send({success: false, err: "An unknown error occured!"});
    }
  }
}));

router.patch("/:docid/bookmarks/:id", withAuth<Bookmark>(async (req, res) => {
  try {
    const bookmark: Bookmark = await prisma.$transaction(async (tx) => {
      const id = req.params.id;
      const docId = req.params.docid;
      
      const doc = await tx.document.findUnique({
	where: {
	  id: docId
	},
	include: {
	  bookmarks: true,
	  category: true
	}
      });
      if (doc === null || doc.category.userId !== req.user.id) {
	throw new APIError("Not found!");
      }
      const oldBookmark = doc.bookmarks.find(b => b.id === id);
      if (oldBookmark === undefined) {
	throw new APIError("Tried to update a Bookmark that does not exist!");
      }
      
      const partial = BookmarkSchema.pick({ order: true, page: true, audiotime: true }).partial().safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }
      if (partial.data.page !== undefined) {
	if (partial.data.page > doc.numpages) {
	  throw new APIError("Cannot create a bookmark the points beyond the number of pages in the document!");
	}
      }

      let order: number;
      if (partial.data.order !== undefined) {
	order = await reorderItems({ tx, table: "bookmark", groupField: "documentId", groupId: docId, action: {type: "move", oldPosition: oldBookmark.order, newPosition: partial.data.order }});
      } else {
	order = oldBookmark.order;
      }

      return await tx.bookmark.update({
	where: { id },
	data: { ...partial.data, order }
      });
    });

    res.status(200).send({ success: true, data: bookmark });
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      console.error(e);
      res.status(500).send({ success: false, err: "An unknown error occured!" })
    }
  }
}));

router.post("/:docid/bookmarks", withAuth<Bookmark>(async (req, res) => {
  try {
    const bookmark: Bookmark = await prisma.$transaction(async (tx) => {
      const docId = req.params.docid;
      const doc = await tx.document.findUnique({
	where: {
	  id: docId
	},
	include: {
	  bookmarks: true,
	  category: true
	}
      });
      if (doc === null || doc.category.userId !== req.user.id) {
	throw new APIError("Not found!");
      }
      const partial = BookmarkSchema.pick({ order: true, page: true, audiotime: true }).partial({ order: true }).safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }

      let order = await reorderItems({ tx, table: "bookmark", groupField: "documentId", groupId: docId, action: { type: "insert", position: partial.data.order }});
      
      return await tx.bookmark.create({
	data: {
	  ...partial.data,
	  order,
	  documentId: docId
	}
      });
    });

    res.status(200).send({ data: bookmark, success: true });
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ err: "An unexpected error occured!", success: false });
    }
  }
}));

router.delete("/:docid/bookmarks/:id", withAuth<void>(async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const docId = req.params.docid;
      const id = req.params.id;
      const doc = await tx.document.findUnique({
	where: {
	  id: docId
	},
	include: {
	  bookmarks: true,
	  category: true
	}
      });
      if (doc === null || doc.category.userId !== req.user.id) {
	throw new APIError("Not found!");
      }
      const oldBookmark = doc.bookmarks.find(b => b.id === id);
      if (oldBookmark === undefined) {
	throw new APIError(`No such bookmark with id ${id} exists on document ${docId}!`);
      }
      await reorderItems({ tx, table: "bookmark", groupField: "documentId", groupId: docId, action: { type: "delete", position: oldBookmark.order }});
      await tx.bookmark.delete({
	where: { id }
      });
    });

    res.status(204).send();
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ err: "An unexpected error occured!", success: false });
    }
  }
}));

router.delete("/:docid", withAuth<Document>(async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const docId = req.params.docid;
      const doc = await tx.document.findUnique({
	where: {
	  id: docId
	},
	include: {
	  bookmarks: true,
	  category: true
	}
      });
      if (doc === null || doc.category.userId !== req.user.id) {
	throw new APIError("Not found!");
      }
      await reorderItems({ tx, table: "document", groupField: "categoryId", groupId: doc.categoryId, action: { type: "delete", position: doc.order }});
      
      await tx.document.delete({
	where: { id: docId }
      });
    });

    res.status(204).send();
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ err: "An unexpected error occured!", success: false });
    }
  }
}));

router.get("/:docid", withAuth<Document>(async (req, res) => { // `GET /api/v1/docs/<id>`
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      bookmarks: { orderBy: { order: "asc" } },
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.user.id) {
    res.status(404).send({ err: "Not found!", success: false });
  } else {
    res.status(200).send({ data: doc, success: true });
  }
}));

router.get("/:docid/pages/:pagenum/image", withAuth<void>(async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: {
	id: req.params.docid
      },
      include: {
	category: true
      }
    });

    if (doc === null || doc.category.userId !== req.user.id) {
      res.status(404).send({ err: "Not found!", success: false });
    } else {
      const { stream, contentType, contentLength, contentDisposition } = await getFromBucket(S3_BUCKET, `documents/${doc.s3key}/${req.params.pagenum}.png`);

      if (contentType) res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
      if (stream !== undefined && "pipe" in stream) {
	stream.pipe(res);
      } else {
	res.status(404).send({ success: false, err: "Not found!"});
      }
    }
  } catch (err) {
    console.error('Error fetching file:', err);
    res.status(500).send({ success: false, err: 'Error fetching file'});
  }
}));

router.get("/:docid/pages/:pagenum/audio", withAuth<void>(async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: {
	id: req.params.docid
      },
      include: {
	category: true
      }
    });

    if (doc === null || doc.category.userId !== req.user.id) {
      res.status(404).send({ err: "Not found!", success: false });
    } else {
      const { stream, contentType, contentLength, contentDisposition } = await getFromBucket(S3_BUCKET, `documents/${doc.s3key}/${req.params.pagenum}.mp3`);

      if (contentType) res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
      if (stream !== undefined && "pipe" in stream) {
	stream.pipe(res);
      } else {
	res.status(404).send({ success: false, err: "Not found!"});
      }
    }
  } catch (err) {
    console.error('Error fetching file:', err);
    res.status(500).send({ success: false, err: 'Error fetching file'});
  }
}));

// TODO: Add hOCR support...
/*
router.get("/:docid/pages/:pagenum/text", withAuth<void>(async (req, res) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.user.id) {
    res.status(404).send({err: "Not found!", success: false});
  } else {
    const response = await fetch(`https://s3.magnusfulton.com/com.listenink/${doc.s3key}/${req.params.pagenum}.hocr`);
    res.setHeader('Content-Type', response.headers.get('content-type') ?? "text/vnd.hocr+html");
    res.status(200);
    if (response.body === null) {
      res.send();
    } else {
      Readable.fromWeb(response.body).pipe(res);
    }
  }
}));
 */
