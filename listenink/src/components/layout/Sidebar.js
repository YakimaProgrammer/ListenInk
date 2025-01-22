import React from "react";
import "./Sidebar.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useCategories } from '../../contexts/CategoriesContext';

const truncateText = (text = "", maxLength = 5) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + "...";
};


export default function Sidebar({ onToggleSidebar }) {
    const { categories, documents, curDocument, setCurDocument, addNewDocument } = useCategories();

    const handleAddDocument = () => {
        let newId = documents.reduce((maxId, doc) => Math.max(maxId, doc.id), -1) + 1;
        const newDocument = {
            name: "New Document " + newId,
            text: "This is a new document " + newId,
            id: newId
        };
        addNewDocument(newDocument);
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
                        </button>
                        <button onClick={handleAddDocument}>
                            <i className="bi bi-pencil-square" />
                        </button>
                    </div>
                </div>
            </div>

            {[...categories]
                .sort((a, b) => {
                    if (a.name === "Uncategorized") return 1;
                    if (b.name === "Uncategorized") return -1;
                    return 0;
                })
                .map((category, index) => {
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
                                    if (!doc) return null;
                                    const truncatedName = truncateText(doc.name, 22);
                                    const isActive = curDocument?.id === doc.id;

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
        </div >
    );
}
