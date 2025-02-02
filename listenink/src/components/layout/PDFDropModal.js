import React from 'react';
import './PDFDropModal.css';
import { useCategories } from '../../contexts/CategoriesContext';
import { ReactSVG } from 'react-svg';

export default function PDFDropModal({ isOpen, onClose }) {
    // Now include additional context functions for creating a new document
    const {
        curDocument,
        pdfByDocId,
        attachPdfToDocument,
        addNewDocument,
        setCurDocument,
        documents,
    } = useCategories();

    if (!isOpen) return null;

    // Allow drop if:
    // - A document is selected and it does NOT already have a PDF, OR
    // - No document is selected (in which case we’ll create one)
    const canDrop = curDocument ? !pdfByDocId[curDocument.id] : true;

    const handleDragOver = (e) => {
        if (canDrop) {
            e.preventDefault();
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Only PDF files are allowed.");
            return;
        }

        if (curDocument) {
            // If a document exists but already has a PDF attached, prevent drop.
            if (pdfByDocId[curDocument.id]) {
                alert(`Document "${curDocument.name}" already has a PDF attached!`);
                return;
            }
            attachPdfToDocument(curDocument.id, file);
            // alert(`Successfully attached PDF to "${curDocument.name}"`);
        } else {
            // Create a new document automatically.
            // Here we use the file name (stripping a trailing ".pdf", if any) as the document name.
            const newDocName = file.name.replace(/\.pdf$/i, '');
            // Generate a new id based on your current documents list.
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
        onClose();
    };

    return (
        <div className="pdf-drop-overlay" onClick={onClose}>
            <div
                className="pdf-drop-modal"
                onClick={(e) => e.stopPropagation()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {curDocument && pdfByDocId[curDocument.id] ? (
                    <p>
                        Document <strong>{curDocument.name}</strong> already has a PDF attached!
                    </p>
                ) : (
                    <div className="dropzone vstack">
                        <p>Drag and Drop PDF Here</p>
                        <br />
                        <img src="import_icon.png" height="15%" width="auto" alt="Import Icon" />
                    </div>
                )}
            </div>
        </div>
    );
}
