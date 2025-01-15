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
    const { categories, curDocument, setCurDocument } = useCategories();


    return (
        <div style={{ margin: "20px" }}>
            <div className="hstack header">
                <button onClick={onToggleSidebar}>
                    <i className="bi bi-layout-sidebar"></i>
                </button>
                <div className="right-align">
                    <div className="hstack">
                        <button>
                            <i class="bi bi-search"></i>
                        </button>
                        <button>
                            <i class="bi bi-pencil-square"></i>
                        </button>
                    </div>
                </div>
            </div>

            {categories.map((category, index) => (
                <div key={index} style={{ marginBottom: "16px" }}>
                    <strong style={{ color: category.color }}>
                        {truncateText(category.name, 25)}
                    </strong>

                    <div style={{ marginLeft: "20px" }}>
                        {category.documents.map((doc, docIndex) => {
                            const truncatedId = truncateText(doc.name, 22);
                            const isActive = curDocument.id === doc.id; // Check if the current document is active

                            return (
                                <button
                                    key={doc.id}
                                    onClick={() => setCurDocument(doc)}
                                    className={`doc-button ${isActive ? "active" : ""}`}
                                >
                                    {truncatedId}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
