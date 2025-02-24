// --- frontend/src/components/PDFDropModal/index.tsx ---
import { useState, useEffect, DragEvent } from "react";
import { Dialog, Box, Typography } from "@mui/material";
import { connect, ConnectedProps } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  attachPdfToDocument,
  addNewDocument,
  renameDocument,
  setCurDocument,
} from "@/store/slices/categories";
import { ReducedDoc } from "@/store/slices/categories";

// We assume you have a "pdfByDocId" in your categories slice. If not, define a slice property.
const mapState = (state: RootState) => ({
  doc: state.categories.curDocumentId
    ? findDocById(state.categories.curDocumentId, state)
    : null,
  pdfMap: state.categories.pdfByDocId,
  allDocs:
    state.categories.status === "success"
      ? state.categories.categories.flatMap((c) => c.documents)
      : [],
});
function findDocById(docId: string, state: RootState): ReducedDoc | null {
  if (state.categories.status !== "success") return null;
  for (let cat of state.categories.categories) {
    for (let d of cat.documents) {
      if (d.id === docId) return d;
    }
  }
  return null;
}

const mapDispatch = (dispatch: AppDispatch) => ({
  attachPdf: (docId: string, file: File) =>
    dispatch(attachPdfToDocument({ docId, file })),
  addDoc: (payload: { name: string; text?: string }) =>
    dispatch(addNewDocument(payload)),
  renameDoc: (docId: string, newName: string) =>
    dispatch(renameDocument({ docId, newName })),
  setCurDoc: (docId: string | null) => dispatch(setCurDocument(docId)),
});
const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  open: boolean;
  onClose: () => void;
};

function PDFDropModal({
  open,
  onClose,
  doc,
  pdfMap,
  allDocs,
  attachPdf,
  addDoc,
  renameDoc,
  setCurDoc,
}: PropsFromRedux) {
  const [show, setShow] = useState(open);
  useEffect(() => setShow(open), [open]);

  const canDrop = doc ? !pdfMap[doc.id] : true;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!canDrop) {
      // Already has a PDF: we’ll create new doc
    }
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    const newName = file.name.replace(/\.pdf$/i, "");
    if (doc) {
      if (pdfMap[doc.id]) {
        // doc has PDF => create new doc
        const newDocId = `doc-${Date.now()}`;
        addDoc({ name: newName });
        attachPdf(newDocId, file);
        setCurDoc(newDocId);
        alert(`Document had a PDF. Created new doc: ${newName}`);
      } else {
        // attach to current doc
        attachPdf(doc.id, file);
        renameDoc(doc.id, newName);
        alert(`Attached PDF + renamed to "${newName}"`);
      }
    } else {
      // no doc => create new doc
      const newDocId = `doc-${Date.now()}`;
      addDoc({ name: newName });
      attachPdf(newDocId, file);
      setCurDoc(newDocId);
      alert(`Created doc "${newName}" + attached PDF`);
    }
    onClose();
  };

  return (
    <Dialog open={show} onClose={onClose} maxWidth="xl" fullWidth>
      <Box
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          minHeight: "300px",
          backgroundColor: "rgba(255,255,255,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {doc && pdfMap[doc.id] ? (
          <Typography variant="body1">
            Current document <strong>{doc.name}</strong> already has a PDF.
            <br />
            Drop here to create a new doc.
          </Typography>
        ) : (
          <Typography variant="h6">Drag + Drop PDF Here</Typography>
        )}
      </Box>
    </Dialog>
  );
}

export default connector(PDFDropModal);
