import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { Category } from '../../types';
import { PromiseState } from '../helper-types';

interface CategoriesSuccessState {
  categories: Category[]
}

export type CategoriesState = PromiseState<CategoriesSuccessState>;

const initialState = { status: "pending" } as CategoriesState;

export const categoriesSlice = createSlice({
  name: 'categories',
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
export const { setCategories, fail } = categoriesSlice.actions

export default categoriesSlice.reducer
