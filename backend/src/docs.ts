import { Router, Request, Response } from "express";
import { DocId, Document, DocumentSchema, Err } from "./types";
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

// Eventually, this will be refined such that only properties that make sense to modify (name, bookmarks) are mutable
// Right now, this does double-duty for modifying bookmarks. imo, this should be its own resource
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
    try {
      // This should scare you
      const partial: Partial<Document> = DocumentSchema.partial().parse(req.body);
      const patched: Document = {...doc, ...partial};

      const docBookmarks = doc.bookmarks.map(b => b.id);
      const patchedBookmarks = patched.bookmarks.map(b => b.id);
      const deletedBookmarks = docBookmarks.filter(b => patchedBookmarks.includes(b));
      
      const ret: Document = await prisma.document.update({
	where: {
	  id: req.params.docid
	},
	include: {
	  bookmarks: true
	},
	data: {
	  ...patched,
	  bookmarks: {
	    deleteMany: deletedBookmarks.map(b => ({id : b})),
	    upsert: patched.bookmarks.map(b => ({ where: { id: b.id }, create: b, update: b }))
	  }
	}
      });

      res.status(200).send(ret);
    } catch (e) {
      console.error(e);
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
