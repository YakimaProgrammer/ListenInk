import React, { useState, useRef, useEffect } from "react";
import "./Sidebar.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useSelector, useDispatch } from "react-redux";
import { useCategories } from "../../contexts/CategoriesContext";
import Search from "./Search.js";
import {
    moveDocument,
    addCategory, // from your existing code
    renameCategory,
    deleteCategory,
    renameDocument,
    deleteDocument,
    changeCategoryColor, // <---- import our new action
    reorderCategories
} from "../../contexts/categoriesSlice";

const categoryColors = [
    "#001219",
    "#005f73",
    "#0a9396",
    "#94d2bd",
    "#e9d8a6",
    "#ee9b00",
    "#ca6702",
    "#bb3e03",
    "#ae2012",
    "#9b2226",
];

const truncateText = (text = "", maxLength = 5) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + "...";
};

export default function Sidebar({
    onToggleSidebar,
    handleAddDocument,
    handleAddCategory,
}) {
    const dispatch = useDispatch();
    const { categories, documents, curDocument, setCurDocument } = useCategories();
    const [showSearch, setShowSearch] = useState(false);

    const visibleCategories = categories.filter(c => c.name !== "Uncategorized");
    const [hoveredCategory, setHoveredCategory] = useState(null);


    // "Add New" popup
    const [showAddDropdown, setShowAddDropdown] = useState(false);
    const addDropdownRef = useRef(null); // Ref to the "Add New" popup container

    // Right-click context menu
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        itemType: null, // 'category' or 'document'
        itemId: null,
        showColorPicker: false, // <---- new flag to show color grid
    });
    const contextMenuRef = useRef(null); // Ref to the context menu container

    // Confirm delete modal
    const [confirmDelete, setConfirmDelete] = useState({
        open: false,
        itemType: null,
        itemId: null,
    });

    const confirmDeleteRef = useRef(null); // Ref to the white box in the modal

    // Inline rename states for category/document
    const [editingCatId, setEditingCatId] = useState(null);
    const [tempCatName, setTempCatName] = useState("");
    const [editingDocId, setEditingDocId] = useState(null);
    const [tempDocName, setTempDocName] = useState("");

    // Click / KeyDown handlers to close popups if user clicks away or presses ESC
    useEffect(() => {
        const handleGlobalClick = (e) => {
            // If the context menu is open and the click is outside it, close it
            if (contextMenu.visible) {
                if (
                    contextMenuRef.current &&
                    !contextMenuRef.current.contains(e.target)
                ) {
                    setContextMenu({ ...contextMenu, visible: false, showColorPicker: false });
                }
            }

            // If the add new dropdown is open and the click is outside it, close it
            if (showAddDropdown) {
                if (
                    addDropdownRef.current &&
                    !addDropdownRef.current.contains(e.target)
                ) {
                    setShowAddDropdown(false);
                }
            }

            // If delete modal is open and click is **outside** the modal box, close it
            if (confirmDelete.open) {
                if (
                    confirmDeleteRef.current &&
                    !confirmDeleteRef.current.contains(e.target)
                ) {
                    setConfirmDelete({ open: false, itemType: null, itemId: null });
                }
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setContextMenu({
                    ...contextMenu,
                    visible: false,
                    showColorPicker: false,
                });
                setShowAddDropdown(false);
                setConfirmDelete({ open: false, itemType: null, itemId: null });
            }
        };

        document.addEventListener("mousedown", handleGlobalClick);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleGlobalClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [contextMenu, showAddDropdown, confirmDelete]);

    // Refs to automatically focus rename input
    // const catInputRef = useRef(null);
    // const docInputRef = useRef(null);

    const toggleSearch = () => setShowSearch((prev) => !prev);
    const toggleAddDropdown = () => setShowAddDropdown((prev) => !prev);

    // Right-click handler
    const handleRightClick = (e, itemType, itemId) => {
        e.preventDefault();
        // Show context menu at mouse location
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            itemType,
            itemId,
            showColorPicker: false, // reset any sub-menu
        });
    };

    // // Hide the context menu if user left-clicks anywhere
    // const handleClickAway = () => {
    //     if (contextMenu.visible) {
    //         setContextMenu({ ...contextMenu, visible: false });
    //     }
    // };

    // Context menu actions
    const handleContextRename = () => {
        const { itemType, itemId } = contextMenu;
        setContextMenu({ ...contextMenu, visible: false });

        if (itemType === "category") {
            // Find the category name
            const cat = categories.find((c) => c.id === itemId);
            if (cat) {
                setEditingCatId(itemId);
                setTempCatName(cat.name);
            }
        } else if (itemType === "document") {
            const doc = documents.find((d) => d.id === itemId);
            if (doc) {
                setEditingDocId(itemId);
                setTempDocName(doc.name);
            }
        }
    };

    const handleContextDelete = () => {
        const { itemType, itemId } = contextMenu;
        setContextMenu({ ...contextMenu, visible: false });

        // Open a confirmation popup
        setConfirmDelete({
            open: true,
            itemType,
            itemId,
        });


    };

    // [NEW] Show color picker sub-menu (for categories only)
    const handleContextChangeColor = () => {
        setContextMenu({
            ...contextMenu,
            showColorPicker: true,
        });
    };

    // [NEW] Called when user picks a color
    const handlePickColor = (color) => {
        dispatch(changeCategoryColor({ categoryId: contextMenu.itemId, color }));
        // Close the menu
        setContextMenu({
            ...contextMenu,
            visible: false,
            showColorPicker: false,
        });
    };

    // Inline rename - Category
    const handleCategoryBlur = (catId) => {
        if (tempCatName.trim() !== "") {
            dispatch(renameCategory({ categoryId: catId, newName: tempCatName }));
        }
        setEditingCatId(null);
    };

    const handleCatKeyDown = (e, catId) => {
        if (e.key === "Enter") {
            e.target.blur();
        }
    };

    // Inline rename - Document
    const handleDocumentBlur = (docId) => {
        if (tempDocName.trim() !== "") {
            dispatch(renameDocument({ docId, newName: tempDocName }));
        }
        setEditingDocId(null);
    };

    const handleDocKeyDown = (e, docId) => {
        if (e.key === "Enter") {
            e.target.blur();
        }
    };

    // Confirm delete
    const handleConfirmDelete = () => {
        const { itemType, itemId } = confirmDelete;

        if (itemType === "category") {
            dispatch(deleteCategory(itemId));
        } else if (itemType === "document") {
            dispatch(deleteDocument(itemId));
        }

        setConfirmDelete({ open: false, itemType: null, itemId: null });
    };

    const handleCancelDelete = () => {
        setConfirmDelete({ open: false, itemType: null, itemId: null });
    };

    // Drag & Drop
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
                        <div className="add-new-dropdown-container" ref={addDropdownRef}>
                            <button onClick={toggleAddDropdown}>
                                <i className="bi bi-pencil-square" />
                            </button>
                            {showAddDropdown && (
                                <div className="add-new-popup">
                                    <div className="add-new-popup-content">
                                        <button
                                            onClick={() => {
                                                handleAddDocument();
                                                setShowAddDropdown(false);
                                            }}
                                            className="hstack-left"
                                        >
                                            <i class="bi bi-file-earmark-text"></i>
                                            Create New Document
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleAddCategory();
                                                setShowAddDropdown(false);
                                            }}
                                            className="hstack-left"
                                        >
                                            <i class="bi bi-folder"></i>
                                            Create New Category
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
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

            {/* Categories + Documents */}
            {visibleCategories
                // .sort((a, b) => {
                //     if (a.name === "Uncategorized") return 1;
                //     if (b.name === "Uncategorized") return -1;
                //     return 0;
                // })
                .map((category, index) => {
                    const isUncategorized = category.name === "Uncategorized";

                    return (
                        <div
                            key={index}
                            style={{ marginBottom: "16px" }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, category.id)}
                            onMouseEnter={() => setHoveredCategory(category.id)}
                            onMouseLeave={() => setHoveredCategory(null)}
                        >

                            {/* CATEGORY TITLE */}
                            {!isUncategorized && (
                                <div
                                    onContextMenu={(e) => handleRightClick(e, "category", category.id)}
                                    style={{ fontWeight: "bold", color: category.color }}
                                    className="category-row"
                                >
                                    {/* If editing this category, show input. Otherwise, show text. */}
                                    {editingCatId === category.id ? (
                                        <input
                                            // ref={catInputRef}
                                            type="text"
                                            value={tempCatName}
                                            onChange={(e) => setTempCatName(e.target.value)}
                                            onBlur={() => handleCategoryBlur(category.id)}
                                            onKeyDown={(e) => handleCatKeyDown(e, category.id)}
                                            autoFocus
                                        />
                                    ) : (
                                        <>
                                            {hoveredCategory === category.id ? (
                                                truncateText(category.name, 14)
                                            ) : (
                                                truncateText(category.name, 20)
                                            )}
                                        </>
                                    )}

                                    {/* Move category buttons */}
                                    {hoveredCategory === category.id && (
                                        <div className="move-buttons">
                                            {/* If not the first, show "move up" button */}
                                            {index > 0 && (
                                                <button
                                                    style={{ marginLeft: '8px' }}
                                                    onClick={() =>
                                                        dispatch(
                                                            reorderCategories({
                                                                categoryId: category.id,
                                                                referenceCategoryId: visibleCategories[index - 1].id,
                                                                position: 'before'
                                                            })
                                                        )
                                                    }
                                                >
                                                    <i class="bi bi-arrow-up-short"></i>
                                                </button>
                                            )}

                                            {/* If not the last, show "move down" button */}
                                            {index < categories.length - 2 && (
                                                <button
                                                    style={{ marginLeft: '4px' }}
                                                    onClick={() =>
                                                        dispatch(
                                                            reorderCategories({
                                                                categoryId: category.id,
                                                                referenceCategoryId: visibleCategories[index + 1].id,
                                                                position: 'after'
                                                            })
                                                        )
                                                    }
                                                >
                                                    <i class="bi bi-arrow-down-short"></i>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DOCUMENTS for this category */}
                            <div style={{ marginLeft: isUncategorized ? "0px" : "20px" }}>
                                {category.documents.map((docId) => {
                                    const doc = documents.find((d) => d.id === docId);
                                    if (!doc) return null;
                                    const isActive = curDocument?.id === doc.id;

                                    return (
                                        <div
                                            key={doc.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                minWidth: "270px",  // Ensure a uniform width
                                                maxWidth: "100%",
                                                // paddingRight: "8px" // Adds space between text and three dots
                                            }}
                                            onContextMenu={(e) => handleRightClick(e, "document", doc.id)}
                                        >
                                            {editingDocId === doc.id ? (
                                                <input
                                                    // ref={docInputRef}
                                                    type="text"
                                                    value={tempDocName}
                                                    onChange={(e) => setTempDocName(e.target.value)}
                                                    onBlur={() => handleDocumentBlur(doc.id)}
                                                    onKeyDown={(e) => handleDocKeyDown(e, doc.id)}
                                                    autoFocus
                                                    style={{ marginRight: 10 }}
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => setCurDocument(doc)}
                                                    className={`doc-button ${isActive ? "active" : ""}`}
                                                    draggable={true}
                                                    onDragStart={(e) =>
                                                        handleDragStart(e, doc.id, category.id)
                                                    }
                                                >
                                                    {truncateText(doc.name, 20)}
                                                </button>
                                            )}
                                            <button style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
                                                onClick={(e) => handleRightClick(e, "document", doc.id)}>
                                                <i className="bi bi-three-dots-vertical" style={{ transform: "scale(0.6)", display: "inline-block" }}></i>
                                            </button>

                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

            {/* CONTEXT MENU */}
            {contextMenu.visible && (
                <div
                    className="context-menu add-new-popup"
                    ref={contextMenuRef}
                    style={{
                        position: "absolute",
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 9999,
                    }}
                >
                    {/* If user is picking colors, show color grid. Otherwise, show rename/delete. */}
                    {contextMenu.itemType === "category" && contextMenu.showColorPicker ? (
                        <div className="color-grid">
                            {categoryColors.map((color) => {
                                // Get the current category to see its color
                                const cat = categories.find((c) => c.id === contextMenu.itemId);
                                const isSelected = cat && cat.color === color;

                                return (
                                    <div
                                        key={color}
                                        className="color-circle"
                                        style={{
                                            backgroundColor: color,
                                            outline: isSelected ? "2px solid black" : "2px solid transparent",
                                        }}
                                        onClick={() => handlePickColor(color)}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="add-new-popup-content">
                            <button onClick={handleContextRename} className="hstack-left">
                                <i class="bi bi-pencil"></i>
                                <p>Rename</p>
                            </button>
                            {contextMenu.itemType === "category" && (
                                <button onClick={handleContextChangeColor} className="hstack-left">
                                    <i class="bi bi-palette"></i>
                                    Change Color
                                </button>
                            )}
                            <button onClick={handleContextDelete} className="hstack-left">
                                <i class="bi bi-trash3 red" ></i>
                                <p className="red">Delete</p>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {confirmDelete.open && (
                <div className="delete-confirm-overlay">
                    {/* If you click the overlay, it closes.
              The white box has its own ref to stop clicks. */}
                    <div className="delete-confirm-modal" ref={confirmDeleteRef}>
                        <p>Are you sure you want to delete this?</p>
                        <button className="red" onClick={handleConfirmDelete}>Yes, delete</button>
                        <button onClick={handleCancelDelete}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
