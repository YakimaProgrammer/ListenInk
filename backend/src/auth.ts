import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Err, User } from "./types";

const prisma = new PrismaClient();

export const router = Router();

router.post("/", async (_req: Request, res: Response<User>) => {
  const users: User[] = await prisma.user.findMany();
  const user = users[Math.floor(Math.random() * users.length)];

  res.status(200).cookie("userId", user.id).send(user);
});

router.get("/", async (req: Request, res: Response<User | Err>) => {
  const user = await prisma.user.findUnique({
    where: { id: req.cookies.userId },
  });
  if (user === null) {
    res.status(404).send({ err: "Not found!" });
  } else {
    res.status(200).send(user);
  }
});
