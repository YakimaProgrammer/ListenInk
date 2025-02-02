import { Typography } from "@mui/material";
import { DrawerHeader } from "../../../components/DrawerHeader";
import styles from "./index.module.scss";

interface ContentProps {
  sidebarOpen: boolean;
}
export function Content({ sidebarOpen }: ContentProps) {
  return (
    <main className={`${styles.main} ${sidebarOpen ? styles.mainOpen : ''}`}>
      <DrawerHeader />
      <Typography>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit...
      </Typography>
    </main>
  );
}
