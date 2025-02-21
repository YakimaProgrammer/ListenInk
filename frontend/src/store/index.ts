import { configureStore } from '@reduxjs/toolkit'
import categoriesReducer, { fetchDocuments } from "./slices/categories";
import authReducer, { fetchProfile } from "./slices/auth";
import uiReducer from "./slices/ui";

export const store = configureStore({
  reducer: {
    categories: categoriesReducer,
    auth: authReducer,
    ui: uiReducer
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export {
  setSidebar,
  setCategory,
  setQuery,
  setSearchDialog,
} from "./slices/ui";

export {
  setIsPlaying,
  setPlaybackSpeed,
  setPlaybackPosition
} from "./slices/categories";


window.addEventListener("load",  async () => {
  try {
    //fetchProfiles populates the auth slice and sets the necessary cookies for fetchDocuments
    await store.dispatch(fetchProfile()).unwrap();
    await store.dispatch(fetchDocuments()).unwrap();
  } catch (err) {
    console.error("Error during page load:", err);
  }
});
