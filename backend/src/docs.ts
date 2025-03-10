import { Router, Request, Response } from "express";
import {
  Bookmark,
  BookmarkSchema,
  DocId,
  Document,
  DocumentSchema,
  Err,
  NaturalNumber,
} from "./types";
import { PrismaClient, Prisma } from "@prisma/client";
import { Readable } from "stream";
import { APIError } from "./error";

const prisma = new PrismaClient();

async function maxDocOrder(
  tx: Prisma.TransactionClient,
  categoryId: string
): Promise<number | null> {
  const result = await tx.document.aggregate({
    where: { categoryId },
    _max: { order: true },
  });
  // If no documents exist in this category, default order is 0.
  return result._max.order ?? 0;
}

async function maxBookmarkOrder(
  tx: Prisma.TransactionClient,
  documentId: string
): Promise<number | null> {
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
router.post("/", (_req: Request, res: Response<DocId>) => {
  // `POST /api/v1/docs`
  res.status(200).send({
    document_id:
      "c9663ed1fc2373ca8cb16ce8bcb4faae781ae8e1e1976803b7a756f81f309b60",
  });
});

router.get("/", async (req: Request, res: Response<Document[]>) => {
  const docs: Document[] = await prisma.document.findMany({
    where: {
      category: {
        userId: req.cookies.userId,
      },
    },
    include: {
      bookmarks: { orderBy: { order: "asc" } },
      category: true,
    },
    orderBy: { order: "asc" },
  });

  res.status(200).send(docs);
});

router.get("/:docid/stream", (_req: Request, res: Response<string>) => {
  // `POST /api/v1/docs`
  res.status(200).send("todo...");
});

router.patch("/:docid", async (req: Request, res: Response<Document | Err>) => {
  // `PATCH /api/v1/docs/<docid>`
  try {
    const ret: Document = await prisma.$transaction(async (tx) => {
      const docId = req.params.docid;
      console.log("PATCH: docId =", docId);

      // Fetch the document along with its current category.
      const doc = await tx.document.findUnique({
        where: { id: docId },
        include: { category: true },
      });
      if (doc === null || doc.category.userId !== req.cookies.userId) {
        console.error("Document not found or user mismatch.");
        throw new APIError({ err: "Not found!" });
      }

      // Parse the request from the user.
      const partial = DocumentSchema.omit({
        id: true,
        numpages: true,
        s3key: true,
        bookmarks: true,
        completed: true,
      })
        .partial()
        .safeParse(req.body);
      if (!partial.success) {
        console.error("Partial parse error:", partial.error);
        throw new APIError({ err: partial.error.message });
      }

      const oldCategoryId = doc.categoryId;
      const newCategoryId = partial.data.categoryId;
      const oldOrder = doc.order;
      let newPosition: number;
      const movingToNewCategory =
        newCategoryId !== undefined && oldCategoryId !== newCategoryId;

      // Check if an order is provided; if not, default to the current document order.
      {
        if (partial.data.order !== undefined) {
          const parseResult = NaturalNumber.safeParse(partial.data.order);
          if (parseResult.success) {
            newPosition = parseResult.data;
          } else {
            console.error("Order parse failed:", partial.data.order);
            throw new APIError({ err: "`order` must be a natural number!" });
          }
        } else {
          newPosition = doc.order;
        }
      }

      console.log("Old Order:", oldOrder);
      console.log("New Category ID:", newCategoryId);
      console.log("New Position (computed):", newPosition);

      const { order: _, ...deltaData } = partial.data;

      if (movingToNewCategory) {
        const max = await maxDocOrder(tx, newCategoryId);
        console.log("Max order in target category:", max);
        if (max === null || newPosition > max) {
          console.error("New position out of bounds:", newPosition, max);
          throw new APIError({
            err: "Tried to move a Document out of bounds!",
          });
        }

        // Decrement orders in old category
        await tx.document.updateMany({
          where: {
            categoryId: oldCategoryId,
            order: { gt: oldOrder },
          },
          data: { order: { decrement: 1 } },
        });

        // Increment orders in new category
        await tx.document.updateMany({
          where: {
            categoryId: newCategoryId,
            order: { gte: newPosition },
          },
          data: { order: { increment: 1 } },
        });

        const updatedDoc = await tx.document.update({
          where: { id: docId },
          data: { categoryId: newCategoryId, order: newPosition, ...deltaData },
          include: { bookmarks: true },
        });
        console.log("Document updated in new category:", updatedDoc);
        return updatedDoc;
      } else {
        // Moving within the same category.
        const max = await maxDocOrder(tx, oldCategoryId);
        console.log("Max order in same category:", max);
        if (max === null || newPosition > max) {
          console.error(
            "New position out of bounds (same category):",
            newPosition,
            max
          );
          throw new APIError({
            err: "Tried to move a Document out of bounds!",
          });
        }

        if (newPosition < oldOrder) {
          // Moving up.
          await tx.document.updateMany({
            where: {
              categoryId: oldCategoryId,
              order: { gte: newPosition, lt: oldOrder },
            },
            data: { order: { increment: 1 } },
          });
        } else if (newPosition > oldOrder) {
          // Moving down.
          await tx.document.updateMany({
            where: {
              categoryId: oldCategoryId,
              order: { gt: oldOrder, lte: newPosition },
            },
            data: { order: { decrement: 1 } },
          });
        }

        const updatedDoc = await tx.document.update({
          where: { id: docId },
          data: { order: newPosition, ...deltaData },
          include: { bookmarks: true },
        });
        console.log("Document updated in same category:", updatedDoc);
        return updatedDoc;
      }
    });
    res.status(200).send(ret);
  } catch (e: unknown) {
    console.error("Error in PATCH endpoint:", e);
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ err: "An unknown error occured!" });
    }
  }
});

router.patch(
  "/:docid/bookmarks/:id",
  async (req: Request, res: Response<Bookmark | Err>) => {
    try {
      const bookmark: Bookmark = await prisma.$transaction(async (tx) => {
        const id = req.params.id;
        const docId = req.params.docid;
        let newOrder: number | undefined = undefined;

        const maxOrder = await maxBookmarkOrder(tx, docId);
        if (maxOrder === null) {
          throw new Error(
            `Unable to get the max order value for bookmark ${id}`
          );
        }

        const doc = await tx.document.findUnique({
          where: {
            id: docId,
          },
          include: {
            bookmarks: true,
            category: true,
          },
        });
        if (doc === null || doc.category.userId !== req.cookies.userId) {
          throw new APIError({ err: "Not found!" });
        }
        const oldBookmark = doc.bookmarks.find((b) => b.id === id);
        if (oldBookmark === undefined) {
          throw new APIError({
            err: "Tried to update a Bookmark that does not exist!",
          });
        }

        const partial = BookmarkSchema.omit({ id: true, documentId: true })
          .partial()
          .safeParse(req.body);
        if (!partial.success) {
          throw new APIError({ err: partial.error.message });
        }
        if (partial.data.page !== undefined) {
          if (partial.data.page > doc.numpages) {
            throw new APIError({
              err: "Cannot create a bookmark the points beyond the number of pages in the document!",
            });
          }
        }
        if (partial.data.order !== undefined) {
          if (partial.data.order > maxOrder) {
            throw new APIError({
              err: "Cannot move a bookmark out of bounds! ",
            });
          }
          newOrder = partial.data.order;
        }

        if (newOrder !== undefined) {
          if (newOrder > oldBookmark.order) {
            await tx.bookmark.updateMany({
              where: {
                documentId: docId,
                order: { gt: oldBookmark.order, lte: newOrder },
              },
              data: { order: { decrement: 1 } },
            });
          } else if (newOrder < oldBookmark.order) {
            await tx.bookmark.updateMany({
              where: {
                documentId: docId,
                order: { gte: newOrder, lt: oldBookmark.order },
              },
              data: { order: { increment: 1 } },
            });
          }
        }

        const { order: _, ...deltaData } = partial.data;
        return await tx.bookmark.update({
          where: { id },
          data: { order: newOrder, ...deltaData },
        });
      });

      res.status(200).send(bookmark);
    } catch (e: unknown) {
      if (e instanceof APIError) {
        res.status(400).send(e.details);
      } else {
        console.error(e);
        res.status(500).send({ err: "An unknown error occured!" });
      }
    }
  }
);

router.post(
  "/:docid/bookmarks",
  async (req: Request, res: Response<Bookmark | Err>) => {
    try {
      const bookmark: Bookmark = await prisma.$transaction(async (tx) => {
        const docId = req.params.docid;
        const doc = await tx.document.findUnique({
          where: {
            id: docId,
          },
          include: {
            bookmarks: true,
            category: true,
          },
        });
        if (doc === null || doc.category.userId !== req.cookies.userId) {
          throw new APIError({ err: "Not found!" });
        }
        const maxOrder = await maxBookmarkOrder(tx, docId);
        if (maxOrder === null) {
          throw new Error(
            `Unable to get the maximum order value for bookmarks associated with Document ${docId}`
          );
        }
        const partial = BookmarkSchema.omit({ id: true, documentId: true })
          .partial({ order: true })
          .safeParse(req.body);
        if (!partial.success) {
          throw new APIError({ err: partial.error.message });
        }
        if (partial.data.order !== undefined) {
          if (partial.data.order > maxOrder + 1) {
            throw new APIError({
              err: "Cannot create a bookmark out of bounds! ",
            });
          }
          if (partial.data.order < maxOrder + 1) {
            await tx.bookmark.updateMany({
              where: {
                documentId: docId,
                order: { gte: partial.data.order },
              },
              data: { order: { increment: 1 } },
            });
          }
        }

        return await tx.bookmark.create({
          data: {
            ...partial.data,
            order: partial.data.order ?? maxOrder + 1,
            documentId: docId,
          },
        });
      });

      res.status(200).send(bookmark);
    } catch (e: unknown) {
      if (e instanceof APIError) {
        res.status(400).send(e.details);
      } else {
        res.status(500).send({ err: "An unexpected error occured!" });
      }
    }
  }
);

router.delete(
  "/:docid/bookmarks/:id",
  async (req: Request, res: Response<Err | undefined>) => {
    try {
      await prisma.$transaction(async (tx) => {
        const docId = req.params.docid;
        const id = req.params.id;
        const doc = await tx.document.findUnique({
          where: {
            id: docId,
          },
          include: {
            bookmarks: true,
            category: true,
          },
        });
        if (doc === null || doc.category.userId !== req.cookies.userId) {
          throw new APIError({ err: "Not found!" });
        }
        const oldBookmark = doc.bookmarks.find((b) => b.id === id);
        if (oldBookmark === undefined) {
          throw new APIError({
            err: `No such bookmark with id ${id} exists on document ${docId}!`,
          });
        }
        await tx.bookmark.delete({
          where: { id },
        });
        await tx.bookmark.updateMany({
          where: {
            documentId: docId,
            order: { gt: oldBookmark.order },
          },
          data: { order: { decrement: 1 } },
        });
      });

      res.status(204).send();
    } catch (e: unknown) {
      if (e instanceof APIError) {
        res.status(400).send(e.details);
      } else {
        res.status(500).send({ err: "An unexpected error occured!" });
      }
    }
  }
);

router.delete(
  "/:docid",
  async (req: Request, res: Response<Document | Err>) => {
    try {
      await prisma.$transaction(async (tx) => {
        const docId = req.params.docid;
        const doc = await tx.document.findUnique({
          where: {
            id: docId,
          },
          include: {
            bookmarks: true,
            category: true,
          },
        });
        if (doc === null || doc.category.userId !== req.cookies.userId) {
          throw new APIError({ err: "Not found!" });
        }
        await tx.document.delete({
          where: { id: docId },
        });
        await tx.document.updateMany({
          where: {
            id: docId,
            order: { gt: doc.order },
          },
          data: { order: { decrement: 1 } },
        });
      });

      res.status(204).send();
    } catch (e: unknown) {
      if (e instanceof APIError) {
        res.status(400).send(e.details);
      } else {
        res.status(500).send({ err: "An unexpected error occured!" });
      }
    }
  }
);

router.get("/:docid", async (req: Request, res: Response<Document | Err>) => {
  // `GET /api/v1/docs/<id>`
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid,
    },
    include: {
      bookmarks: { orderBy: { order: "asc" } },
      category: true,
    },
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({ err: "Not found!" });
  } else {
    res.status(200).send(doc);
  }
});

// `GET /api/v1/docs/<docid>/pages/<pagenum>/image`
// for example: `http://localhost:8080/api/v1/docs/48723/pages/0/image`
router.get(
  "/:docid/pages/:pagenum/image",
  async (req: Request, res: Response) => {
    const doc = await prisma.document.findUnique({
      where: {
        id: req.params.docid,
      },
      include: {
        category: true,
      },
    });

    if (doc === null || doc.category.userId !== req.cookies.userId) {
      res.status(404).send({ err: "Not found!" });
    } else {
      const response = await fetch(
        `https://s3.magnusfulton.com/com.listenink/${doc.s3key}/${req.params.pagenum}.jpg`
      );
      res.setHeader(
        "Content-Type",
        response.headers.get("content-type") ?? "image/jpeg"
      );
      res.status(200);
      if (response.body === null) {
        res.send();
      } else {
        Readable.fromWeb(response.body).pipe(res);
      }
    }
  }
);

router.get(
  "/:docid/pages/:pagenum/audio",
  async (req: Request, res: Response) => {
    const doc = await prisma.document.findUnique({
      where: {
        id: req.params.docid,
      },
      include: {
        category: true,
      },
    });

    if (doc === null || doc.category.userId !== req.cookies.userId) {
      res.status(404).send({ err: "Not found!" });
    } else {
      const response = await fetch(
        `https://s3.magnusfulton.com/com.listenink/${doc.s3key}/${req.params.pagenum}.mp3`
      );
      res.setHeader(
        "Content-Type",
        response.headers.get("content-type") ?? "audio/mpeg"
      );
      res.status(200);
      if (response.body === null) {
        res.send();
      } else {
        Readable.fromWeb(response.body).pipe(res);
      }
    }
  }
);

router.get(
  "/:docid/pages/:pagenum/text",
  async (req: Request, res: Response) => {
    const doc = await prisma.document.findUnique({
      where: {
        id: req.params.docid,
      },
      include: {
        category: true,
      },
    });

    if (doc === null || doc.category.userId !== req.cookies.userId) {
      res.status(404).send({ err: "Not found!" });
    } else {
      const response = await fetch(
        `https://s3.magnusfulton.com/com.listenink/${doc.s3key}/${req.params.pagenum}.hocr`
      );
      res.setHeader(
        "Content-Type",
        response.headers.get("content-type") ?? "text/vnd.hocr+html"
      );
      res.status(200);
      if (response.body === null) {
        res.send();
      } else {
        Readable.fromWeb(response.body).pipe(res);
      }
    }
  }
);
