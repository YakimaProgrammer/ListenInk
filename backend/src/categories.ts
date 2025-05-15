import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import { Category, CategorySchema } from "./types";
import { APIError } from "./error";
import { withAuth } from "./auth";
import { reorderItems } from "./order";

const prisma = new PrismaClient();

export const router = Router();
router.get("/", withAuth<Category[]>(async (req, res) => {
  const categories: Category[] = await prisma.category.findMany({
    where: {
      userId: req.user.id,
    },
    orderBy: { order: "asc" }
  });
  
  res.status(200).send({ success: true, data: categories });
}));

router.get("/:catid", withAuth<Category>(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: {
      id: req.params.catid
    }
  });

  if (category !== null && category.userId === req.user.id) {
    res.status(200).send({ success: true, data: category });
  } else {
    res.status(404).send({ success: false, err: "Not found!" });
  }
}));

router.post("/", withAuth<Category>(async (req, res) => {
  try {
    const category: Category = await prisma.$transaction(async (tx) => {
      const userId = req.user.id;
      
      const partial = CategorySchema.pick({ name: true, color: true, order: true }).partial({ order: true }).safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }
      let order = await reorderItems({tx, table: "category", groupField: "userId", groupId: userId, action: { type: "insert", position: partial.data.order }});

      return await tx.category.create({
	data: {
	  ...partial.data,
	  userId,
	  order
	}
      });
    });

    res.status(200).send({ success: true, data: category });
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ success: false, err: "An unknown error occured!" });
    }
  }
}));

router.patch("/:catid", withAuth<Category>(async (req, res) => {
  try {
    const category: Category = await prisma.$transaction(async (tx) => {
      const userId = req.user.id;
      const id = req.params.catid;
      const category = await prisma.category.findUnique({ where: { id } });
      if (category === null || category.userId !== userId) {
	throw new APIError("Not found!");
      }
      const partial = CategorySchema.pick({ name: true, color: true, order: true }).partial().safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }
      let order: number;
      if (partial.data.order !== undefined) {
	order = await reorderItems({ tx, table: "category", groupField: "userId", groupId: userId, action: { type: "move", oldPosition: category.order, newPosition: partial.data.order }});
      } else {
	order = category.order;
      }
      
      return await tx.category.update({
	where: { id },
	data: { ...partial.data, order }
      });
    });

    res.status(200).send({ success: true, data: category });
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ success: false, err: "An unknown error occured!" });
    }
  }
}));

router.delete("/:catid", withAuth<void>(async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const id = req.params.catid;
      const userId = req.user.id;
      const category = await tx.category.findUnique({ where: { id } });
      if (category === null || category.userId !== userId) {
	throw new APIError("Not found!");
      }

      await reorderItems({ tx, table: "category", groupField: "userId", groupId: userId, action: { type: "delete", position: category.order }});
      
      await tx.category.delete({
	where: { id }
      });
    });
    res.status(204).send();
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ success: false, err: "An unknown error occured!" });
    }
  }
}));
