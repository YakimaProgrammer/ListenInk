import { Router, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import { Category, Err } from "./types";

const prisma = new PrismaClient();

export const router = Router();
router.get("/", async (req: Request, res: Response<Category[]>) => {
  const categories: Category[] = await prisma.category.findMany({
    where: {
      userId: req.cookies.userId,
    },
  });
  
  res.status(200).send(categories);
});

router.post("/", async (req: Request, res: Response<Category>) => {
  const category: Category = await prisma.category.create({
    data: {
      userId: req.cookies.userId,
      name: req.body.name,
      color: req.body.color
    }
  });
  
  res.status(200).send(category);
});

router.patch("/:catid", async (req: Request, res: Response<Category | Err>) => {
  const category: Category | null = await prisma.category.findUnique({ where: { id: req.params.catid } });
  if (category?.userId === req.cookies.userId) {
    const newCategory: Category = await prisma.category.update({
      where: {
	id: req.params.catid
      },
      data: {
	name: req.body.name,
	color: req.body.color
      },
    });
  
    res.status(200).send(newCategory);
  } else {
    res.status(404).send({err: "Could not find that category!"});
  }
});

router.delete("/:catid", async (req: Request, res: Response<Err>) => {
  const category: Category | null = await prisma.category.findUnique({ where: { id: req.params.catid } });
  if (category?.userId === req.cookies.userId) {
    await prisma.category.delete({
      where: {
	id: req.params.catid
      }
    });
  
    res.status(204).send();
  } else {
    res.status(404).send({err: "Could not find that category!"});
  }
});
