import { Router, Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { Category, CategorySchema, Err } from "./types";
import { APIError } from "./error";

const prisma = new PrismaClient();

async function maxCategoryOrder(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<number | null> {
  const result = await tx.category.aggregate({
    where: { userId },
    _max: { order: true },
  });
  return result._max.order;
}

export const router = Router();
router.get("/", async (req: Request, res: Response<Category[]>) => {
  const categories: Category[] = await prisma.category.findMany({
    where: {
      userId: req.cookies.userId,
    },
    orderBy: { order: "asc" },
  });

  res.status(200).send(categories);
});

router.post("/", async (req: Request, res: Response<Category | Err>) => {
  try {
    const category: Category = await prisma.$transaction(async (tx) => {
      const userId = req.cookies.userId;
      const maxOrder = await maxCategoryOrder(tx, userId);
      if (maxOrder === null) {
        throw new Error(
          `Unable to get the maximum order value for user ${userId}`
        );
      }
      const partial = CategorySchema.omit({ id: true, userId: true })
        .partial({ order: true })
        .safeParse(req.body);
      if (!partial.success) {
        throw new APIError({ err: partial.error.message });
      }
      const newOrder = partial.data.order;
      if (newOrder !== undefined) {
        // +1 because the user could be *very* explicit about wanting to append
        if (newOrder > maxOrder + 1) {
          throw new APIError({
            err: "Tried to create a new category out of bounds!",
          });
        }

        await tx.category.updateMany({
          where: { userId, order: { gte: newOrder } },
          data: { order: { increment: 1 } },
        });
      }

      return await tx.category.create({
        data: {
          ...partial.data,
          userId,
          order: newOrder ?? maxOrder + 1,
        },
      });
    });

    res.status(200).send(category);
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ err: "An unknown error occured!" });
    }
  }
});

router.patch("/:catid", async (req: Request, res: Response<Category | Err>) => {
  try {
    const category: Category = await prisma.$transaction(async (tx) => {
      const userId = req.cookies.userId;
      const id = req.params.catid;
      const category = await prisma.category.findUnique({ where: { id } });
      if (category === null || category.userId !== userId) {
        throw new APIError({ err: "Not found!" });
      }
      const partial = CategorySchema.omit({ id: true, userId: true })
        .partial()
        .safeParse(req.body);
      if (!partial.success) {
        throw new APIError({ err: partial.error.message });
      }
      const newOrder = partial.data.order;
      const oldOrder = category.order;
      if (newOrder !== undefined) {
        const maxOrder = await maxCategoryOrder(tx, userId);
        if (maxOrder === null) {
          throw new Error(
            `Unable to get the maximum order value for user ${userId}`
          );
        }
        if (newOrder > maxOrder) {
          throw new APIError({ err: "Cannot move a category out of bounds!" });
        }
        if (newOrder > oldOrder) {
          await tx.category.updateMany({
            where: { userId, order: { gt: oldOrder, lte: newOrder } },
            data: { order: { decrement: 1 } },
          });
        } else if (newOrder < oldOrder) {
          await tx.category.updateMany({
            where: { userId, order: { lt: oldOrder, gte: newOrder } },
            data: { order: { increment: 1 } },
          });
        } // else newOrder === oldOrder: do nothing
      }
      return await tx.category.update({
        where: { id },
        data: partial.data,
      });
    });

    res.status(200).send(category);
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ err: "An unknown error occured!" });
    }
  }
});

router.delete("/:catid", async (req: Request, res: Response<Err>) => {
  try {
    await prisma.$transaction(async (tx) => {
      const id = req.params.catid;
      const userId = req.cookies.userId;
      const category = await tx.category.findUnique({ where: { id } });
      if (category === null || category.userId !== userId) {
        throw new APIError({ err: "Not found!" });
      }
      await tx.category.updateMany({
        where: { userId, order: { gt: category.order } },
        data: { order: { decrement: 1 } },
      });
      await tx.category.delete({
        where: { id },
      });
    });
    res.status(204).send();
  } catch (e: unknown) {
    if (e instanceof APIError) {
      res.status(400).send(e.details);
    } else {
      res.status(500).send({ err: "An unknown error occured!" });
    }
  }
});
