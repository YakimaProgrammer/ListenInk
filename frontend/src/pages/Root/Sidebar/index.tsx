// --------------------------------------------------
// File: src/pages/Root/Sidebar/index.tsx
// --------------------------------------------------
import { useRef, useState, MouseEvent, ChangeEvent } from "react";
import {
  Drawer,
  IconButton,
  Divider,
  Box,
  Menu,
  MenuItem,
} from "@mui/material";
import { ChevronLeft, Search, Upload, Add } from "@mui/icons-material";
import { DrawerHeader } from "@/components/DrawerHeader";
import { Categories } from "../Categories";
import styles from "./index.module.scss";
import { connect, ConnectedProps } from "react-redux";
import { AppDispatch, RootState, setSidebar } from "@/store";
import {
  attachPdfToDocument,
  addNewDocument,
  renameDocument,
  setCurDocument,
  addCategory,
} from "@/store/slices/categories";

interface SidebarOwnProps {
  sidebarOpen: boolean;
  closeSidebar: () => void;
  openDialog: () => void; // for the search dialog
}

// If you want to read something from Redux, do so here
const mapStateToProps = (state: RootState) => ({});
const mapDispatchToProps = (dispatch: AppDispatch) => ({});
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
type SidebarProps = SidebarOwnProps & PropsFromRedux;

function SidebarComponent({
  sidebarOpen,
  closeSidebar,
  openDialog,
}: SidebarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // For the "Upload" button
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddClick = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleCloseMenu = () => setAnchorEl(null);

  // Actually create a new doc
  const handleCreateDocument = () => {
    // We'll dispatch the "addNewDocument" action from our categories slice
    window.store.dispatch(
      addNewDocument({ name: "New Document" }) // you can pass text if you want
    );
    handleCloseMenu();
  };

  // Create a new category
  const handleCreateCategory = () => {
    // We'll dispatch "addCategory"
    // color is optional, or default #888
    window.store.dispatch(
      addCategory({ name: "New Category", color: "#888888" })
    );
    handleCloseMenu();
  };

  // When user clicks the Upload icon
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Actually handle the file input
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so we can re-upload same file if needed
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed!");
      return;
    }
    const newName = file.name.replace(/\.pdf$/i, "");
    // If we have a "current doc", see if it has a PDF
    const st = window.store.getState();
    const curDocId = st.categories.curDocumentId; // might be null

    if (curDocId && st.categories.pdfByDocId[curDocId]) {
      // The doc has a PDF => create a new doc
      const newDocName = newName || "UploadedDoc";
      window.store.dispatch(addNewDocument({ name: newDocName }));
      // The new doc is presumably the last doc in the "Uncategorized"?
      // or get doc ID from your slice logic
      // we can generate an ID manually if we want
      const newDocId = "doc-" + Date.now();
      window.store.dispatch(setCurDocument(newDocId));
      window.store.dispatch(attachPdfToDocument({ docId: newDocId, file }));
      alert(`Created new doc "${newDocName}" from PDF (existing doc had PDF).`);
    } else if (curDocId) {
      // doc has no PDF => attach + rename
      window.store.dispatch(attachPdfToDocument({ docId: curDocId, file }));
      window.store.dispatch(renameDocument({ docId: curDocId, newName }));
      alert(`Attached PDF to current doc + renamed to "${newName}".`);
    } else {
      // No current doc => create a brand new doc
      const newDocName = newName || "UploadedDoc";
      window.store.dispatch(addNewDocument({ name: newDocName }));
      const newDocId = "doc-" + Date.now();
      window.store.dispatch(setCurDocument(newDocId));
      window.store.dispatch(attachPdfToDocument({ docId: newDocId, file }));
      alert(`Created new doc "${newDocName}" and attached PDF.`);
    }
  };

  return (
    <Drawer
      className={styles.drawer}
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      classes={{ paper: styles.drawerPaper }}
    >
      <DrawerHeader>
        {/* Search Dialog */}
        <IconButton onClick={openDialog}>
          <Search />
        </IconButton>

        {/* Upload PDF */}
        <IconButton onClick={handleUploadClick}>
          <Upload />
        </IconButton>

        {/* Hidden <input> for PDF upload */}
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Add new doc/cat */}
        <IconButton onClick={handleAddClick}>
          <Add />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={handleCreateDocument}>
            Create New Document
          </MenuItem>
          <MenuItem onClick={handleCreateCategory}>
            Create New Category
          </MenuItem>
        </Menu>

        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={closeSidebar}>
          <ChevronLeft />
        </IconButton>
      </DrawerHeader>

      <Divider />

      {/* Let <Categories /> handle right-click rename, drag, reorder, etc. */}
      <Categories />
    </Drawer>
  );
}

export const Sidebar = connector(SidebarComponent);
