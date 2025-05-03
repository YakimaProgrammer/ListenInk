// src/pages/Root/Sidebar/index.tsx
import { useRef, useState, MouseEvent, ChangeEvent } from "react";
import {
  Drawer,
  IconButton,
  Divider,
  Box,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  ChevronLeft,
  Search,
  Upload,
  Add,
  Book,
  AutoStories,
  FolderSpecial,
  Description,
} from "@mui/icons-material";
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

// Redux connection
const mapStateToProps = (state: RootState) => ({
  sidebarOpen: state.ui.sidebarOpen,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  createNewCategory: () =>
    dispatch(upsertCategory({ name: "New Category", color: "#457b9d" })),
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

  // Handle file input
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
    <Drawer
      className={styles.drawer}
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      classes={{ paper: styles.drawerPaper }}
    >
      {/* Custom Header */}
      <Box className={styles.headerContainer}>
        {/* App Title/Logo */}
        {/* <Box className={styles.titleArea}>
          <AutoStories className={styles.logoIcon} />
          <Typography className={styles.appTitle}>ListenInk</Typography>
        </Box> */}
        {/* App Title/Logo */}
        <Box className={styles.titleArea}>
          <img
            src="/listenink_white.PNG"
            alt="ListenInk Logo"
            className={styles.customLogo}
          />
        </Box>

        {/* Action Buttons */}
        <Box className={styles.actionButtons}>
          <IconButton
            onClick={openDialog}
            className={styles.iconButton}
            size="small"
          >
            <Search />
          </IconButton>

          {/* <IconButton
            onClick={handleUploadClick}
            className={styles.iconButton}
            size="small"
          >
            <Upload />
          </IconButton> */}

          <IconButton
            onClick={handleAddClick}
            className={styles.iconButton}
            size="small"
          >
            <Add />
          </IconButton>

          <IconButton
            onClick={closeSidebar}
            className={styles.iconButton}
            size="small"
          >
            <ChevronLeft />
          </IconButton>
        </Box>

        {/* Hidden file input */}
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Add Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          PaperProps={{
            elevation: 3,
            sx: {
              borderRadius: "8px",
              mt: 1,
              "& .MuiMenuItem-root": {
                px: 2,
                py: 1,
                borderRadius: "4px",
                mx: 1,
                my: 0.5,
                fontSize: "14px",
              },
            },
          }}
        >
          <MenuItem onClick={handleUploadClick}>
            <Description fontSize="small" sx={{ mr: 1 }} />
            Create New Document
          </MenuItem>
          <MenuItem onClick={handleCategoryClick}>
            <FolderSpecial fontSize="small" sx={{ mr: 1 }} />
            Create New Category
          </MenuItem>
        </Menu>
      </Box>

      <Divider />

      {/* Categories with enhanced styling will be handled in the Categories component */}
      <Box className={styles.categoriesContainer}>
        <Categories />
      </Box>
    </Drawer>
  );
}

export const Sidebar = connector(SidebarComponent);
