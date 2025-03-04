import { IconButton } from "@mui/material";
import styles from "./PdfViewer.module.scss";

export interface PDFViewerProps {
  scale: number;
  src: string;
}

export function PdfViewer({ scale, src }: PDFViewerProps) {
  return (
    <div className={styles.pdfViewer}>
      {/* Entire PDF Viewer Box */}

      <div className={styles.pdfLeftSideView}>
        {/* Left SideBar View */}
        <IconButton className={styles.sideMenuToggle}>
          <i className="bi bi-layout-text-sidebar"></i>
        </IconButton>
      </div>

      <div className={styles.pdfExample}>
        {/* PDF Content Display Page by Page as Image*/}
        <img
          src={src}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
            transition: "transform 0.2s ease",
          }}
          alt="PDF preview"
        />
      </div>
    </div>
  );
}
