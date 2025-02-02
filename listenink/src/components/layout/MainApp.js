import React, { useState, useEffect, useRef } from "react";
import "./MainApp.css";
import Sidebar from "./Sidebar";
import AudioControls from "./AudioControls";
import "bootstrap-icons/font/bootstrap-icons.css";
import PDFDropModal from "./PDFDropModal";
import MainPdf from "../pdfViewer/MainPdf.js";

import { useCategories } from "../../contexts/CategoriesContext";

function MainApp() {
  const {
    categories,
    documents,
    curDocument,
    setCurDocument,
    addNewDocument,
    // updateDocumentName,
    pdfByDocId,
    renameDocument,
    addNewCategory,
    attachPdfToDocument,
  } = useCategories();

  const [showAddDropdownMain, setShowAddDropdownMain] = useState(false);

  const toggleAddDropdownMain = () => setShowAddDropdownMain((prev) => !prev);

  // Popup state for the “Add New” button
  const [showAddPopup, setShowAddPopup] = useState(false);

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // 1) Add local state for editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempName, setTempName] = useState("");

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // [NEW CODE] Ref to the “Add New” popup container
  const addPopupRef = useRef(null);

  // **** NEW: Ref for file input ****
  const fileInputRef = useRef(null);

  // Handle file input change (uploading a file via the file selector)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    // Reset the input so that the same file can be re-selected if needed.
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    if (curDocument) {
      if (pdfByDocId[curDocument.id]) {
        alert(`Document "${curDocument.name}" already has a PDF attached!`);
        return;
      }
      attachPdfToDocument(curDocument.id, file);
      // alert(`Successfully attached PDF to "${curDocument.name}"`);
    } else {
      // Create a new document automatically.
      const newDocName = file.name.replace(/\.pdf$/i, '');
      const newId = documents.reduce((maxId, doc) => Math.max(maxId, doc.id), -1) + 1;
      const newDocument = {
        name: newDocName,
        text: "",
        id: newId,
      };
      addNewDocument(newDocument);
      setCurDocument(newDocument);
      attachPdfToDocument(newDocument.id, file);
      // alert(`Successfully created document "${newDocument.name}" and attached PDF.`);
    }
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
    const handleDragOver = (e) => e.preventDefault();
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

  // [NEW CODE] Close the Add New popup if user clicks away or presses ESC
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // If the popup is open and the click is outside the popup, close it
      if (showAddPopup) {
        if (addPopupRef.current && !addPopupRef.current.contains(e.target)) {
          setShowAddPopup(false);
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showAddPopup) {
        setShowAddPopup(false);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAddPopup]);

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

  const handleAddCategory = () => {
    let newId =
      categories.reduce((maxId, doc) => Math.max(maxId, doc.id), -1) + 1;
    const newCategory = {
      name: "New Category " + newId,
      id: newId,
    };
    addNewCategory(newCategory);
  };

  // 2) Double-click to start editing
  const handleTitleDoubleClick = () => {
    if (curDocument) {
      setTempName(curDocument.name || "");
      setEditingTitle(true);
    }
  };

  // 3) Handle blur (or "Enter") to save
  const handleTitleBlur = () => {
    if (curDocument && tempName.trim() !== "") {
      // This calls the context's function, which dispatches the Redux action
      renameDocument(curDocument.id, tempName.trim());

      // ALSO update your local "curDocument" so it matches instantly
      setCurDocument({ ...curDocument, name: tempName.trim() });
    }
    setEditingTitle(false);
  };

  // Optional: Handle "Enter" key to finish editing
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
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
          handleAddCategory={handleAddCategory}
        />
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="top-view">
          <div className="hstack">
            {/* Toggle Sidebar */}
            <button
              className={`toggle ${!isSidebarVisible ? "sidebar-hidden" : ""}`}
              onClick={toggleSidebar}
            >
              <i className="bi bi-layout-sidebar"></i>
            </button>

            {/* Our new Add New button + popup */}
            <div className="add-new-button-container">
              <button
                className="add-new-toggle" onClick={() => setShowAddPopup((prev) => !prev)}
              >
                <i className="bi bi-pencil-square" />
              </button>

              {/* The popup that appears below the button */}
              {showAddPopup && (
                <div className="add-new-popup" ref={addPopupRef}>
                  <div className="add-new-popup-content">
                    <button onClick={() => {
                      handleAddDocument()
                      setShowAddPopup((prev) => !prev)
                    }}
                      className="hstack-left">
                      <i class="bi bi-file-earmark-text"></i>
                      Create New Document
                    </button>
                    <button onClick={() => {
                      handleAddCategory()
                      setShowAddPopup((prev) => !prev)
                    }}
                      className="hstack-left">
                      <i class="bi bi-folder"></i>
                      Create New Category
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4) Conditionally render either a <p> or an <input> */}
            {editingTitle ? (
              <input
                className="left-align title-text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                autoFocus

                style={{ width: `${Math.max(tempName.length, 1) + 2}ch` }}
              />
            ) : (
              <div
                onDoubleClick={handleTitleDoubleClick}
                onClick={handleTitleDoubleClick}
                className="left-align hstack-left">
                < p
                  className="title-text"
                >
                  {curDocument ? curDocument.name : "No Document Selected"}
                </p>
                {curDocument && <i class="bi bi-pencil"></i>}
              </div>
            )}
          </div>
        </div >

        <div className="centered vstack">
          {curDocument && pdfByDocId[curDocument.id] ?
            (
              <div>
                <MainPdf />
              </div>
            ) : (
              <>
                <p>
                  Drag and Drop
                </p>
                <br></br>
                <img src="import_icon.png" height="15%" width="auto" />
                <hr
                  className="divider"
                  style={{ width: "60%", margin: "16px auto" }}
                />
                {/* Added an Upload File button in the placeholder */}
                <button
                  className="upload-button"
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                >
                  <i class="bi bi-paperclip"></i>
                  Upload File
                </button>
              </>
            )}
        </div>

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

        {/* Hidden file input element used by the Upload File buttons */}
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <PDFDropModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
        />
      </main>
    </div>
  );
}

export default MainApp;
