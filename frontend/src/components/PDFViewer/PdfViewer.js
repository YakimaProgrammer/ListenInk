import React from "react";
import "./PdfViewer.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import pdfExample from "./pdfPageTest/pdfExample.png";
import verticalExample from "./pdfPageTest/verticalExample.jpg";

const PdfViewer = () => {
  return (
    <div className="pdfViewer">
      <div className="pdfLeftSideView">
        <button className="sideMenu-toggle">
          <i className="bi bi-layout-text-sidebar"></i>
        </button>
      </div>
      {/* <div className="pdfContent">
        <h1>This is PDF Content.</h1>
      </div> */}
      <div className="pdfExample">
        <img
          src={verticalExample}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
            transition: "transform 0.2s ease",
          }}
          alt="pdfExample"
        />
      </div>
    </div>
  );
};

export default PdfViewer;
