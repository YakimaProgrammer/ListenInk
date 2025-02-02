import { ReactNode } from "react";
import styles from "./index.module.scss";

interface DrawerHeaderProps {
  children?: ReactNode;
};

export function DrawerHeader({ children }: DrawerHeaderProps) {
  return (
    <div className={styles.drawerHeader}>
      { children }
    </div>
  )
}
