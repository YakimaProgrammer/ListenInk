import React from 'react';
import { ViewSidebar } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import styles from './PdfViewer.module.scss';
import verticalExample from './pdfPageTest/verticalExample.jpg';
import { PDFViewerProps } from './types';

const PdfViewer: React.FC<PDFViewerProps> = ({ scale = 1 }) => {
  return (
    <div className={styles.pdfViewer}>
      <div className={styles.pdfLeftSideView}>
        <IconButton className={styles.sideMenuToggle}>
          <ViewSidebar />
        </IconButton>
      </div>
      <div className={styles.pdfExample}>
        <img
          src={verticalExample}
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

export default PdfViewer;
