import { Drawer, IconButton, Divider, Box } from '@mui/material';
import { ChevronLeft, Search, Upload } from "@mui/icons-material";
import { DrawerHeader } from "@/components/DrawerHeader";
import { Categories } from '../Categories';

import styles from "./index.module.scss";

interface SidebarProps {
  sidebarOpen: boolean;
  closeSidebar: () => void;
  openDialog: () => void;
}
export function Sidebar({ sidebarOpen, closeSidebar, openDialog }: SidebarProps) {
  return (
    <Drawer
      className={styles.drawer}
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      classes={{ paper: styles.drawerPaper }}
    >
      <DrawerHeader>
	{/* Left: search and upload */}
	<IconButton onClick={openDialog}>
	  <Search />
	</IconButton>
	<IconButton>
	  <Upload />
	</IconButton>

	{/* Spacer to push the menu button to the right */}
        <Box sx={{ flexGrow: 1 }} />

	{/* Right: menu button */}
	<IconButton onClick={closeSidebar}>
          <ChevronLeft />
        </IconButton>
      </DrawerHeader>
      
      <Divider />
      <Categories />
    </Drawer>
  );
}
