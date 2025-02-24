// -----------------------------------------
// File: src/hooks/useCategories.ts
// -----------------------------------------
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setCurDocument,
  addNewDocument,
  renameDocument,
  addCategory,
  renameCategory,
  deleteCategory,
  deleteDocument,
  attachPdfToDocument,
  moveDocument,
  reorderCategories,
  changeCategoryColor,
} from "@/store/slices/categories";
import { ReshapedCategory, ReducedDoc } from "@/store/slices/categories";

export function useCategories() {
  const dispatch = useDispatch();
  const categoriesState = useSelector((state: RootState) => state.categories);

  // If slice.status === "success", we have actual data
  // Otherwise fallback to empty arrays / null
  let categories: ReshapedCategory[] = [];
  let pdfByDocId: Record<string, File | undefined> = {};
  let curDocumentId: string | null = null;

  if (categoriesState.status === "success") {
    categories = categoriesState.categories;
    pdfByDocId = categoriesState.pdfByDocId;
    curDocumentId = categoriesState.curDocumentId;
  }

  // Flatten docs if you want a direct "documents" array:
  const allDocuments: ReducedDoc[] = categories.flatMap(
    (cat: ReshapedCategory) => cat.documents
  );

  // Find the current doc
  const curDocument = curDocumentId
    ? allDocuments.find((doc: ReducedDoc) => doc.id === curDocumentId)
    : null;

  return {
    categories,
    pdfByDocId,
    curDocument,
    documents: allDocuments,

    // setCurDocument
    setCurDocument: (docId: string | null) => dispatch(setCurDocument(docId)),

    // Add a brand new doc
    addNewDocument: (payload: { name: string; text?: string }) =>
      dispatch(addNewDocument(payload)),

    // Add new category
    addNewCategory: (name: string, color?: string) =>
      dispatch(addCategory({ name, color })),

    // rename category
    renameCategory: (categoryId: string, newName: string) =>
      dispatch(renameCategory({ categoryId, newName })),

    // rename doc
    renameDocument: (docId: string, newName: string) =>
      dispatch(renameDocument({ docId, newName })),

    // delete category
    deleteCategory: (catId: string) => dispatch(deleteCategory(catId)),

    // delete doc
    deleteDocument: (docId: string) => dispatch(deleteDocument(docId)),

    // attach PDF
    attachPdfToDocument: (docId: string, file: File) =>
      dispatch(attachPdfToDocument({ docId, file })),

    // move doc from one cat to another
    moveDocument: (docId: string, sourceCatId: string, targetCatId: string) =>
      dispatch(
        moveDocument({
          docId,
          sourceCategoryId: sourceCatId,
          targetCategoryId: targetCatId,
        })
      ),

    // reorder categories
    reorderCategories: (
      categoryId: string,
      referenceCategoryId: string,
      position: "before" | "after"
    ) =>
      dispatch(
        reorderCategories({ categoryId, referenceCategoryId, position })
      ),

    // change color
    changeCategoryColor: (categoryId: string, color: string) =>
      dispatch(changeCategoryColor({ categoryId, color })),
  };
}
