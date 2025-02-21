import { z } from "zod";

export const DocIdSchema = z.object({
  document_id: z.string(),
});
export type DocId = z.infer<typeof DocIdSchema>;

export const CategorySchema = z.object({
  userId: z.string(),
  color: z.string(),
  name: z.string(),
  id: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const BookmarkSchema = z.object({
  id: z.string(),
  page: z.number(),
  audiotime: z.number(),
  documentId: z.string(),
});
export type Bookmark = z.infer<typeof BookmarkSchema>;

export const DocumentSchema = z.object({
  name: z.string(),
  numpages: z.number(),
  s3key: z.string(),
  bookmarks: z.array(BookmarkSchema),
  // shares: z.array(z.string()), // Uncomment if needed
  id: z.string(),
  completed: z.boolean(),
  categoryId: z.string()
});
export type Document = z.infer<typeof DocumentSchema>;

export const ErrSchema = z.object({
  err: z.string(),
});
export type Err = z.infer<typeof ErrSchema>;

export const UserSchema = z.object({
  name: z.string(),
  id: z.string(),
  email: z.string()
});
export type User = z.infer<typeof UserSchema>;
