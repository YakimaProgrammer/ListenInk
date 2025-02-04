import { ViewSidebar } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import styles from './PdfViewer.module.scss';

export interface PDFViewerProps {
  scale: number;
  src: string;
}

export function PdfViewer({ scale, src }: PDFViewerProps) {
  return (
    <div className={styles.pdfViewer}>
      <div className={styles.pdfLeftSideView}>
        <IconButton className={styles.sideMenuToggle}>
          <ViewSidebar />
        </IconButton>
      </div>
      <div className={styles.pdfExample}>
        <img
          src={src}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease',
          }}
          alt="PDF preview"
        />
      </div>
    </div>
  );
};
