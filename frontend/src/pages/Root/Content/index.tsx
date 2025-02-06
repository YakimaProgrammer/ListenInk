import { DrawerHeader } from "@/components/DrawerHeader";
import { PDFViewer } from "@/components/PDFViewer";
import { AudioControls } from "@/components/AudioControls";

import styles from "./index.module.scss";
import { useDocument } from "@/components/WithDocument";

interface ContentProps {
  sidebarOpen: boolean;
}
export function Content({ sidebarOpen }: ContentProps) {
  const doc = useDocument();

  const elems = (
    <>
      <PDFViewer />
      <AudioControls />
    </>
  );
  
  return (
    <main className={`${styles.main} ${sidebarOpen ? styles.mainOpen : ''}`}>
      <DrawerHeader />
      {(doc?.id !== undefined) ? elems : null}
    </main>
  );
}
