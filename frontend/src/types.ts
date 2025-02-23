import { z } from "zod";

export const DocIdSchema = z.object({
  document_id: z.string().nanoid(),
});
export type DocId = z.infer<typeof DocIdSchema>;

export const CategorySchema = z.object({
  userId: z.string().nanoid(),
  color: z.string(),
  name: z.string(),
  id: z.string().nanoid(),
});
export type Category = z.infer<typeof CategorySchema>;

export const BookmarkSchema = z.object({
  id: z.string().nanoid(),
  page: z.number().finite().min(0).multipleOf(1),
  audiotime: z.number().finite().min(0),
  documentId: z.string().nanoid(),
});
export type Bookmark = z.infer<typeof BookmarkSchema>;

export const DocumentSchema = z.object({
  name: z.string(),
  numpages: z.number().finite().min(1), // A document must have at least one page
  s3key: z.string(),
  bookmarks: z.array(BookmarkSchema), // I considered a .refine on the overall type to assert that no bookmark pointed beyond `numpages`, but then we couldn't use .partial() for DocumentSchema
  id: z.string().nanoid(),
  completed: z.boolean(),
  categoryId: z.string().nanoid()
})
export type Document = z.infer<typeof DocumentSchema>;

export const ErrSchema = z.object({
  err: z.string(),
});
export type Err = z.infer<typeof ErrSchema>;

export const UserSchema = z.object({
  name: z.string(),
  id: z.string().nanoid(),
  email: z.string().email()
});
export type User = z.infer<typeof UserSchema>;
