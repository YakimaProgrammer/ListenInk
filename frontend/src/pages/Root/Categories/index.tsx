// --------------------------------------------------
// File: src/pages/Root/Categories/index.tsx
// Updated so RIGHT-CLICK rename mirrors double-click logic
// --------------------------------------------------

import {
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  TextField,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import {
  KeyboardArrowRight,
  KeyboardArrowDown,
  Edit,
  Delete,
  Palette,
} from "@mui/icons-material";
import { connect, ConnectedProps, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { Conditional } from "@/components/Conditional";
import {
    AppDispatch,
  RootState,
  deleteCategory,
  deleteDocument
} from "@/store";
import { urlFor } from "@/pages/urlfor";
import {
  useState,
  useEffect,
  MouseEvent as ReactMouseEvent,
  DragEvent,
} from "react";
import { Category, Document } from "@/types";
import { EnhancedDocument, selectCategories, updateDocument, upsertCategory } from "@/store/slices/categories";

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
    reason: state.categories.status === "failure" ? state.categories.message : undefined
  }
};
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function CategoriesComponent({ reason, status, categories }: PropsFromRedux) {
  const cats = Object.values(categories).filter((c?: Category): c is Category => c !== undefined);
  return (
    <Conditional status={status} reason={reason}>
      <List>
        {cats.map(cat => (
          <CategoryRow
            key={cat.id}
            category={cat}
            total={cats.length}
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
}
function CategoryRow({ category, total }: CategoryRowProps) {
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
    dragIcon.style.backgroundColor = "#333";
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
    console.log("Context menu rename triggered:", ctxMenu);
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
      dispatch(
        upsertCategory({ categoryId: category.id, name: trimmed })
      );
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
    dispatch(
      upsertCategory({ categoryId: category.id, color: c })
    );
    setColorMenuCoords(null);
  };

  // (4) REORDER categories up/down
  const handleMoveUp = (e: ReactMouseEvent) => {
    e.stopPropagation();
    dispatch(
      upsertCategory({
        categoryId: category.id,
        order: category.order + 1
      })
    );
  };
  const handleMoveDown = (e: ReactMouseEvent) => {
    e.stopPropagation();
    dispatch(
      upsertCategory({
        categoryId: category.id,
        order: category.order - 1
      })
    );
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
    <div onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Category row */}
      <ListItemButton
        onClick={() => setOpen(!isOpen)}
        onContextMenu={(e) => handleContextMenu(e, "category", category.id)}
        onDoubleClick={handleCatDoubleClick}
        sx={{ display: "flex", gap: 1 }}
      >
        {isOpen ? <KeyboardArrowDown /> : <KeyboardArrowRight />}

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
            sx={{ maxWidth: 160 }}
          />
        ) : (
          <ListItemText
            primary={category.name}
            sx={{
              color: category.color,
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          />
        )}
      </ListItemButton>

      <Collapse in={isOpen}>
        {category.documents.map((doc) => (
          <ListItemButton
            key={doc.id}
            selected={doc.id === docId}
            onClick={() => navigate(urlFor("docs", doc.id))}
            onContextMenu={(e) => handleContextMenu(e, "document", doc.id)}
            onDoubleClick={() => handleDocDoubleClick(doc)}
            sx={{ pl: 6 }}
          >
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
                sx={{ maxWidth: 200 }}
              />
            ) : (
              <ListItemText
                primary={doc.name}
                sx={{
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              />
            )}
            <button
              style={{
                marginLeft: "auto",
                cursor: "grab",
                background: "transparent",
                border: "none",
              }}
              draggable
              onDragStart={(ev) => handleDragStart(ev, doc)}
            >
              <span style={{ color: "#999" }}>⋮⋮</span>
            </button>
          </ListItemButton>
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
      >
        <MenuItem onClick={handleRename}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Rename
        </MenuItem>
        {ctxMenu?.itemType === "category" && (
          <MenuItem
            onClick={() =>
              handleChangeColor(ctxMenu.mouseX, ctxMenu.mouseY + 8)
            }
          >
            <Palette sx={{ mr: 1 }} fontSize="small" /> Change Color
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <Delete sx={{ mr: 1 }} fontSize="small" /> Delete
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
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: c,
                cursor: "pointer",
                ":hover": { transform: "scale(1.1)" },
              }}
              onClick={() => pickColor(c)}
            />
          ))}
        </Box>
      </Menu>
    </div>
  );
}
