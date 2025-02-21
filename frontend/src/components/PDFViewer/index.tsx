import { connect, ConnectedProps } from "react-redux";
import { AppDispatch, setSearchDialog } from "@/store";

import { useDocument } from "../WithDocument";
import { PdfTopView } from "./PdfTopView";
import { PdfViewer } from "./PdfViewer";
import styles from "./index.module.scss";

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  openSearchDialog: () => dispatch(setSearchDialog(true))
});

const connector = connect(null, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function PDFViewerComponent({ openSearchDialog }: PropsFromRedux) {
  const doc = useDocument();

  if (doc === undefined) {
    throw new Error("Tried to render a PDFViewer where a document does not make sense!");
  } else {
    const page = 3;
    
    return (
      <div className={styles.mainPdf}>
	<PdfTopView
          currentPage={page}
          totalPages={20}
          zoomLevel={100}
          onPageChange={() => {}}
          onZoomChange={() => {}}
	  openSearchDialog={openSearchDialog}
	/>
	<PdfViewer scale={1} src={`/api/v1/docs/${doc.id}/pages/${page}/image`} />
      </div>
    );
  }
}

export const PDFViewer = connector(PDFViewerComponent);
