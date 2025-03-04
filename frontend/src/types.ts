import { z } from "zod";

export const NaturalNumber = z.number().finite().min(0).multipleOf(1);
const id = z.string().nanoid();

export const DocIdSchema = z.object({
  document_id: id,
});
export type DocId = z.infer<typeof DocIdSchema>;

export const CategorySchema = z.object({
  userId: id,
  color: z.string(),
  name: z.string(),
  id: id,
  order: NaturalNumber
});
export type Category = z.infer<typeof CategorySchema>;

export const BookmarkSchema = z.object({
  id: id,
  page: NaturalNumber,
  audiotime: z.number().finite().min(0),
  documentId: id,
  order: NaturalNumber
});
export type Bookmark = z.infer<typeof BookmarkSchema>;

export const DocumentSchema = z.object({
  name: z.string(),
  numpages: NaturalNumber.min(1), // A document must have at least one page
  s3key: z.string(),
  bookmarks: z.array(BookmarkSchema), // I considered a .refine on the overall type to assert that no bookmark pointed beyond `numpages`, but then we couldn't use .partial() for DocumentSchema
  id: id,
  completed: z.boolean(),
  categoryId: id,
  order: NaturalNumber
})
export type Document = z.infer<typeof DocumentSchema>;

export const ErrSchema = z.object({
  err: z.string(),
});
export type Err = z.infer<typeof ErrSchema>;

export const UserSchema = z.object({
  name: z.string(),
  id: id,
  email: z.string().email()
});
export type User = z.infer<typeof UserSchema>;
