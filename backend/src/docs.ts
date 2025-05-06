import { Router, Request, Response } from "express";
import { Bookmark, BookmarkSchema, DocId, Document, DocumentSchema } from "./types";
import { PrismaClient } from '@prisma/client';
import { Readable } from "stream";
import { APIError } from "./error";
import { withAuth } from "./auth";
import { reorderItems } from "./order";

const prisma = new PrismaClient();

// This router holds all of the /api/v1/docs routes.
// I'm using a router primarily to skip having to type
// all of that again and again.
export const router = Router();
router.post("/", withAuth<DocId>((_req, res) => { // `POST /api/v1/docs`
  res.status(200).send({success: true, data: {"document_id": "c9663ed1fc2373ca8cb16ce8bcb4faae781ae8e1e1976803b7a756f81f309b60"}});
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

router.get("/:docid/stream", (_req: Request, res: Response<string>) => { // `POST /api/v1/docs`
  res.status(200).send("todo...");
});

router.patch("/:docid", withAuth<Document>(async (req, res) => { // `PATCH /api/v1/docs/<docid>`
  try {
    const ret: Document = await prisma.$transaction(async (tx) => {
      const docId = req.params.docId;
      
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

// `GET /api/v1/docs/<docid>/pages/<pagenum>/image`
// for example: `http://localhost:8080/api/v1/docs/48723/pages/0/image`
router.get("/:docid/pages/:pagenum/image", withAuth<void>(async (req, res) => {
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
    const response = await fetch(`https://s3.magnusfulton.com/com.listenink/${doc.s3key}/${req.params.pagenum}.jpg`);
    res.setHeader('Content-Type', response.headers.get('content-type') ?? "image/jpeg");
    res.status(200);
    if (response.body === null) {
      res.send();
    } else {
      Readable.fromWeb(response.body).pipe(res);
    }
  }
}));

router.get("/:docid/pages/:pagenum/audio", withAuth<void>(async (req, res) => {
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
    const response = await fetch(`https://s3.magnusfulton.com/com.listenink/${doc.s3key}/${req.params.pagenum}.mp3`);
    res.setHeader('Content-Type', response.headers.get('content-type') ?? "audio/mpeg");
    res.status(200);
    if (response.body === null) {
      res.send();
    } else {
      Readable.fromWeb(response.body).pipe(res);
    }
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
