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
import { useState, MouseEvent } from "react";

import styles from "./index.module.scss";

interface SidebarProps {
  sidebarOpen: boolean;
  closeSidebar: () => void;
  openDialog: () => void;
}
export function Sidebar({
  sidebarOpen,
  closeSidebar,
  openDialog,
}: SidebarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleAddClick = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  return (
    <Drawer
      className={styles.drawer}
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      classes={{ paper: styles.drawerPaper }}
    >
      <DrawerHeader>
        <IconButton onClick={openDialog}>
          <Search />
        </IconButton>

        <IconButton>
          <Upload />
        </IconButton>

        <IconButton onClick={handleAddClick}>
          <Add />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem /*onClick={handleAddDocument}*/>
            Create New Document
          </MenuItem>
          <MenuItem /*onClick={handleAddCategory}*/>
            Create New Category
          </MenuItem>
        </Menu>

        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={closeSidebar}>
          <ChevronLeft />
        </IconButton>
      </DrawerHeader>

      <Divider />
      <Categories />
    </Drawer>
  );
}
