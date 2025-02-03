import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  openCategories: Record<string, boolean>; // Sets would be fun, but aren't JSON serializable
}

interface CategoryStateChange {
  id: string;
  open: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  openCategories: {}
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
    }
  },
})

export const { setSidebar, setCategory } = uiSlice.actions
export default uiSlice.reducer
