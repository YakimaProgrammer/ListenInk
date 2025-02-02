import { Typography } from "@mui/material";
import styles from "./index.module.scss";
import shared from "../shared.module.scss";

interface ContentProps {
  sidebarOpen: boolean;
}
export function Content({ sidebarOpen }: ContentProps) {
  return (
    <main className={`${styles.main} ${sidebarOpen ? styles.mainOpen : ''}`}>
      <div className={shared.drawerHeader} />
      <Typography>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit...
      </Typography>
    </main>
  );
}
