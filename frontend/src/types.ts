import { z, ZodTypeAny } from "zod";

function toDiscriminatedError<
  T extends ZodTypeAny
>(data: T) {
  return z.discriminatedUnion('success', [
    z.object({
      success: z.literal(true),
      data,
    }),
    z.object({
      success: z.literal(false),
      err: z.string(),
    }),
  ]);
}

// For a while, I considered deriving this from `toDiscriminatedError`, but there is little point
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; err: string };

export const NaturalNumber = z.number().finite().min(0).multipleOf(1);
const id = z.string().nanoid();

export const DocIdSchema = z.object({
  document_id: id,
});
export type DocId = z.infer<typeof DocIdSchema>;
export const DocIdOrErrSchema = toDiscriminatedError(DocIdSchema);
export type DocIdOrErr = z.infer<typeof DocIdOrErrSchema>;

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


export const UserSchema = z.object({
  name: z.string(),
  id: z.string(), // Kludge - for users, an id is either a nanoid for a local user or a prefixed external id for identity providers. I really don't wanna deal with multiple tables just to map user ids when there is no clear benefit.
  email: z.string().email(),
  profile_picture: z.string().url()
  
});
export type User = z.infer<typeof UserSchema>;
export const UserOrErrSchema = toDiscriminatedError(UserSchema);
export type UserOrError = z.infer<typeof UserOrErrSchema>;
