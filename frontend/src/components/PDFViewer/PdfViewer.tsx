import { IconButton } from "@mui/material";
import styles from "./PdfViewer.module.scss";
import { useRef, useState } from "react";

export interface PDFViewerProps {
  scale: number;
  src: string;
}

export function PdfViewer({ scale, src }: PDFViewerProps) {
  const displayPDfPageRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const handlePdfPageOnLoad = () => {
    const displayPdfPage = displayPDfPageRef.current;
    if (displayPdfPage) {
      setNaturalSize({
        width: displayPdfPage.naturalWidth,
        height: displayPdfPage.naturalHeight,
      });
    }
  };

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
          ref={displayPDfPageRef}
          onLoad={handlePdfPageOnLoad}
          style={{
            width: naturalSize.width * (scale / 100),
            height: naturalSize.height * (scale / 100),
          }}
          alt="PDF preview"
        />
      </div>
    </div>
  );
}
