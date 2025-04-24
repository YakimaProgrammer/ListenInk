import { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { AppDispatch, setSearchDialog, upsertBookmark } from "@/store";

import { withDocument, InjectedProps } from "../WithDocument";
import { PdfTopView } from "./PdfTopView";
import { PdfViewer } from "./PdfViewer";
import styles from "./index.module.scss";
import pdfExampleImage from "./pdfExample.png";

const mapDispatchToProps = (
  dispatch: AppDispatch,
  ownProps: InjectedProps
) => ({
  openSearchDialog: () => dispatch(setSearchDialog(true)),
  //I'm going to say that the playback time should be inferred to be set to the start if you change pages imo
  setPage: (page: number) =>
    dispatch(upsertBookmark({ docId: ownProps.docId, page, time: 0 })),

  // zoom action dispatch?
  // TODO:
});

const connector = connect(null, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector> & InjectedProps;

function PDFViewerComponent({
  openSearchDialog,
  doc,
  setPage,
}: PropsFromRedux) {
  const page = doc.bookmarks.at(0)?.page ?? 0;

  // Non react-redux version, for testing
  const [zoomScale, setZoomScale] = useState(100);
  const onZoomChange = (newScale: number) => {
    if (newScale > 200) {
      setZoomScale(200);
    } else if (newScale < 10) {
      setZoomScale(10);
    } else {
      setZoomScale(newScale);
    }
  };

  return (
    <div className={styles.mainPdf}>
      <PdfTopView
        currentPage={page}
        totalPages={doc.numpages}
        zoomLevel={zoomScale}
        onPageChange={setPage}
        onZoomChange={onZoomChange}
        openSearchDialog={openSearchDialog}
      />
      <PdfViewer scale={zoomScale} src={pdfExampleImage} />
    </div>
  );
}

export const PDFViewer = withDocument(connector(PDFViewerComponent));
