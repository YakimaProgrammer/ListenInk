import React from "react";
import "./Sidebar.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useCategories } from '../../contexts/CategoriesContext';

// Helper function to truncate text
const truncateText = (text, maxLength = 5) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + "...";
};

export default function Sidebar({ onToggleSidebar }) {
    const { categories, documents, curDocument, setCurDocument, addNewDocument } = useCategories();

    const handleAddDocument = () => {
        const defaultCategoryId = categories[0]?.id || 0; // Add to the first category by default
        const newDocument = {
            name: "New Document",
            text: "This is a new document",
        };
        addNewDocument(defaultCategoryId, newDocument);
    };

    return (
        <div style={{ margin: "20px" }}>
            <div className="hstack header">
                <button onClick={onToggleSidebar}>
                    <i className="bi bi-layout-sidebar"></i>
                </button>
                <div className="right-align">
                    <div className="hstack">
                        <button>
                            <i className="bi bi-search" />
                            {/* search */}
                        </button>
                        <button onClick={handleAddDocument}>
                            <i className="bi bi-pencil-square" />
                            {/* edit */}
                        </button>
                    </div>
                </div>
            </div>

            {categories.map((category, index) => {
                // Skip rendering the title for "Uncategorized"
                const isUncategorized = category.name === "Uncategorized";

                return (
                    <div key={index} style={{ marginBottom: "16px" }}>
                        {!isUncategorized && (
                            <strong style={{ color: category.color }}>
                                {truncateText(category.name, 25)}
                            </strong>
                        )}

                        <div style={{ marginLeft: isUncategorized ? "0px" : "20px" }}>
                            {category.documents.map((docId) => {
                                const doc = documents.find((d) => d.id === docId);
                                if (!doc) return null; // Skip if the document is not found
                                const truncatedName = truncateText(doc.name, 22);
                                const isActive = curDocument?.id === doc.id; // Check if the current document is active

                                return (
                                    <button
                                        key={doc.id}
                                        onClick={() => setCurDocument(doc)}
                                        className={`doc-button ${isActive ? "active" : ""}`}
                                    >
                                        {truncatedName}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
