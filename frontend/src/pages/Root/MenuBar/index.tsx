import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useDocument } from "@/components/WithDocument";
import styles from "./index.module.scss";
import { Profile } from "@/components/Profile";

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
      <Toolbar>
        {/* Left button to toggle sidebar */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={setOpen}
          edge="start"
          className={`${styles.menuButton} ${sidebarOpen ? styles.hidden : ""}`}
        >
          <MenuIcon />
        </IconButton>

        {/* Document name */}
        <Typography variant="h6" noWrap>
          {doc?.name}
        </Typography>

        {/* Spacer to push Profile to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Profile avatar/dropdown */}
        <Profile />
      </Toolbar>
    </AppBar>
  );
}
