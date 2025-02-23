import { Router, Request, Response } from "express";
import { Bookmark, BookmarkSchema, DocId, Document, DocumentSchema, Err } from "./types";
import { PrismaClient } from '@prisma/client';
import { Readable } from "stream";

const prisma = new PrismaClient();

// This router holds all of the /api/v1/docs routes.
// I'm using a router primarily to skip having to type
// all of that again and again.
export const router = Router();
router.post("/", (_req: Request, res: Response<DocId>) => { // `POST /api/v1/docs`
  res.status(200).send({"document_id": "c9663ed1fc2373ca8cb16ce8bcb4faae781ae8e1e1976803b7a756f81f309b60" });
});

router.get("/", async (req: Request, res: Response<Document[]>) => {
  const docs: Document[] = await prisma.document.findMany({
    where: {
      category: {
        userId: req.cookies.userId,
      },
    },
    include: {
      bookmarks: true,
      category: true
    },
  });

  res.status(200).send(docs);
});

router.get("/:docid/stream", (_req: Request, res: Response<string>) => { // `POST /api/v1/docs`
  res.status(200).send("todo...");
});

router.patch("/:docid", async (req: Request, res: Response<Document | Err>) => { // `PATCH /api/v1/docs/<docid>`
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      bookmarks: true,
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    const partial = DocumentSchema.omit({ id: true, numpages: true, s3key: true, bookmarks: true, completed: true }).partial().safeParse(req.body);
    if (!partial.success) {
      res.status(400).send({ err: partial.error.message });
      return;
    }
      
    if (partial.data.categoryId !== undefined) {
      // Ask the database if the user owns a category with this id
      const category = await prisma.category.findFirst({
	where: {
	  userId: req.cookies.userId,
	  id: partial.data.categoryId
	}
      });
      if (category === null) {
	res.status(404).send({err: `No such category with id ${partial.data.categoryId} exists!`});
	return;
      }
    }
      
    const ret: Document = await prisma.document.update({
      where: {
	id: req.params.docid
      },
      include: {
	bookmarks: true
      },
      data: partial.data
    });

    res.status(200).send(ret);
  }
});

router.patch("/:docid/bookmarks/:id", async (req: Request, res: Response<Bookmark | Err>) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      bookmarks: true,
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    const id = req.params.id;
    if (doc.bookmarks.some(b => b.id === id)) {
      const partial = BookmarkSchema.omit({ id: true, documentId: true }).partial().safeParse(req.body);
      if (!partial.success) {
	res.status(400).send({ err: partial.error.message });
	return;
      }

      if (partial.data.page !== undefined) {
	if (partial.data.page > doc.numpages) {
	  res.status(400).send({err: "Cannot create a bookmark the points beyond the number of pages in the document!"});
	  return;
	}
      }
	
      const mark = await prisma.bookmark.update({
	where: { id },
	data: partial.data
      });
      res.status(200).send(mark);
    } else {
      res.status(400).send({err: "Tried to update a bookmark that does not exist!"})
    }
  }
});

router.post("/:docid/bookmarks", async (req: Request, res: Response<Bookmark | Err>) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      bookmarks: true,
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    const id = req.params.id;
    if (doc.bookmarks.some(b => b.id === id)) {
      const markMeta = BookmarkSchema.omit({ id: true, documentId: true }).safeParse(req.body);
      if (!markMeta.success) {
	res.status(400).send({ err: markMeta.error.message });
	return;
      }
      
      const mark = await prisma.bookmark.create({
	data: {
	  documentId: req.params.docid,
	  ...markMeta.data
	}
      });
      res.status(200).send(mark);
    } else {
      res.status(400).send({err: "Tried to update a bookmark that does not exist!"})
    }
  }
});

router.delete("/:docid/bookmarks/:id", async (req: Request, res: Response<Err | undefined>) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      bookmarks: true,
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    try {
      const id = req.params.id;
      if (doc.bookmarks.some(b => b.id === id)) {
	await prisma.bookmark.delete({
	  where: { id }
	});
	res.status(204).send();
      } else {
	res.status(400).send({err: "Tried to delete a bookmark that does not exist!"})
      }
    } catch (err) {
      console.error(err);
      res.status(400).send({err : "Something when wrong!"});
    }
  }
});

router.delete("/:docid", async (req: Request, res: Response<Document | Err>) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      bookmarks: true,
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    await prisma.document.delete({
      where: {
	id: req.params.docid
      }
    });
    res.status(204).send();
  }
});

router.get("/:docid", async (req: Request, res: Response<Document | Err>) => { // `GET /api/v1/docs/<id>`
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      bookmarks: true,
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    res.status(200).send(doc);
  }
});

// `GET /api/v1/docs/<docid>/pages/<pagenum>/image`
// for example: `http://localhost:8080/api/v1/docs/48723/pages/0/image`
router.get("/:docid/pages/:pagenum/image", async (req: Request, res: Response) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    const response = await fetch(`https://picsum.photos/id/${req.params.pagenum}/1080/1920`);
    res.setHeader('Content-Type', response.headers.get('content-type') ?? "image/jpeg");
    res.status(200);
    if (response.body === null) {
      res.send();
    } else {
      Readable.fromWeb(response.body).pipe(res);
    }
  }
});

router.get("/:docid/pages/:pagenum/audio", async (req: Request, res: Response) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    res.status(200).sendFile("src/dev/bee movie intro.opus");
  }
});

router.get("/:docid/pages/:pagenum/text", async (req: Request, res: Response) => {
  const doc = await prisma.document.findUnique({
    where: {
      id: req.params.docid
    },
    include: {
      category: true
    }
  });

  if (doc === null || doc.category.userId !== req.cookies.userId) {
    res.status(404).send({err: "Not found!"});
  } else {
    res.status(200).sendFile("src/dev/alice in wonderland.hocr");
  }
});
