import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean
}

const initialState: UIState = {
  sidebarOpen: true
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
})

export const { setSidebar } = uiSlice.actions
export default uiSlice.reducer
