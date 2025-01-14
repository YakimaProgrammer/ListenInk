import { configureStore } from '@reduxjs/toolkit'
import docsReducer from './slices/docs';

export const store = configureStore({
  reducer: {
    docs: docsReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export { setCreds, fail as authFail } from "./slices/auth";
export { setCategories, fail as docsFail } from "./slices/docs";
