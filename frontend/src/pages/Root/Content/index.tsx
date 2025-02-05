import { DrawerHeader } from "@/components/DrawerHeader";
import { PDFViewer } from "@/components/PDFViewer";

import styles from "./index.module.scss";

interface ContentProps {
  sidebarOpen: boolean;
}
export function Content({ sidebarOpen }: ContentProps) {
  return (
    <main className={`${styles.main} ${sidebarOpen ? styles.mainOpen : ''}`}>
      <DrawerHeader />
      <PDFViewer />
    </main>
  );
}
