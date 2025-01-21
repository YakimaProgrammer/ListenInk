import React, { useState, useEffect } from "react";
import "./MainApp.css";
import Sidebar from "./Sidebar";
import AudioControls from "./AudioControls";
import "bootstrap-icons/font/bootstrap-icons.css";
import PDFDropModal from "./PDFDropModal"; // import the modal component
import MainPdf from "../pdfViewer/MainPdf.js";

import { useCategories } from "../../contexts/CategoriesContext";

function MainApp() {
  const {
    categories,
    documents,
    curDocument,
    setCurDocument,
    addNewDocument,
    pdfByDocId,
  } = useCategories();

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  useEffect(() => {
    let dragCounter = 0;

    // Fired when a dragged item enters the browser window
    const handleDragEnter = (e) => {
      // Only show modal if we are dragging "Files" (not text or links)
      if ([...e.dataTransfer.types].includes("Files")) {
        dragCounter++;
        setIsPdfModalOpen(true);
      }
    };

    // Fired when a dragged item leaves an element within the window
    // (can happen many times as the user moves over child elements)
    const handleDragLeave = () => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsPdfModalOpen(false);
      }
    };

    // Needed to allow dropping by preventing the default
    const handleDragOver = (e) => {
      e.preventDefault();
    };

    // If user drops anywhere outside your modal, close the modal
    // (Because they've either dropped on the page or left the window)
    const handleDrop = () => {
      dragCounter = 0;
      setIsPdfModalOpen(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleAddDocument = () => {
    let newId =
      documents.reduce((maxId, doc) => Math.max(maxId, doc.id), -1) + 1;
    const newDocument = {
      name: "New Document " + newId,
      text: "This is a new document " + newId,
      id: newId,
    };
    addNewDocument(newDocument);
  };

  const docHasPdf = curDocument && pdfByDocId[curDocument.id];

  return (
    <div
      className={`app-container ${!isSidebarVisible ? "sidebar-hidden" : ""}`}
    >
      {/* Sidebar */}
      <aside className={`sidebar ${!isSidebarVisible ? "hidden" : ""}`}>
        <Sidebar
          onToggleSidebar={toggleSidebar}
          handleAddDocument={handleAddDocument}
        />
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="top-view">
          <div className="hstack">
            <button
              className={`toggle ${!isSidebarVisible ? "sidebar-hidden" : ""}`}
              onClick={toggleSidebar}
            >
              <i className="bi bi-layout-sidebar"></i>
            </button>
            <button
              className={`toggle ${!isSidebarVisible ? "sidebar-hidden" : ""}`}
              onClick={handleAddDocument}
            >
              <i className="bi bi-pencil-square" />
            </button>
            <p className="left-align title-text">
              {curDocument ? curDocument.name : "No Document Selected"}
            </p>
          </div>
        </div>

        <MainPdf />

        <div
          style={{
            whiteSpace: "pre-line",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {curDocument ? (
            <>
              {/* <div style={{ flex: 1, overflow: 'auto' }}>
                                <p>{curDocument.text}</p>
                            </div> */}

              {docHasPdf ? (
                <div className="bottom-view" style={{ flexShrink: 0 }}>
                  <AudioControls />
                </div>
              ) : (
                <></>
                // <button
                //     onClick={() => setIsPdfModalOpen(true)}
                //     style={{ margin: 'auto' }}
                // >
                //     Attach PDF
                // </button>
              )}
            </>
          ) : (
            <>
              {/* <p style={{ margin: 'auto', marginBottom: '0' }}>Please select a document to view its contents.</p> */}
            </>
          )}
        </div>

        <PDFDropModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
        />
      </main>
    </div>
  );
}

export default MainApp;
