import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type PDFDropStatus = "neutral" | "hover" | "drop-success" | "drop-failure";

interface UIState {
  sidebarOpen: boolean;
  pdfDropModalOpen: boolean;
  pdfDropModalStatus: PDFDropStatus;
  openCategories: Record<string, boolean | undefined>; // Sets would be fun, but aren't JSON serializable
  searchDialogOpen: boolean;
  searchQuery: string;
}

interface CategoryOpen {
  open: boolean,
  id: string
}

const initialState: UIState = {
  sidebarOpen: true,
  pdfDropModalOpen: false,
  pdfDropModalStatus: "neutral",
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

    setCategory: (state, action: PayloadAction<CategoryOpen>) => {
      state.openCategories[action.payload.id] = action.payload.open;
    },

    setQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSearchDialog: (state, action: PayloadAction<boolean>) => {
      state.searchDialogOpen = action.payload;
    },

    setPdfDropModal: (state, action: PayloadAction<boolean>) => {
      state.pdfDropModalOpen = action.payload;
    },

    setPdfDropStatus: (state, action: PayloadAction<PDFDropStatus>) => {
      state.pdfDropModalStatus = action.payload;
    }
  },
})

export const {
  setSidebar,
  setCategory,
  setQuery,
  setSearchDialog,
  setPdfDropModal,
  setPdfDropStatus
} = uiSlice.actions
export default uiSlice.reducer
