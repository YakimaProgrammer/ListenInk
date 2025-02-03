import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  openCategories: Record<string, boolean>; // Sets would be fun, but aren't JSON serializable
  searchDialogOpen: boolean;
  searchQuery: string;
}

interface CategoryStateChange {
  id: string;
  open: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  openCategories: {},
  searchDialogOpen: false,
  searchQuery: ""
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    setCategory: (state, action: PayloadAction<CategoryStateChange>) => {
      if (action.payload.open) {
	state.openCategories[action.payload.id] = true;
      } else {
	state.openCategories[action.payload.id] = false;
      }
    },

    setQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSearchDialog: (state, action: PayloadAction<boolean>) => {
      state.searchDialogOpen = action.payload;
    }
  },
})

export const { setSidebar, setCategory, setQuery, setSearchDialog } = uiSlice.actions
export default uiSlice.reducer
