// --------------------------------------------------
// File: src/pages/Root/Categories/index.tsx
// Updated with debugging logs for react-dnd functionality
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
  deleteDocument,
} from "@/store";
import { urlFor } from "@/pages/urlfor";
import { useState, useEffect, MouseEvent as ReactMouseEvent } from "react";
import { Category } from "@/types";
import {
  EnhancedDocument,
  selectCategories,
  updateDocument,
  upsertCategory,
} from "@/store/slices/categories";
import { useDrag, useDrop } from "react-dnd";

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
const mapStateToProps = (state: RootState) => ({
  categories: selectCategories(state),
  status: state.categories.status,
  reason:
    state.categories.status === "failure"
      ? state.categories.message
      : undefined,
});
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export function CategoriesComponent({
  reason,
  status,
  categories,
}: PropsFromRedux) {
  const cats = Object.values(categories).filter(
    (c?: Category): c is Category => c !== undefined
  );
  return (
    <Conditional status={status} reason={reason}>
      <List>
        {cats.map((cat) => (
          <CategoryRow key={cat.id} category={cat} total={cats.length} />
        ))}
      </List>
    </Conditional>
  );
}
export const Categories = connector(CategoriesComponent);

/** A separate component for each draggable document item */
interface DocumentItemProps {
  doc: EnhancedDocument;
  categoryId: string;
  selected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent, docId: string) => void;
  onDoubleClick: () => void;
  editingDocId: string | null;
  docName: string;
  setDocName: (name: string) => void;
  commitDocRename: (docId: string) => void;
}

function DocumentItem({
  doc,
  categoryId,
  selected,
  onClick,
  onContextMenu,
  onDoubleClick,
  editingDocId,
  docName,
  setDocName,
  commitDocRename,
}: DocumentItemProps) {
  const [{ isDragging }, dragRef] = useDrag({
    type: "DOCUMENT",
    item: { docId: doc.id, sourceCatId: categoryId },
    collect: (monitor: { isDragging: () => any }) => {
      const dragging = monitor.isDragging();
      console.log(`DocumentItem (${doc.id}): monitor.isDragging = ${dragging}`);
      return { isDragging: dragging };
    },
  });

  return (
    <ListItemButton
      key={doc.id}
      selected={selected}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, doc.id)}
      onDoubleClick={onDoubleClick}
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
        ref={(node: HTMLButtonElement | null) => {
          void dragRef(node);
        }}
        style={{
          marginLeft: "auto",
          cursor: "grab",
          background: "transparent",
          border: "none",
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <span style={{ color: "#999" }}>⋮⋮</span>
      </button>
    </ListItemButton>
  );
}

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
  const hasSelectedDoc = category.documents.some((d) => d.id === docId);
  const isOpen = open || hasSelectedDoc;

  // Inline rename for category
  const [editingCat, setEditingCat] = useState(false);
  const [catName, setCatName] = useState(category.name);
  useEffect(() => {
    if (!editingCat) setCatName(category.name);
  }, [category.name, editingCat]);

  // Inline rename for documents
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
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

  // For color picker position
  const [colorMenuCoords, setColorMenuCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // Set up drop target for documents using react-dnd.
  const [, dropRef] = useDrop({
    accept: "DOCUMENT",
    drop: (item: { docId: string; sourceCatId: string }) => {
      console.log(
        `CategoryRow (${category.id}): drop callback called with item: `,
        item
      );
      if (item.sourceCatId === category.id) {
        console.log(
          "CategoryRow: dropped item is from the same category, ignoring."
        );
        return;
      }
      dispatch(updateDocument({ docId: item.docId, categoryId: category.id }));
    },
    collect: (monitor: { isOver: () => any; canDrop: () => any }) => {
      const isOver = monitor.isOver();
      const canDrop = monitor.canDrop();
      console.log(
        `CategoryRow (${category.id}): drop monitor state - isOver: ${isOver}, canDrop: ${canDrop}`
      );
      return {};
    },
  });

  // Right-click context handler
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

  // Rename handler
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

  // Commit renames
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

  // Delete handler
  const handleDelete = () => {
    if (!ctxMenu) return;
    if (ctxMenu.itemType === "category") {
      dispatch(deleteCategory({ id: ctxMenu.itemId }));
    } else {
      dispatch(deleteDocument({ id: ctxMenu.itemId }));
    }
    setCtxMenu(null);
  };

  // Change color handler
  const handleChangeColor = (mouseX: number, mouseY: number) => {
    setColorMenuCoords({ x: mouseX, y: mouseY });
    setCtxMenu(null);
  };
  const pickColor = (c: string) => {
    dispatch(upsertCategory({ categoryId: category.id, color: c }));
    setColorMenuCoords(null);
  };

  // Double-click rename
  const handleCatDoubleClick = () => {
    setEditingCat(true);
    setCatName(category.name);
  };
  const handleDocDoubleClick = (doc: EnhancedDocument) => {
    setEditingDocId(doc.id);
    setDocName(doc.name);
  };

  return (
    // Wrap the entire category row in a drop target. Use a callback ref.
    <div
      ref={(node: HTMLDivElement | null) => {
        void dropRef(node);
      }}
    >
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
              if (e.key === "Enter") commitCatRename();
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
          <DocumentItem
            key={doc.id}
            doc={doc}
            categoryId={category.id}
            selected={doc.id === docId}
            onClick={() => navigate(urlFor("docs", doc.id))}
            onContextMenu={(e) => handleContextMenu(e, "document", doc.id)}
            onDoubleClick={() => handleDocDoubleClick(doc)}
            editingDocId={editingDocId}
            docName={docName}
            setDocName={setDocName}
            commitDocRename={commitDocRename}
          />
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

export default connector(CategoriesComponent);
