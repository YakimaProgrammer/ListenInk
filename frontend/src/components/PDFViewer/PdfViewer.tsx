// Inside your PdfViewer.tsx file

import { useEffect, useRef, WheelEvent } from "react";
import styles from "./PdfViewer.module.scss";

interface PdfViewerProps {
  scale: number;
  docId: string;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PdfViewer({
  scale,
  docId,
  totalPages,
  currentPage,
  onPageChange,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Create array of all pages
  const allPages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className={styles.pdfViewer}>
      <div ref={containerRef} className={styles.pdfScrollContainer}>
        <div className={styles.multiPageContainer}>
          {allPages.map((pageNum) => (
            <div
              key={pageNum}
              className={`${styles.pdfPage} ${
                pageNum === currentPage ? styles.currentPage : ""
              }`}
              id={`page-${pageNum}`}
            >
              <img
                src={`/api/v1/docs/${docId}/pages/${pageNum}/image`}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s ease",
                  width: "100%",
                }}
                alt={`PDF page ${pageNum + 1}`}
                loading="lazy"
              />
              <div className={styles.pageNumber}>{pageNum + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
