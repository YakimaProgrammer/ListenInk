import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import { Menu } from "@mui/icons-material";
import { useParams } from "react-router";
import { useSelector } from "react-redux";

import { RootState } from "@/store";
import styles from "./index.module.scss";

interface MenuProps {
  sidebarOpen: boolean;
  setOpen: () => void;
}
export function MenuBar({ sidebarOpen, setOpen }: MenuProps) {
  // I'm not sure if there is a to do this without a hook
  // Seems sus having a redux hook instead a component that
  // is ultimately redux managed :shrug:
  const { docId } = useParams();
  const doc = useSelector((state: RootState) => {
    if (state.categories.status === "success") {
      // We LOVE n^2 traversals on the client-side!
      for (let category of state.categories.categories) {
	for (let doc of category.documents) {
	  if (doc.id === docId) {
	    return doc;
	  }
	}
      }
    }
    return null;
  });

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
          { doc?.name }
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
