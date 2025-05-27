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
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);


  useEffect(() => {
    imageRefs.current = imageRefs.current.slice(0, totalPages);

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let visibleIndex: number | null = null;

        entries.forEach((entry) => {
	  if (entry.isIntersecting) {
            if (entry.intersectionRatio > maxRatio) {
	      if (entry.target instanceof HTMLImageElement) {
		if (entry.target.dataset.index !== undefined) {
		  maxRatio = entry.intersectionRatio;
		  visibleIndex = Number(entry.target.dataset.index);
		}
	      }
            }
	  }
        });

        if (visibleIndex !== null && currentPage !== visibleIndex && maxRatio > 0.4) {
          onPageChange(visibleIndex);
        }
      },
      {
        root: containerRef.current,
        threshold: Array.from({ length: 6 }, (_, i) => i / 5), // granularity
      }
    );

    imageRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [docId, totalPages]);
  
  // Create array of all pages
  const allPages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className={styles.pdfViewer}>
      <div ref={containerRef} className={styles.pdfScrollContainer}>
        <div className={styles.multiPageContainer}>
          {allPages.map((pageNum) => (
            <div
              key={pageNum}
              className={styles.pdfPage}
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
		ref={(el) => { imageRefs.current[pageNum] = el }}
		data-index={pageNum}
              />
              <div
                className={`${styles.pageNumber} ${
                  pageNum === currentPage ? styles.currentPage : styles.noncurrentPage
              }`}
              >
                {pageNum + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
