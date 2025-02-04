import React from 'react';
import { 
  Search,
  KeyboardArrowUp,
  KeyboardArrowDown,
  ZoomIn,
  ZoomOut
} from '@mui/icons-material';
import { IconButton, TextField } from '@mui/material';
import styles from './PdfTopView.module.scss';
import { PdfTopViewProps } from './types';

const PdfTopView: React.FC<PdfTopViewProps> = ({
  currentPage = 1,
  totalPages = 1,
  zoomLevel = 100,
  onPageChange,
  onZoomChange
}) => {
  return (
    <div className={styles.pdfTopView}>
      <IconButton className={styles.topbarSearch}>
        <Search />
      </IconButton>

      <div className={styles.pageDisplay}>
        <IconButton onClick={() => onPageChange?.(currentPage - 1)}>
          <KeyboardArrowUp />
        </IconButton>
        
        <TextField 
          size="small"
          value={currentPage}
          inputProps={{ pattern: '\\d*' }}
          className={styles.pageInput}
        />
        <span>/</span>
        <span>{totalPages}</span>

        <IconButton onClick={() => onPageChange?.(currentPage + 1)}>
          <KeyboardArrowDown />
        </IconButton>
      </div>

      <div className={styles.zoomControl}>
        <IconButton onClick={() => onZoomChange?.(zoomLevel - 10)}>
          <ZoomOut />
        </IconButton>
        <span>{zoomLevel}%</span>
        <IconButton onClick={() => onZoomChange?.(zoomLevel + 10)}>
          <ZoomIn />
        </IconButton>
      </div>
    </div>
  );
};

export default PdfTopView;
