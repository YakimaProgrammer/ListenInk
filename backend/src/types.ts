import { z } from "zod";

export interface DocId {
  document_id: string
}

export interface Category {
  userId: string,
  color: string,
  name: string,
  id: string
}

export interface Document {
  name: string,
  numpages: number,
  s3key: string,
  bookmarks: Bookmark[],
  //  shares: string[],
  id: string,
  completed: boolean,
  category: Category
}

export interface Bookmark {
  id: string,
  page: number,
  audiotime: number,
  documentId: string,
}

export interface Err  {
  err: string
};

// Validator for DocId
export const DocIdValidator = z.object({
  document_id: z.string().min(1, "document_id must be a non-empty string"),
});

// Validator for Category
export const CategoryValidator = z.object({
  userId: z.string().min(1, "userId must be a non-empty string"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "color must be a valid hex color code"),
  name: z.string().min(1, "name must be a non-empty string"),
  id: z.string().min(1, "id must be a non-empty string"),
});

// Validator for Bookmark
export const BookmarkValidator = z.object({
  page: z
    .number()
    .int()
    .positive("page must be a positive integer"),
  audiotime: z
    .number()
    .nonnegative("audiotime must be a non-negative number"),
  id: z
    .string()
    .min(1, "id must be a non-empty string"),
  documentId: z
    .string()
    .min(1, "id must be a non-empty string"),
});

// Validator for Document
export const DocumentValidator = z.object({
  name: z.string().min(1, "name must be a non-empty string"),
  numpages: z
    .number()
    .int()
    .positive("numpages must be a positive integer"),
  s3key: z.string().min(1, "s3key must be a non-empty string"),
  bookmarks: z.array(BookmarkValidator),
  id: z.string().min(1, "id must be a non-empty string"),
  completed: z.boolean(),
  category: CategoryValidator,
});
