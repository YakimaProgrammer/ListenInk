import { configureStore } from '@reduxjs/toolkit'
import categoriesReducer from "./slices/categories";
import authReducer from "./slices/auth";
import uiReducer from "./slices/ui";
import { fetchData } from './thunks';

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

export { setCreds, fail as authFail } from "./slices/auth";
export { setCategories, fail as docsFail } from "./slices/categories";
export { setSidebar, setCategory, setQuery, setSearchDialog } from "./slices/ui";

window.addEventListener("load", () => store.dispatch(fetchData()));
