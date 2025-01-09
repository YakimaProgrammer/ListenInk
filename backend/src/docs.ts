import { Router, Request, Response } from "express";
// import { faker } from '@faker-js/faker';
import { DocId, Document } from "./types/docs";

// This router holds all of the /api/v1/docs routes.
// I'm using a router primarily to skip having to type
// all of that again and again.
export const router = Router();
router.post("/", (_req: Request, res: Response<DocId>) => { // `POST /api/v1/docs`
  res.status(200).send({"document_id": "c9663ed1fc2373ca8cb16ce8bcb4faae781ae8e1e1976803b7a756f81f309b60" });
});

router.patch("/", (_req: Request, res: Response<Document>) => { // `PATCH /api/v1/docs`
  res.status(200).send({
    name: "Chem 114",
    numpages: 117,
    bookmarks: [],
    leftOffAt: {
      page: 0,
      audiotime: 0
    },
    shares: [],
    owner: "30c0becb-be73-4409-9e90-02f97cdc3f1f",
    id: "c9663ed1fc2373ca8cb16ce8bcb4faae781ae8e1e1976803b7a756f81f309b60",
    completed: true
  });
});

router.get("/:docid", (_req: Request, res: Response<Document>) => { // `GET /api/v1/docs/<id>`
  res.status(200).send({
    name: "Chem 114",
    numpages: 117,
    bookmarks: [],
    leftOffAt: {
      page: 0,
      audiotime: 0
    },
    shares: [],
    owner: "30c0becb-be73-4409-9e90-02f97cdc3f1f",
    id: "c9663ed1fc2373ca8cb16ce8bcb4faae781ae8e1e1976803b7a756f81f309b60",
    completed: true
  });
});

// `GET /api/v1/docs/<docid>/pages/<pagenum>/image`
// for example: `http://localhost:8080/api/v1/docs/48723/pages/0/image`
router.get("/:docid/pages/:pagenum/image", (_req: Request, res: Response) => {
  res.status(200).sendFile("src/mocked/book.jpg", {root: "."});
});
