import { PdfTopView } from "./PdfTopView";
import { PdfViewer } from "./PdfViewer";
import styles from "./index.module.scss";

export function PDFViewer() {
  return (
    <div className={styles.mainPdf}>
      <PdfTopView
        currentPage={3}
        totalPages={20}
        zoomLevel={100}
        onPageChange={() => {}}
        onZoomChange={() => {}}
      />
      <PdfViewer scale={1} src="TODO" />
    </div>
  );
}
