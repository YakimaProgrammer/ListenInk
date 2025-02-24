// --------------------------------------------------
// File: src/pages/Root/Categories/index.tsx
// --------------------------------------------------
import {
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import {
  KeyboardArrowRight,
  KeyboardArrowDown,
  ArrowUpward,
  ArrowDownward,
  Edit,
  Delete,
  Palette,
} from "@mui/icons-material";
import { connect, ConnectedProps } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { Conditional } from "@/components/Conditional";
import { RootState, AppDispatch, setCategory } from "@/store";
import {
  ReshapedCategory,
  ReducedDoc,
  renameCategory,
  renameDocument,
  deleteCategory,
  deleteDocument,
  changeCategoryColor,
  reorderCategories,
  moveDocument,
} from "@/store/slices/categories";
import { urlFor } from "@/pages/urlfor";
import { MouseEvent, useState, DragEvent, useEffect } from "react";

// A set of possible colors for category (like the old code)
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

const mapStateToProps = (state: RootState) => {
  const reason =
    state.categories.status === "failure"
      ? state.categories.message
      : undefined;
  const categories =
    state.categories.status === "success" ? state.categories.categories : [];

  return {
    reason,
    categories,
    status: state.categories.status,
  };
};

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  setOpenCategory: (catId: string, open: boolean) =>
    dispatch(setCategory({ id: catId, open })),
});
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function CategoriesComponent({ reason, status, categories }: PropsFromRedux) {
  return (
    <Conditional status={status} reason={reason}>
      <List>
        {categories.map((cat, index) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            index={index}
            total={categories.length}
          />
        ))}
      </List>
    </Conditional>
  );
}

export const Categories = connector(CategoriesComponent);

// Each Category row
interface CategoryRowProps {
  category: ReshapedCategory;
  index: number;
  total: number;
}
function CategoryRow({ category, index, total }: CategoryRowProps) {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const hasSelectedDoc = category.documents.some((d) => d.id === docId);
  // Actually open if user has selected doc in here, or local state
  const isOpen = open || hasSelectedDoc;

  // For inline rename
  const [editingCat, setEditingCat] = useState(false);
  const [catName, setCatName] = useState(category.name);

  // For doc rename
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docName, setDocName] = useState("");

  // Right-click context menu
  const [ctxMenu, setCtxMenu] = useState<{
    mouseX: number;
    mouseY: number;
    itemType: "category" | "document";
    itemId: string;
  } | null>(null);

  // Color submenu
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);

  // close the context if user left-clicks away
  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // DRAG & DROP:
  // When we drag a doc
  const handleDragStart = (
    e: DragEvent<HTMLButtonElement>,
    doc: ReducedDoc
  ) => {
    e.dataTransfer.setData("docId", doc.id);
    e.dataTransfer.setData("sourceCatId", category.id);
  };
  // We allow dropping on the category row itself
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  // On drop => dispatch moveDocument
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const docId2 = e.dataTransfer.getData("docId");
    const sourceCatId = e.dataTransfer.getData("sourceCatId");
    if (!docId2 || !sourceCatId) return;
    if (sourceCatId === category.id) return; // same category => no move
    window.store.dispatch(
      moveDocument({
        docId: docId2,
        sourceCategoryId: sourceCatId,
        targetCategoryId: category.id,
      })
    );
  };

  // Right-click
  const handleContextMenu = (
    e: MouseEvent,
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

  // Actually do rename cat
  const commitCatRename = () => {
    if (catName.trim() && catName !== category.name) {
      window.store.dispatch(
        renameCategory({ categoryId: category.id, newName: catName.trim() })
      );
    }
    setEditingCat(false);
  };

  // Move cat up or down
  const handleMoveUp = (e: MouseEvent) => {
    e.stopPropagation();
    if (index < 1) return;
    const aboveCat = getCatAtIndex(index - 1);
    if (!aboveCat) return;
    window.store.dispatch(
      reorderCategories({
        categoryId: category.id,
        referenceCategoryId: aboveCat.id,
        position: "before",
      })
    );
  };
  const handleMoveDown = (e: MouseEvent) => {
    e.stopPropagation();
    if (index >= total - 1) return;
    const belowCat = getCatAtIndex(index + 1);
    if (!belowCat) return;
    window.store.dispatch(
      reorderCategories({
        categoryId: category.id,
        referenceCategoryId: belowCat.id,
        position: "after",
      })
    );
  };

  // context menu actions
  const handleRename = () => {
    if (ctxMenu?.itemType === "category") {
      // rename category inline
      setEditingCat(true);
      setCatName(category.name);
    } else if (ctxMenu?.itemType === "document") {
      // rename doc inline
      setEditingDocId(ctxMenu.itemId);
      const d = category.documents.find((doc) => doc.id === ctxMenu.itemId);
      if (d) setDocName(d.name);
    }
    setCtxMenu(null);
  };
  const handleDelete = () => {
    if (ctxMenu?.itemType === "category") {
      window.store.dispatch(deleteCategory(ctxMenu.itemId));
    } else {
      if (ctxMenu) {
        window.store.dispatch(deleteDocument(ctxMenu.itemId));
      }
    }
    setCtxMenu(null);
  };
  const handleChangeColor = (anchor: HTMLElement) => {
    setColorAnchor(anchor);
    setCtxMenu(null);
  };
  const pickColor = (c: string) => {
    window.store.dispatch(
      changeCategoryColor({
        categoryId: category.id,
        color: c,
      })
    );
    setColorAnchor(null);
  };

  // doc rename commit
  const commitDocRename = (docId: string) => {
    if (!docName.trim()) {
      setEditingDocId(null);
      return;
    }
    window.store.dispatch(
      renameDocument({
        docId,
        newName: docName.trim(),
      })
    );
    setEditingDocId(null);
  };

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Category header row */}
      <ListItemButton
        onClick={() => setOpen(!isOpen)}
        onContextMenu={(e) => handleContextMenu(e, "category", category.id)}
        sx={{ display: "flex", gap: 1 }}
      >
        {isOpen ? <KeyboardArrowDown /> : <KeyboardArrowRight />}

        {editingCat ? (
          <TextField
            variant="standard"
            autoFocus
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            onBlur={commitCatRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
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

        {/* Up/down arrow for reordering */}
        <Box sx={{ ml: "auto", display: "flex" }}>
          {index > 0 && (
            <IconButton size="small" onClick={handleMoveUp}>
              <ArrowUpward fontSize="inherit" />
            </IconButton>
          )}
          {index < total - 1 && (
            <IconButton size="small" onClick={handleMoveDown}>
              <ArrowDownward fontSize="inherit" />
            </IconButton>
          )}
        </Box>
      </ListItemButton>

      {/* The documents */}
      <Collapse in={isOpen}>
        {category.documents.map((doc) => (
          <ListItemButton
            key={doc.id}
            selected={doc.id === docId}
            onClick={() => navigate(urlFor("docs", doc.id))}
            onContextMenu={(e) => handleContextMenu(e, "document", doc.id)}
            sx={{ pl: 6 }}
          >
            {editingDocId === doc.id ? (
              <TextField
                variant="standard"
                autoFocus
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                onBlur={() => commitDocRename(doc.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
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

            {/* Draggable doc */}
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
              {/* Could show a small "grip" icon */}
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
          <MenuItem onClick={(e) => handleChangeColor(e.currentTarget)}>
            <Palette sx={{ mr: 1 }} fontSize="small" /> Change Color
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <Delete sx={{ mr: 1 }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Color picker submenu */}
      <Menu
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={() => setColorAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
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

  function getCatAtIndex(i: number): ReshapedCategory | undefined {
    const st = window.store.getState();
    if (st.categories.status !== "success") return undefined;
    return st.categories.categories[i];
  }
}

export default CategoriesComponent;
