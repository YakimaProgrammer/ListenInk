import { PdfTopView } from './PdfTopView';
import { PdfViewer } from './PdfViewer';
import styles from './index.module.scss';

export function PDFViewer() {
  return (
    <div className={styles.mainPdf}>
      <PdfTopView currentPage={2} totalPages={20} zoomLevel={100} />
      <PdfViewer scale={1} />
    </div>
  );
};
