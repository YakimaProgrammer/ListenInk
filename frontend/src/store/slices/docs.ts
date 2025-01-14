import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { Category } from '../../types';
import { PromiseState } from '../helper-types';

interface DocsSuccessState {
  categories: Category[]
}

type DocsState = PromiseState<DocsSuccessState>;

const initialState = { status: "pending" } as DocsState;

export const docsSlice = createSlice({
  name: 'docs',
  initialState,
  reducers: {
    setCategories: (_, action: PayloadAction<Category[]>) => {
      return { status: "success", categories: action.payload };
    },

    fail: (_, action: PayloadAction<string>) => {
      return { status: "failure", message: action.payload }
    }
  },
})

// Action creators are generated for each case reducer function
export const { setCategories, fail } = docsSlice.actions

export default docsSlice.reducer
