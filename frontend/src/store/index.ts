import { configureStore } from '@reduxjs/toolkit'
import categoriesReducer from "./slices/categories";
import authReducer from "./slices/auth";
import uiReducer from "./slices/ui";

export const store = configureStore({
  reducer: {
    categories: categoriesReducer,
    auth: authReducer,
    ui: uiReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { fetchProfile, logout } from "./slices/auth";
export { fetchDocuments } from "./slices/categories";

export {
  setSidebar,
  setCategory,
  setQuery,
  setSearchDialog,
  setPdfDropModal,
  setPdfDropStatus,
} from "./slices/ui";

export type {
  PDFDropStatus
} from "./slices/ui";

export {
  setIsPlaying,
  setPlaybackSpeed,
  upsertBookmark,
  updateDocument,
  upsertCategory,
  createDocument,
  deleteCategory,
  deleteDocument
} from "./slices/categories";
