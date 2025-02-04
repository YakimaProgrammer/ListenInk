import React from "react";
import "./PdfTopView.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const PdfTopView = () => {
  return (
    <div className="pdfTopView">
      <button className="topbar-search">
        <i className="bi bi-search"></i>
      </button>

      {/* page display section */}
      <div className="page-display">
        {/* previous page button */}
        <button>
          <i className="bi bi-caret-up"></i>
        </button>
        {/* page number display and jump*/}
        <input type="text" value="2" pattern="\d*" />
        <span>/</span>
        <span>20</span>

        {/* next page button */}
        <button>
          <i className="bi bi-caret-down"></i>
        </button>
      </div>

      <div className="zoom-control">
        {/* zoom out button */}
        <button>
          <i className="bi bi-zoom-out"></i>
        </button>
        {/* display zoom ratio */}
        <span>100%</span>
        {/* zoom in button */}
        <button>
          <i className="bi bi-zoom-in"></i>
        </button>
      </div>
    </div>
  );
};

export default PdfTopView;
