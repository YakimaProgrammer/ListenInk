import { 
  Search,
  KeyboardArrowUp,
  KeyboardArrowDown,
  ZoomIn,
  ZoomOut
} from '@mui/icons-material';
import { IconButton, TextField } from '@mui/material';

import styles from './PdfViewer.module.scss';

interface PdfTopViewProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
}

export function PdfTopView({
  currentPage,
  totalPages,
  zoomLevel,
  onPageChange,
  onZoomChange
}: PdfTopViewProps) {
  return (
    <div className={styles.pdfTopView}>
      <IconButton className={styles.topbarSearch}>
        <Search />
      </IconButton>

      <div className={styles.pageDisplay}>
        <IconButton onClick={() => onPageChange(currentPage - 1)}>
          <KeyboardArrowUp />
        </IconButton>
        
        <TextField 
          size="small"
          value={currentPage}
          className={styles.pageInput}
        />
        <span>/</span>
        <span>{totalPages}</span>

        <IconButton onClick={() => onPageChange(currentPage + 1)}>
          <KeyboardArrowDown />
        </IconButton>
      </div>

      <div className={styles.zoomControl}>
        <IconButton onClick={() => onZoomChange(zoomLevel - 10)}>
          <ZoomOut />
        </IconButton>
        <span>{zoomLevel}%</span>
        <IconButton onClick={() => onZoomChange(zoomLevel + 10)}>
          <ZoomIn />
        </IconButton>
      </div>
    </div>
  );
};
