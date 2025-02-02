import { configureStore } from '@reduxjs/toolkit'
import categoriesReducer from "./slices/categories";
import authReducer from "./slices/auth";
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
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export { setCreds, fail as authFail } from "./slices/auth";
export { setCategories, fail as docsFail } from "./slices/categories";
export { setSidebar } from "./slices/ui";
