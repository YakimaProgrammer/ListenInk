import React from "react";
import PdfTopView from "./PdfTopView";
import PdfViewer from "./PdfViewer";

function MainPdf() {
  return (
    <div className="MainPdf">
      <PdfTopView />
      <PdfViewer />
    </div>
  );
}

export default MainPdf;
