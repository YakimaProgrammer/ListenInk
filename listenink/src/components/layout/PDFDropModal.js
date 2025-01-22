import React from 'react';
import './PDFDropModal.css';
import { useCategories } from '../../contexts/CategoriesContext';

export default function PDFDropModal({ isOpen, onClose }) {
    const { curDocument, pdfByDocId, attachPdfToDocument } = useCategories();

    if (!isOpen) return null; // Do not render anything if modal is closed.

    // The user can only attach a PDF if there's a selected doc
    // and if that doc does NOT already have a PDF
    const canDrop = !!(curDocument && !pdfByDocId[curDocument.id]);

    const handleDragOver = (e) => {
        // Only prevent default if we can drop (there's no PDF yet)
        if (canDrop) {
            e.preventDefault();
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (!canDrop) {
            return;
        }

        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Only PDF files are allowed.");
            return;
        }

        // Attach PDF to the doc in the context
        attachPdfToDocument(curDocument.id, file);

        alert(`Successfully attached PDF to "${curDocument.name}"`);

        // Optionally close the modal
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
                {/* Close button */}
                {/* <button className="pdf-drop-close" onClick={onClose}>
                    &times;
                </button> */}

                {!curDocument && (
                    <p style={{ margin: 'auto' }}>No document selected. Please select a document first.</p>
                )}

                {curDocument && pdfByDocId[curDocument.id] && (
                    <p>
                        Document <strong>{curDocument.name}</strong> already has a PDF attached!
                    </p>
                )}

                {canDrop && (
                    <div className="dropzone">
                        <p>
                            Attach a PDF
                        </p>
                    </div>
                )}
            </div>
        </div >
    );
}
