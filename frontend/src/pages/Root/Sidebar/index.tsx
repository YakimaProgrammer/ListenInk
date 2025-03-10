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
import {
  AppDispatch,
  createDocument,
  RootState,
  setSearchDialog,
  setSidebar,
  upsertCategory,
} from "@/store";
import { useNavigate } from "react-router";
import { urlFor } from "@/pages/urlfor";
import { useDocument } from "@/components/WithDocument";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// If you want to read something from Redux, do so here
const mapStateToProps = (state: RootState) => ({
  sidebarOpen: state.ui.sidebarOpen,
});
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  createNewCategory: () =>
    dispatch(upsertCategory({ name: "New Category", color: "#888888" })),
  closeSidebar: () => dispatch(setSidebar(false)),
  openDialog: () => dispatch(setSearchDialog(true)),
  createDoc: (file: File, categoryId?: string) =>
    dispatch(createDocument({ file, categoryId })),
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function SidebarComponent({
  sidebarOpen,
  closeSidebar,
  openDialog,
  createNewCategory,
  createDoc,
}: PropsFromRedux) {
  const navigate = useNavigate();
  const activeDocument = useDocument();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // For the "Upload" button
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddClick = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleCloseMenu = () => setAnchorEl(null);
  // When user clicks the Upload icon
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      handleCloseMenu();
    }
  };

  // Actually handle the file input
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so we can re-upload same file if needed
    if (!file) return;
    const doc = await createDoc(file, activeDocument?.id);
    if (typeof doc.payload !== "string" && doc.payload !== undefined) {
      navigate(urlFor("docs", doc.payload.id));
    }
  };

  const handleCategoryClick = () => {
    createNewCategory();
    handleCloseMenu();
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
            <MenuItem onClick={handleUploadClick}>Create New Document</MenuItem>
            <MenuItem onClick={handleCategoryClick}>
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
    </DndProvider>
  );
}

export const Sidebar = connector(SidebarComponent);
