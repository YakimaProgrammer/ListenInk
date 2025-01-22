// ORIGINAL

// // Sidebar.js
// import "./Sidebar.css";
// import 'bootstrap-icons/font/bootstrap-icons.css';
// import { useCategories } from '../../contexts/CategoriesContext';
// import Search from "./Search.js";

// // Helper function to truncate text
// const truncateText = (text, maxLength = 5) => {
//     if (text.length <= maxLength) {
//         return text;
//     }
//     return text.slice(0, maxLength - 3) + "...";
// };

// export default function Sidebar({ onToggleSidebar }) {
//     const { categories, documents, curDocument, setCurDocument, addNewDocument } = useCategories();

//     const handleAddDocument = () => {
//         const defaultCategoryId = categories[0]?.id || 0; // Add to the first category by default
//         const newDocument = {
//             name: "New Document",
//             text: "This is a new document",
//         };
//         addNewDocument(defaultCategoryId, newDocument);
//     };

//     return (
//         <div style={{ margin: "20px" }}>
//             <div className="hstack header">
//                 <button onClick={onToggleSidebar}>
//                     <i className="bi bi-layout-sidebar"></i>
//                 </button>
//                 <div className="right-align">
//                     <div className="hstack">
//                         <button>
//                             <i className="bi bi-search" />
//                             <Search />
//                         </button>
//                         <button onClick={handleAddDocument}>
//                             <i className="bi bi-pencil-square" />
//                             {/* edit */}
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             {categories.map((category, index) => {
//                 // Skip rendering the title for "Uncategorized"
//                 const isUncategorized = category.name === "Uncategorized";

//                 return (
//                     <div key={index} style={{ marginBottom: "16px" }}>
//                         {!isUncategorized && (
//                             <strong style={{ color: category.color }}>
//                                 {truncateText(category.name, 25)}
//                             </strong>
//                         )}

//                         <div style={{ marginLeft: isUncategorized ? "0px" : "20px" }}>
//                             {category.documents.map((docId) => {
//                                 const doc = documents.find((d) => d.id === docId);
//                                 if (!doc) return null; // Skip if the document is not found
//                                 const truncatedName = truncateText(doc.name, 22);
//                                 const isActive = curDocument?.id === doc.id; // Check if the current document is active

//                                 return (
//                                     <button
//                                         key={doc.id}
//                                         onClick={() => setCurDocument(doc)}
//                                         className={`doc-button ${isActive ? "active" : ""}`}
//                                     >
//                                         {truncatedName}
//                                     </button>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 );
//             })}
//         </div>
//     );
// }


// WORKING SEARCH BUT NEED TO IMPLEMENT HOW WE WANT FORMATTING

import React, { useState } from "react";
import "./Sidebar.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useDispatch } from "react-redux";
import { useCategories } from "../../contexts/CategoriesContext";
import Search from "./Search.js";
import { moveDocument } from '../../contexts/categoriesSlice';

const truncateText = (text = "", maxLength = 5) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + "...";
};

export default function Sidebar({ onToggleSidebar, handleAddDocument }) {
    const dispatch = useDispatch();
    const { categories, documents, curDocument, setCurDocument, addNewDocument } = useCategories();
    const [showSearch, setShowSearch] = useState(false); // State to control search visibility

    const toggleSearch = () => setShowSearch((prev) => !prev);

    const handleDragStart = (e, docId, sourceCategoryId) => {
        // Store the dragged docId and the source category in the DataTransfer
        e.dataTransfer.setData("docId", docId);
        e.dataTransfer.setData("sourceCategoryId", sourceCategoryId);
    };

    const handleDragOver = (e) => {
        // Needed to allow dropping
        e.preventDefault();
    };

    const handleDrop = (e, targetCategoryId) => {
        e.preventDefault();
        const docId = e.dataTransfer.getData("docId");
        const sourceCategoryId = e.dataTransfer.getData("sourceCategoryId");

        dispatch(moveDocument({ docId, sourceCategoryId, targetCategoryId }));
    };

    return (
        <div style={{ margin: "20px" }}>
            {/* Header buttons */}
            <div className="hstack header">
                <button onClick={onToggleSidebar}>
                    <i className="bi bi-layout-sidebar"></i>
                </button>
                <div className="right-align">
                    <div className="hstack">
                        {/* Search button */}
                        <button onClick={toggleSearch}>
                            <i className="bi bi-search" />
                        </button>

                        {/* Add new document button */}
                        <button onClick={handleAddDocument}>
                            <i className="bi bi-pencil-square" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Popup */}
            {showSearch && (
                <div className="search-popup">
                    <div className="search-popup-content">
                        <button className="close-popup" onClick={toggleSearch}>
                            <i className="bi bi-x"></i>
                        </button>
                        <Search />
                    </div>
                </div>
            )}

            {/* Categories and documents */}
            {[...categories]
                .sort((a, b) => {
                    if (a.name === "Uncategorized") return 1;
                    if (b.name === "Uncategorized") return -1;
                    return 0;
                }).map((category, index) => {
                    const isUncategorized = category.name === "Uncategorized";

                    return (
                        // Container for category
                        <div
                            key={index}
                            style={{ marginBottom: "16px" }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, category.id)}
                        >
                            {!isUncategorized && (
                                <strong style={{ color: category.color }}>
                                    {truncateText(category.name, 25)}
                                </strong>
                            )}
                            <div style={{ marginLeft: isUncategorized ? "0px" : "20px" }}>
                                {/* Documents */}
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
                                            draggable={true}
                                            onDragStart={(e) => handleDragStart(e, doc.id, category.id)}
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
