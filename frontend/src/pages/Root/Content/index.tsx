// --- frontend/src/pages/Root/Content/index.tsx ---
import { useEffect } from "react";
import { DrawerHeader } from "@/components/DrawerHeader";
import { PDFViewer } from "@/components/PDFViewer";
import { AudioControls } from "@/components/AudioControls";
import { useDocument } from "@/components/WithDocument";
import styles from "./index.module.scss";
import PDFDropModal from "@/components/PDFDropModal";
import { AppDispatch, RootState, setPdfDropModal } from "@/store";
import { connect, ConnectedProps } from "react-redux";

const mapState = (state: RootState) => ({
  sidebarOpen: state.ui.sidebarOpen,
});

const mapDispatch = (dispatch: AppDispatch) => ({
  setPdfModalOpen: (open: boolean) => dispatch(setPdfDropModal(open)),
});
const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

function ContentComponent({ sidebarOpen, setPdfModalOpen }: PropsFromRedux) {
  const doc = useDocument();

  useEffect(() => {
    let dragCounter = 0;
    const handleDragEnter = (e: DragEvent) => {
      // Only if user is dragging "Files"
      if (
        e.dataTransfer &&
        Array.from(e.dataTransfer.types).includes("Files")
      ) {
        dragCounter++;
        setPdfModalOpen(true);
      }
    };
    const handleDragLeave = () => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setPdfModalOpen(false);
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = () => {
      dragCounter = 0;
      setPdfModalOpen(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [setPdfModalOpen]);

  return (
    <main className={`${styles.main} ${sidebarOpen ? styles.mainOpen : ""}`}>
      <DrawerHeader />

      {/* If doc is selected, show PDF + Audio. Else show empty. */}
      {/* makes sure that the pdfViewer is centered */}
      {doc ? (
        <>
          <div className={styles.pdfViewerPosition}>
            <PDFViewer />
          </div>

          <AudioControls />
        </>
      ) : (
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          No Document Selected. Drag & drop a PDF to create one, or pick from
          the Sidebar.
        </p>
      )}

      <PDFDropModal />
    </main>
  );
}

export const Content = connector(ContentComponent);
