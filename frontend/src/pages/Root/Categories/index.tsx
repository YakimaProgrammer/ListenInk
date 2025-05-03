// --------------------------------------------------
// File: src/pages/Root/Categories/index.tsx
// Updated so RIGHT-CLICK rename mirrors double-click logic
// --------------------------------------------------

// src/pages/Root/Categories/index.tsx
import {
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  TextField,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  KeyboardArrowRight,
  KeyboardArrowDown,
  Edit,
  Delete,
  Palette,
  Description,
  Folder,
  FolderOpen,
  DragIndicator,
} from "@mui/icons-material";
import { connect, ConnectedProps, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { Conditional } from "@/components/Conditional";
import {
  AppDispatch,
  RootState,
  deleteCategory,
  deleteDocument,
} from "@/store";
import { urlFor } from "@/pages/urlfor";
import {
  useState,
  useEffect,
  MouseEvent as ReactMouseEvent,
  DragEvent,
} from "react";
import { Category } from "@/types";
import {
  EnhancedDocument,
  selectCategories,
  updateDocument,
  upsertCategory,
} from "@/store/slices/categories";
import styles from "../Sidebar/index.module.scss";

/** The palette for changing category colors. */
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

/** Maps global Redux state into props. */
const mapStateToProps = (state: RootState) => {
  return {
    categories: selectCategories(state),
    status: state.categories.status,
    reason:
      state.categories.status === "failure"
        ? state.categories.message
        : undefined,
  };
};
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function CategoriesComponent({ reason, status, categories }: PropsFromRedux) {
  const cats = Object.values(categories).filter(
    (c?: Category): c is Category => c !== undefined
  );
  return (
    <Conditional status={status} reason={reason}>
      <List sx={{ padding: 0 }}>
        {cats.map((cat, index) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            total={cats.length}
            index={index}
          />
        ))}
      </List>
    </Conditional>
  );
}
export const Categories = connector(CategoriesComponent);

/** Represents a single Category row + nested documents. */
interface CategoryRowProps {
  category: Category & { documents: EnhancedDocument[] };
  total: number;
  index: number;
}

function CategoryRow({ category, total, index }: CategoryRowProps) {
  const { docId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Whether category is "open."
  const [open, setOpen] = useState(false);
  // If user selected a doc here, forcibly open
  const hasSelectedDoc = category.documents.some((d) => d.id === docId);
  const isOpen = open || hasSelectedDoc;

  // For inline rename of category
  const [editingCat, setEditingCat] = useState(false);
  // We keep local catName in sync with Redux changes *when not editing*
  const [catName, setCatName] = useState(category.name);
  useEffect(() => {
    if (!editingCat) setCatName(category.name);
  }, [category.name, editingCat]);

  // For inline rename of docs
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  // Each time we switch which doc is editing, or doc changes in Redux, re-sync
  useEffect(() => {
    if (!editingDocId) return;
    const d = category.documents.find((doc) => doc.id === editingDocId);
    if (d) setDocName(d.name);
  }, [category.documents, editingDocId]);

  // Right-click context menu
  const [ctxMenu, setCtxMenu] = useState<{
    mouseX: number;
    mouseY: number;
    itemType: "category" | "document";
    itemId: string;
  } | null>(null);

  // For color picker anchored at a custom position
  const [colorMenuCoords, setColorMenuCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Close context on any left-click
  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // DRAG & DROP with a custom drag preview
  const handleDragStart = (
    e: DragEvent<HTMLButtonElement>,
    doc: EnhancedDocument
  ) => {
    e.dataTransfer.setData("docId", doc.id);
    e.dataTransfer.setData("sourceCatId", category.id);

    // Create a hidden DOM element so setDragImage can show it
    const dragIcon = document.createElement("div");
    dragIcon.style.fontSize = "13px";
    dragIcon.style.padding = "6px 8px";
    dragIcon.style.backgroundColor = "#457b9d";
    dragIcon.style.color = "#fff";
    dragIcon.style.borderRadius = "4px";
    dragIcon.innerText = `Dragging: ${doc.name}`;
    dragIcon.style.position = "absolute";
    dragIcon.style.top = "-9999px";
    dragIcon.style.left = "-9999px";
    document.body.appendChild(dragIcon);

    // Use the hidden element as the drag image
    e.dataTransfer.setDragImage(dragIcon, 0, 0);

    // Remove it when drag ends
    e.currentTarget.addEventListener("dragend", () => {
      document.body.removeChild(dragIcon);
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const docId2 = e.dataTransfer.getData("docId");
    const sourceCatId = e.dataTransfer.getData("sourceCatId");
    if (!docId2 || !sourceCatId) return;
    if (sourceCatId === category.id) return; // no move if same cat
    dispatch(
      updateDocument({
        docId: docId2,
        categoryId: category.id,
      })
    );
  };

  // Right-click context
  const handleContextMenu = (
    e: ReactMouseEvent,
    itemType: "category" | "document",
    itemId: string
  ) => {
    e.preventDefault();
    setCtxMenu({
      mouseX: e.clientX + 2,
      mouseY: e.clientY - 6,
      itemType,
      itemId,
    });
  };

  // (1) RENAME from context menu
  const handleRename = () => {
    if (!ctxMenu) return;

    if (ctxMenu.itemType === "category") {
      setEditingCat(true);
      setCatName(category.name);
    } else {
      const doc = category.documents.find((d) => d.id === ctxMenu.itemId);
      if (doc) {
        setEditingDocId(ctxMenu.itemId);
        setDocName(doc.name);
      }
    }
    setCtxMenu(null);
  };

  // Actually rename category
  const commitCatRename = () => {
    const trimmed = catName.trim();
    if (trimmed && trimmed !== category.name) {
      dispatch(upsertCategory({ categoryId: category.id, name: trimmed }));
    }
    setEditingCat(false);
  };

  const commitDocRename = (docId: string) => {
    const trimmed = docName.trim();
    if (trimmed) {
      dispatch(updateDocument({ docId, name: trimmed }));
    }
    setEditingDocId(null);
  };

  // (2) DELETE
  const handleDelete = () => {
    if (!ctxMenu) return;
    if (ctxMenu.itemType === "category") {
      dispatch(deleteCategory({ id: ctxMenu.itemId }));
    } else {
      dispatch(deleteDocument({ id: ctxMenu.itemId }));
    }
    setCtxMenu(null);
  };

  // (3) CHANGE COLOR
  const handleChangeColor = (mouseX: number, mouseY: number) => {
    setColorMenuCoords({ x: mouseX, y: mouseY });
    setCtxMenu(null);
  };

  const pickColor = (c: string) => {
    dispatch(upsertCategory({ categoryId: category.id, color: c }));
    setColorMenuCoords(null);
  };

  // Double-click rename logic (same as context-rename):
  const handleCatDoubleClick = () => {
    setEditingCat(true);
    setCatName(category.name);
  };

  const handleDocDoubleClick = (doc: EnhancedDocument) => {
    setEditingDocId(doc.id);
    setDocName(doc.name);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`${styles.animated}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Category row */}
      <Box
        className={`${styles.categoryItem} ${
          hasSelectedDoc ? styles.active : ""
        }`}
      >
        <ListItemButton
          onClick={() => setOpen(!isOpen)}
          onContextMenu={(e) => handleContextMenu(e, "category", category.id)}
          // onDoubleClick={handleCatDoubleClick}
          className={styles.categoryLabel}
          disableRipple
          sx={{
            color: category.color,
            padding: "8px 12px",
          }}
        >
          {isOpen ? (
            <FolderOpen
              className={styles.categoryIcon}
              style={{ marginRight: "10px" }}
            />
          ) : (
            <Folder
              className={styles.categoryIcon}
              style={{ marginRight: "10px" }}
            />
          )}

          {editingCat ? (
            <TextField
              variant="standard"
              autoFocus
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitCatRename();
                }
              }}
              sx={{
                maxWidth: 160,
                "& .MuiInput-root": {
                  fontSize: "15px",
                },
              }}
            />
          ) : (
            <Typography
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 500,
                fontSize: "15px",
              }}
            >
              {category.name}
            </Typography>
          )}
        </ListItemButton>
      </Box>

      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        {category.documents.map((doc, docIndex) => (
          <Box
            key={doc.id}
            className={`${styles.documentItem} ${styles.animated}`}
            style={{ animationDelay: `${docIndex * 0.03 + 0.1}s` }}
          >
            <ListItemButton
              onClick={() => navigate(urlFor("docs", doc.id))}
              onContextMenu={(e) => handleContextMenu(e, "document", doc.id)}
              // onDoubleClick={() => handleDocDoubleClick(doc)}
              disableRipple
              className={doc.id === docId ? styles.active : ""}
              sx={{
                padding: "4px 6px",
                borderRadius: "4px",
                color: "rgba(255, 255, 255, 0.7)",
                "& .MuiListItemIcon-root": {
                  minWidth: "30px", // Reduce icon width to remove spacing
                },
                "& .MuiTouchRipple-root": {
                  display: "none", // Remove ripple effect
                },
              }}
            >
              <Description
                className={styles.docIcon}
                fontSize="small"
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              />

              {editingDocId === doc.id ? (
                <TextField
                  variant="standard"
                  autoFocus
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      commitDocRename(doc.id);
                    }
                  }}
                  sx={{
                    maxWidth: 160,
                    "& .MuiInput-root": {
                      fontSize: "14px",
                    },
                  }}
                />
              ) : (
                <Typography
                  sx={{
                    fontSize: "14px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {doc.name}
                </Typography>
              )}
            </ListItemButton>
          </Box>
        ))}
      </Collapse>

      {/* Right-click context menu */}
      <Menu
        open={Boolean(ctxMenu)}
        onClose={() => setCtxMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          ctxMenu ? { top: ctxMenu.mouseY, left: ctxMenu.mouseX } : undefined
        }
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: "8px",
            "& .MuiMenuItem-root": {
              fontSize: "14px",
              padding: "6px 16px",
            },
          },
        }}
      >
        <MenuItem onClick={handleRename}>
          <Edit sx={{ mr: 1, fontSize: "18px" }} fontSize="small" /> Rename
        </MenuItem>
        {ctxMenu?.itemType === "category" && (
          <MenuItem
            onClick={() =>
              handleChangeColor(ctxMenu.mouseX, ctxMenu.mouseY + 8)
            }
          >
            <Palette sx={{ mr: 1, fontSize: "18px" }} fontSize="small" /> Change
            Color
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <Delete sx={{ mr: 1, fontSize: "18px" }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Color picker anchored at custom position */}
      <Menu
        open={Boolean(colorMenuCoords)}
        onClose={() => setColorMenuCoords(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          colorMenuCoords
            ? { top: colorMenuCoords.y, left: colorMenuCoords.x }
            : undefined
        }
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: "8px" },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 1,
            p: 2,
          }}
        >
          {categoryColors.map((c) => (
            <Box
              key={c}
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: c,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border:
                  c === category.color
                    ? "2px solid #000"
                    : "2px solid transparent",
                ":hover": {
                  transform: "scale(1.15)",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                },
              }}
              onClick={() => pickColor(c)}
            />
          ))}
        </Box>
      </Menu>
    </div>
  );
}
