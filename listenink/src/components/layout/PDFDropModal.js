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
        renameDocument,
    } = useCategories();

    if (!isOpen) return null;

    // Allow drop if:
    // - A document is selected and it does NOT already have a PDF, OR
    // - No document is selected (in which case we’ll create one)
    const canDrop = curDocument ? !pdfByDocId[curDocument.id] : true;

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Only PDF files are allowed.");
            return;
        }

        const newName = file.name.replace(/\.pdf$/i, '');

        if (curDocument) {
            // If a document exists but already has a PDF attached, prevent drop.
            if (pdfByDocId[curDocument.id]) {
                // Current document already has a PDF attached: create a new document.
                const newId = documents.reduce((maxId, doc) => Math.max(maxId, doc.id), -1) + 1;
                const newDocument = {
                    name: newName,
                    text: "",
                    id: newId,
                };
                addNewDocument(newDocument);
                setCurDocument(newDocument);
                attachPdfToDocument(newDocument.id, file);
                alert(`Current document already has a PDF. Created new document "${newDocument.name}" and attached PDF.`);
            } else {
                // Current document exists but does not have a PDF: attach and rename.
                attachPdfToDocument(curDocument.id, file);
                renameDocument(curDocument.id, newName);
                setCurDocument({ ...curDocument, name: newName });
                alert(`Successfully attached PDF and renamed document to "${newName}".`);
            }
        } else {
            // No current document: create one.
            const newId = documents.reduce((maxId, doc) => Math.max(maxId, doc.id), -1) + 1;
            const newDocument = {
                name: newName,
                text: "",
                id: newId,
            };
            addNewDocument(newDocument);
            setCurDocument(newDocument);
            attachPdfToDocument(newDocument.id, file);
            alert(`Successfully created document "${newDocument.name}" and attached PDF.`);
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
                    <div className='vstack centered'>
                        <p>
                            Current document <strong>{curDocument.name}</strong> already has a PDF attached.
                            Drop here to create a new document.
                        </p>
                    </div>
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
