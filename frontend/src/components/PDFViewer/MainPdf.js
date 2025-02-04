import React from 'react';
import { PdfTopView } from './PdfTopView';
import { PdfViewer } from './PdfViewer';
import styles from './MainPdf.module.scss';

const MainPdf: React.FC = () => {
  return (
    <div className={styles.mainPdf}>
      <PdfTopView currentPage={2} totalPages={20} zoomLevel={100} />
      <PdfViewer scale={1} />
    </div>
  );
};

export default MainPdf;
