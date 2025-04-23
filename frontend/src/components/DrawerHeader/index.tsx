// src/components/DrawerHeader/index.tsx
import { ReactNode } from "react";
import { Box } from "@mui/material";
import styles from "./index.module.scss";

interface DrawerHeaderProps {
  children?: ReactNode;
}

export function DrawerHeader({ children }: DrawerHeaderProps) {
  return <Box className={styles.drawerHeader}>{children}</Box>;
}
