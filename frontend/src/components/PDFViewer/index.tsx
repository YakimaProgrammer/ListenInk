import { connect, ConnectedProps } from "react-redux";
import { AppDispatch, setSearchDialog, upsertBookmark } from "@/store";

import { withDocument, InjectedProps } from "../WithDocument";
import { PdfTopView } from "./PdfTopView";
import { PdfViewer } from "./PdfViewer";
import styles from "./index.module.scss";

const mapDispatchToProps = (dispatch: AppDispatch, ownProps: InjectedProps) => ({
  openSearchDialog: () => dispatch(setSearchDialog(true)),
  //I'm going to say that the playback time should be inferred to be set to the start if you change pages imo
  setPage: (page: number) => dispatch(upsertBookmark({ docId: ownProps.docId, page, time: 0 }))
});

const connector = connect(null, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector> & InjectedProps;

function PDFViewerComponent({ openSearchDialog, doc, setPage }: PropsFromRedux) {
  const page = doc.bookmarks.at(0)?.page ?? 0;
  
  return (
    <div className={styles.mainPdf}>
      <PdfTopView
        currentPage={page}
        totalPages={doc.numpages}
        zoomLevel={100}
        onPageChange={setPage}
        onZoomChange={() => {}}
	openSearchDialog={openSearchDialog}
      />
      <PdfViewer scale={1} src={`/api/v1/docs/${doc.id}/pages/${page}/image`} />
    </div>
  );
}

export const PDFViewer = withDocument(connector(PDFViewerComponent));
