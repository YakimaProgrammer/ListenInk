import { Router, Request, Response } from "express";
import { Bookmark, BookmarkSchema, DocId, Document, DocumentSchema, NaturalNumber } from "./types";
import { PrismaClient, Prisma } from '@prisma/client';
import { Readable } from "stream";
import { APIError } from "./error";
import { withAuth } from "./auth";

const prisma = new PrismaClient();

async function maxDocOrder(tx: Prisma.TransactionClient, categoryId: string): Promise<number | null> {
  const result = await tx.document.aggregate({
    where: { categoryId },
    _max: { order: true },
  });
  return result._max.order;
}
async function maxBookmarkOrder(tx: Prisma.TransactionClient, documentId: string): Promise<number | null> {
  const result = await tx.bookmark.aggregate({
    where: { documentId },
    _max: { order: true },
  });
  return result._max.order;
}

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
      const partial = DocumentSchema.omit({ id: true, numpages: true, s3key: true, bookmarks: true, completed: true }).partial().safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }
    
      const oldCategoryId = doc.categoryId;
      const newCategoryId = partial.data.categoryId;
      const oldOrder = doc.order;
      let newPosition;
      const movingToNewCategory = newCategoryId !== undefined && oldCategoryId !== newCategoryId;

      // Anonymous block
      {
	const res = NaturalNumber.safeParse(partial.data.order);
	if (res.success) {
	  newPosition = res.data;
	} else {
	  throw new APIError("`order` must be a natural number!");
	}
      };
      
      const { order: _, ...deltaData } = partial.data;
    
      if (movingToNewCategory) {
	const max = await maxDocOrder(tx, newCategoryId);
	if (max === null) {
	  throw new Error(`Unable to get the maximum order value for category ${newCategoryId}`);
	}
	// newPosition comes from partial.data.order which cannot be less than zero by the schema
	if (newPosition !== undefined && newPosition > max) {
	  throw new APIError("Tried to move a Document out of bounds!");
	}
	
	// 1. In the old category, decrement order for all docs with order > oldOrder.
	await tx.document.updateMany({
          where: {
            categoryId: oldCategoryId,
            order: { gt: oldOrder },
          },
          data: { order: { decrement: 1 } },
	});
      
	// 2. In the new category, increment order for all docs with order >= newPosition.
	if (newPosition !== undefined) {
	  await tx.document.updateMany({
            where: {
              categoryId: newCategoryId,
              order: { gte: newPosition },
            },
            data: { order: { increment: 1 } },
	  });
	} else { 
	  newPosition = max;
	}
      
	// 3. Update the moving document to its new category and new order.
	return await tx.document.update({
          where: { id: docId },
          data: { categoryId: newCategoryId, order: newPosition, ...deltaData },
	  include: { bookmarks: true }
	});
      } else {
	// Moving within the same category.
	const max = await maxDocOrder(tx, oldCategoryId);
	if (max === null) {
	  throw new Error(`Unable to get the maximum order value for category ${oldCategoryId}`);
	}
	// newPosition comes from partial.data.order which cannot be less than zero by the schema
	if (newPosition !== undefined && newPosition > max) {
	  throw new APIError("Tried to move a Document out of bounds!");
	}
	
	if (newPosition === undefined) {
	  newPosition = max;
	}

	if (newPosition < oldOrder) {
          // Moving up: Increment order for docs between newPosition and oldOrder (inclusive newPosition, exclusive oldOrder).
          await tx.document.updateMany({
            where: {
              categoryId: oldCategoryId,
              order: { gte: newPosition, lt: oldOrder },
            },
            data: { order: { increment: 1 } },
          });
	} else if (newPosition > oldOrder) {
          // Moving down: Decrement order for docs between oldOrder and newPosition (exclusive oldOrder, inclusive newPosition).
          await tx.document.updateMany({
            where: {
              categoryId: oldCategoryId,
              order: { gt: oldOrder, lte: newPosition },
            },
            data: { order: { decrement: 1 } },
          });
	} // else newPosition === oldOrder: do nothing 
      
	// Finally, update the moving document's order.
	return await tx.document.update({
          where: { id: docId },
          data: { order: newPosition, ...deltaData },
	  include: { bookmarks: true }
	});
      }
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
      let newOrder: number | undefined = undefined;

      const maxOrder = await maxBookmarkOrder(tx, docId);
      if (maxOrder === null) {
	throw new Error(`Unable to get the max order value for bookmark ${id}`);
      }
      
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
      
      const partial = BookmarkSchema.omit({ id: true, documentId: true }).partial().safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }
      if (partial.data.page !== undefined) {
	if (partial.data.page > doc.numpages) {
	  throw new APIError("Cannot create a bookmark the points beyond the number of pages in the document!");
	}
      }
      if (partial.data.order !== undefined) {
	if (partial.data.order > maxOrder) {
	  throw new APIError("Cannot move a bookmark out of bounds! ");
	}
	newOrder = partial.data.order;
      }

      if (newOrder !== undefined) {
	if (newOrder > oldBookmark.order) {
	  await tx.bookmark.updateMany({
	    where: {
	      documentId: docId,
	      order: { gt: oldBookmark.order, lte: newOrder }
	    },
	    data: { order: { decrement: 1 }}
	  });
	} else if (newOrder < oldBookmark.order) {
	  await tx.bookmark.updateMany({
	    where: {
	      documentId: docId,
	      order: { gte: newOrder, lt: oldBookmark.order }
	    },
	    data: { order: { increment: 1 }}
	  });
	}
      }

      const { order: _, ...deltaData } = partial.data;
      return await tx.bookmark.update({
	where: { id },
	data: { order: newOrder, ...deltaData }
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
      const maxOrder = await maxBookmarkOrder(tx, docId);
      if (maxOrder === null) {
	throw new Error(`Unable to get the maximum order value for bookmarks associated with Document ${docId}`);
      }
      const partial = BookmarkSchema.omit({ id: true, documentId: true }).partial({ order: true }).safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }
      if (partial.data.order !== undefined) {
	if (partial.data.order > maxOrder + 1) {
	  throw new APIError("Cannot create a bookmark out of bounds!");
	}
	if (partial.data.order < maxOrder + 1) {
	  await tx.bookmark.updateMany({
	    where: {
	      documentId: docId,
	      order: { gte: partial.data.order }
	    },
	    data: { order: { increment: 1 }}
	  });
	}
      }
      
      return await tx.bookmark.create({
	data: {
	  ...partial.data,
	  order: partial.data.order ?? (maxOrder + 1),
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
      await tx.bookmark.delete({
	where: { id }
      });
      await tx.bookmark.updateMany({
	where: {
	  documentId: docId,
	  order: { gt: oldBookmark.order }
	},
	data: { order: { decrement: 1 } }
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
      await tx.document.delete({
	where: { id: docId }
      });
      await tx.document.updateMany({
	where: {
	  id: docId,
	  order: { gt: doc.order }
	},
	data: { order: { decrement: 1 } }
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

