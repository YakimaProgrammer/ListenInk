import React, { useState } from "react";
import "./Sidebar.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useDispatch } from "react-redux";
import { useCategories } from "../../contexts/CategoriesContext";
import Search from "./Search.js";
import { moveDocument, addCategory } from '../../contexts/categoriesSlice'; // <--- Add your 'addCategory' import here

const truncateText = (text = "", maxLength = 5) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + "...";
};

export default function Sidebar({ onToggleSidebar, handleAddDocument, handleAddCategory }) {
    const dispatch = useDispatch();
    const { categories, documents, curDocument, setCurDocument } = useCategories();
    const [showSearch, setShowSearch] = useState(false);
    // For the "Add New" dropdown:
    const [showAddDropdown, setShowAddDropdown] = useState(false);

    const toggleSearch = () => setShowSearch((prev) => !prev);
    const toggleAddDropdown = () => setShowAddDropdown((prev) => !prev);

    // If you have a Redux or context function for adding a category, call it here.
    const handleAddCategoryAction = () => {
        // Example: dispatch(addCategory({ name: 'New Category' }));
        handleAddCategory();
        setShowAddDropdown(false); // close menu after adding
    };

    // If you want to close the dropdown after adding a document, do it here:
    const handleAddDocAndClose = () => {
        handleAddDocument();
        setShowAddDropdown(false);
    };

    // Drag/Drop logic remains the same
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

                        {/* Add New (Dropdown) */}
                        <div className="add-new-dropdown-container">
                            <button onClick={toggleAddDropdown}>
                                <i className="bi bi-pencil-square" />
                                {/* Or some other icon/text */}
                            </button>

                            {showAddDropdown && (
                                <div className="add-new-dropdown-menu">
                                    <button onClick={handleAddDocAndClose}>
                                        Create New Document
                                    </button>
                                    <button onClick={handleAddCategoryAction}>
                                        Create New Category
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Add new document button */}
                        {/* <button onClick={handleAddDocument}>
                            <i className="bi bi-pencil-square" />
                        </button> */}
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
