// FILE: src/store/slices/categories.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { Category, Document } from "@/types";

export type ReducedDoc = Omit<Document, "category"> & {
  /** optional text content for searching */
  text?: string;
};
export type ReshapedCategory = Category & { documents: ReducedDoc[] };

// A simpler shape: everything at top-level
export interface CategoriesState {
  status: "pending" | "success" | "failure";
  message?: string; // for "failure" case
  categories: ReshapedCategory[];
  pdfByDocId: Record<string, File | undefined>;
  curDocumentId: string | null;
}

const initialState: CategoriesState = {
  status: "pending",
  categories: [],
  pdfByDocId: {},
  curDocumentId: null,
};

// Utility to find cat/doc
function findCategoryIndex(list: ReshapedCategory[], catId: string) {
  return list.findIndex((c) => c.id === catId);
}
function findDoc(list: ReshapedCategory[], docId: string) {
  for (let i = 0; i < list.length; i++) {
    const docs = list[i].documents;
    const dIndex = docs.findIndex((d) => d.id === docId);
    if (dIndex !== -1) return { catIndex: i, docIndex: dIndex };
  }
  return null;
}

export const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<ReshapedCategory[]>) => {
      state.status = "success";
      state.categories = action.payload;
      state.pdfByDocId = {};
      state.curDocumentId = null;
    },
    fail: (state, action: PayloadAction<string>) => {
      state.status = "failure";
      state.message = action.payload;
    },

    // 1) setCurDocument
    setCurDocument: (state, action: PayloadAction<string | null>) => {
      if (state.status !== "success") return;
      state.curDocumentId = action.payload;
    },
    // 2) addCategory
    addCategory: (
      state,
      action: PayloadAction<{ name: string; color?: string }>
    ) => {
      if (state.status !== "success") return;
      const { name, color } = action.payload;
      state.categories.push({
        id: nanoid(),
        userId: "",
        name,
        color: color ?? "#005f73",
        documents: [],
      });
    },
    // 3) renameCategory
    renameCategory: (
      state,
      action: PayloadAction<{ categoryId: string; newName: string }>
    ) => {
      if (state.status !== "success") return;
      const { categoryId, newName } = action.payload;
      const idx = findCategoryIndex(state.categories, categoryId);
      if (idx !== -1) {
        state.categories[idx].name = newName;
      }
    },
    // 4) deleteCategory
    deleteCategory: (state, action: PayloadAction<string>) => {
      if (state.status !== "success") return;
      const idx = findCategoryIndex(state.categories, action.payload);
      if (idx !== -1) {
        state.categories.splice(idx, 1);
      }
    },

    // 5) renameDocument
    renameDocument: (
      state,
      action: PayloadAction<{ docId: string; newName: string }>
    ) => {
      if (state.status !== "success") return;
      const found = findDoc(state.categories, action.payload.docId);
      if (found) {
        state.categories[found.catIndex].documents[found.docIndex].name =
          action.payload.newName;
      }
    },
    // 6) deleteDocument
    deleteDocument: (state, action: PayloadAction<string>) => {
      if (state.status !== "success") return;
      const found = findDoc(state.categories, action.payload);
      if (found) {
        state.categories[found.catIndex].documents.splice(found.docIndex, 1);
      }
      // Clear if current doc
      if (state.curDocumentId === action.payload) {
        state.curDocumentId = null;
      }
      delete state.pdfByDocId[action.payload];
    },
    // 7) changeCategoryColor
    changeCategoryColor: (
      state,
      action: PayloadAction<{ categoryId: string; color: string }>
    ) => {
      if (state.status !== "success") return;
      const { categoryId, color } = action.payload;
      const idx = findCategoryIndex(state.categories, categoryId);
      if (idx !== -1) {
        state.categories[idx].color = color;
      }
    },
    // 8) reorderCategories
    reorderCategories: (
      state,
      action: PayloadAction<{
        categoryId: string;
        referenceCategoryId: string;
        position: "before" | "after";
      }>
    ) => {
      if (state.status !== "success") return;
      const { categoryId, referenceCategoryId, position } = action.payload;
      const idx = findCategoryIndex(state.categories, categoryId);
      const refIdx = findCategoryIndex(state.categories, referenceCategoryId);
      if (idx === -1 || refIdx === -1) return;

      const [cat] = state.categories.splice(idx, 1);
      // after removing cat, find new insertion position
      let newRefIndex = state.categories.findIndex(
        (c) => c.id === referenceCategoryId
      );
      if (position === "before") {
        state.categories.splice(newRefIndex, 0, cat);
      } else {
        state.categories.splice(newRefIndex + 1, 0, cat);
      }
    },
    // 9) moveDocument
    moveDocument: (
      state,
      action: PayloadAction<{
        docId: string;
        sourceCategoryId: string;
        targetCategoryId: string;
      }>
    ) => {
      if (state.status !== "success") return;
      const { docId, sourceCategoryId, targetCategoryId } = action.payload;
      if (sourceCategoryId === targetCategoryId) return;
      // find doc
      const srcIdx = findCategoryIndex(state.categories, sourceCategoryId);
      const tgtIdx = findCategoryIndex(state.categories, targetCategoryId);
      if (srcIdx === -1 || tgtIdx === -1) return;
      const docs = state.categories[srcIdx].documents;
      const docIdx = docs.findIndex((d) => d.id === docId);
      if (docIdx === -1) return;

      const [movedDoc] = docs.splice(docIdx, 1);
      state.categories[tgtIdx].documents.push(movedDoc);
    },
    // 10) attachPdfToDocument
    attachPdfToDocument: (
      state,
      action: PayloadAction<{ docId: string; file: File }>
    ) => {
      if (state.status !== "success") return;
      state.pdfByDocId[action.payload.docId] = action.payload.file;
    },
    // 11) addNewDocument
    addNewDocument: (
      state,
      action: PayloadAction<{ name: string; text?: string }>
    ) => {
      if (state.status !== "success") return;
      const { name } = action.payload;
      // find or create "Uncategorized"
      let uncategorizedIndex = state.categories.findIndex(
        (cat) => cat.name === "Uncategorized"
      );
      if (uncategorizedIndex === -1) {
        state.categories.push({
          id: nanoid(),
          userId: "",
          color: "#888888",
          name: "Uncategorized",
          documents: [],
        });
        uncategorizedIndex = state.categories.length - 1;
      }
      const docId = nanoid();
      state.categories[uncategorizedIndex].documents.push({
        id: docId,
        name,
        s3key: "",
        numpages: 0,
        bookmarks: [],
        completed: false,
      });
    },
  },
});

export const {
  setCategories,
  fail,
  setCurDocument,
  addCategory,
  renameCategory,
  deleteCategory,
  renameDocument,
  deleteDocument,
  changeCategoryColor,
  reorderCategories,
  moveDocument,
  attachPdfToDocument,
  addNewDocument,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
