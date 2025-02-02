import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import { Menu } from "@mui/icons-material";
import styles from "./index.module.scss";

interface MenuProps {
  sidebarOpen: boolean;
  setOpen: () => void;
}
export function MenuBar({ sidebarOpen, setOpen }: MenuProps) {
  return (
    <AppBar position="fixed" className={`${styles.appBar} ${sidebarOpen ? styles.appBarOpen : ''}`}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={setOpen}
          edge="start"
          className={`${styles.menuButton} ${sidebarOpen ? styles.hidden : ''}`}
        >
         <Menu />
        </IconButton>
        <Typography variant="h6" noWrap>
          Persistent drawer
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
