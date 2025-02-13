import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import { Menu } from "@mui/icons-material";
import { useDocument } from "@/components/WithDocument";
import styles from "./index.module.scss";
import Profile from "@/components/Profile/Profile";

interface MenuProps {
  sidebarOpen: boolean;
  setOpen: () => void;
}
export function MenuBar({ sidebarOpen, setOpen }: MenuProps) {
  const doc = useDocument();

  return (
    <AppBar
      position="fixed"
      className={`${styles.appBar} ${sidebarOpen ? styles.appBarOpen : ""}`}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={setOpen}
          edge="start"
          className={`${styles.menuButton} ${sidebarOpen ? styles.hidden : ""}`}
        >
          <Menu />
        </IconButton>
        <Typography variant="h6" noWrap>
          {doc?.name}
        </Typography>
        <div className="alignRight">
          <Profile />
        </div>
      </Toolbar>
    </AppBar>
  );
}
