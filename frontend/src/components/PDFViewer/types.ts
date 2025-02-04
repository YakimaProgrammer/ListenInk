export interface PDFViewerProps {
  scale?: number;
}

export interface PdfTopViewProps {
  currentPage?: number;
  totalPages?: number;
  zoomLevel?: number;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
}
