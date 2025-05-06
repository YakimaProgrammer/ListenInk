import { Prisma } from "@prisma/client";

type OrderAction = 
  | { type: 'insert'; position?: number }
  | { type: 'move'; oldPosition: number; newPosition: number }
  | { type: 'delete'; position: number };

type ReorderOptions = {
  tx: Prisma.TransactionClient;
  groupId: string;
  action: OrderAction;
} & (
  // For a crumb of safety since I'm reaching directly into Prisma blindly
  { table: 'document', groupField: 'categoryId' }
  | { table: 'bookmark', groupField: 'documentId' }
  | { table: 'category', groupField: 'userId' }
);

/** A very dangerous helper method for inserting, moving, and deleting records
 * Warning: this method is not typechecked
 * It is the caller's responsibility to actually write the new index into the record / delete it
 */
export async function reorderItems({
  tx,
  table,
  groupField,
  groupId,
  action
}: ReorderOptions): Promise<number> {
  // @ts-ignore
  const maxOrder = await tx[table].aggregate({
    where: { [groupField]: groupId },
    _max: { order: true }
  });

  const max: number = maxOrder._max.order ?? -1;

  if (action.type === 'insert') {
    const position = action.position ?? max + 1;

    if (position < max + 1) {
      // @ts-ignore
      await tx[table].updateMany({
        where: {
          [groupField]: groupId,
          order: { gte: position }
        },
        data: { order: { increment: 1 } }
      });
    }

    return position;
  }

  if (action.type === 'move') {
    const { oldPosition, newPosition } = action;

    if (newPosition === oldPosition) return oldPosition;

    if (newPosition < oldPosition) {
      // @ts-ignore
      await tx[table].updateMany({
        where: {
          [groupField]: groupId,
          order: { gte: newPosition, lt: oldPosition }
        },
        data: { order: { increment: 1 } }
      });
    } else {
      // @ts-ignore
      await tx[table].updateMany({
        where: {
          [groupField]: groupId,
          order: { gt: oldPosition, lte: newPosition }
        },
        data: { order: { decrement: 1 } }
      });
    }

    return newPosition;
  }

  if (action.type === 'delete') {
    // @ts-ignore
    await tx[table].updateMany({
      where: {
        [groupField]: groupId,
        order: { gt: action.position }
      },
      data: { order: { decrement: 1 } }
    });

    return action.position;
  }

  throw new Error("Unknown reorder action");
}
