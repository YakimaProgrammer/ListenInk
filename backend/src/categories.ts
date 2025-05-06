import { Router } from "express";
import { PrismaClient, Prisma } from '@prisma/client';
import { Category, CategorySchema } from "./types";
import { APIError } from "./error";
import { withAuth } from "./auth";

const prisma = new PrismaClient();

async function maxCategoryOrder(tx: Prisma.TransactionClient, userId: string): Promise<number | null> {
  const result = await tx.category.aggregate({
    where: { userId },
    _max: { order: true },
  });
  return result._max.order;
}


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

router.post("/", withAuth<Category>(async (req, res) => {
  try {
    const category: Category = await prisma.$transaction(async (tx) => {
      const userId = req.user.id;
      const maxOrder = await maxCategoryOrder(tx, userId);
      if (maxOrder === null) {
	throw new Error(`Unable to get the maximum order value for user ${userId}`);
      }
      const partial = CategorySchema.omit({ id: true, userId: true }).partial({ order: true }).safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }
      const newOrder = partial.data.order;
      if (newOrder !== undefined) {
	// +1 because the user could be *very* explicit about wanting to append
	if (newOrder > maxOrder + 1) {
	  throw new APIError("Tried to create a new category out of bounds!");
	}

	await tx.category.updateMany({
	  where: { userId, order: { gte: newOrder }},
	  data: { order: { increment: 1 }}
	});
      }

      return await tx.category.create({
	data: {
	  ...partial.data,
	  userId,
	  order: newOrder ?? (maxOrder + 1)
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
      const partial = CategorySchema.omit({ id: true, userId: true }).partial().safeParse(req.body);
      if (!partial.success) {
	throw new APIError(partial.error.message);
      }
      const newOrder = partial.data.order;
      const oldOrder = category.order;
      if (newOrder !== undefined) {
	const maxOrder = await maxCategoryOrder(tx, userId);
	if (maxOrder === null) {
	  throw new Error(`Unable to get the maximum order value for user ${userId}`);
	}
	if (newOrder > maxOrder) {
	  throw new APIError("Cannot move a category out of bounds!");
	}
	if (newOrder > oldOrder) {
	  await tx.category.updateMany({
	    where: { userId, order: { gt: oldOrder, lte: newOrder } },
	    data: { order: { decrement: 1} }
	  });
	} else if (newOrder < oldOrder) {
	  await tx.category.updateMany({
	    where: { userId, order: { lt: oldOrder, gte: newOrder } },
	    data: { order: { increment: 1} }
	  });
	} // else newOrder === oldOrder: do nothing 
      }
      return await tx.category.update({
	where: { id },
	data: partial.data
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
      await tx.category.updateMany({
	where: { userId, order: { gt: category.order } },
	data: { order: { decrement: 1 } }
      });
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
