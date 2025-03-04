// --- frontend/src/components/PDFDropModal/index.tsx ---
import { DragEvent } from "react";
import { Dialog, Box, Typography } from "@mui/material";
import { connect, ConnectedProps } from "react-redux";
import { RootState, AppDispatch, updateDocument, setPdfDropModal, setPdfDropStatus, PDFDropStatus, createDocument } from "@/store";
import { createSelector } from "@reduxjs/toolkit";
import { useNavigate } from "react-router";
import { urlFor } from "@/pages/urlfor";

const selectDocuments = (state: RootState) => {
  if (state.categories.status === "success") {
    return state.categories.documents;
  } else {
    return {};
  }
};
const selectByName = createSelector(
  [selectDocuments, (_state: RootState, name: string) => name],
  (documents, name) => Object.values(documents).find(d => d?.name === name)
);

const mapState = (state: RootState) => ({
  isOpen: state.ui.pdfDropModalOpen,
  status: state.ui.pdfDropModalStatus,
  // This is not great Redux style
  findByName: (name: string) => selectByName(state, name) 
});

const mapDispatch = (dispatch: AppDispatch) => ({
  close: () => {
    dispatch(setPdfDropModal(false));
    dispatch(setPdfDropStatus("neutral"));
  },
  renameDoc: (docId: string, name: string) => dispatch(updateDocument({ docId, name })),
  setStatus: (status: PDFDropStatus) => dispatch(setPdfDropStatus(status)),
  createDoc: (file: File) => dispatch(createDocument({ file }))
});
const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

function PDFDropModal({
  isOpen,
  close,
  status,
  setStatus,
  createDoc
}: PropsFromRedux) {
  const navigate = useNavigate();
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus("hover");
  };
  const handleDragExit = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus("neutral");
  };
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file === undefined || file.type !== "application/pdf") {
      setStatus("drop-failure");
      return;
    }
    const doc = await createDoc(file);
    if (typeof doc.payload === "string" || doc.payload === undefined) {
      setStatus("drop-failure");
    } else {
      navigate(urlFor("docs", doc.payload.id));
      close();
    }
  };

  let typography;
  let style;
  switch (status) {
    case "hover":
      style = { bgcolor: "primary.light", color: "primary.contrastText" }
      typography = (
	 <Typography variant="body1">
            What will you learn today?
         </Typography>
      );
      break;
  
    case "neutral":
      style = { bgcolor: "grey.200", color: "text.primary" }
      typography = (
	 <Typography variant="body1">
            Drop here to create a new doc.
         </Typography>
      );
      break;

    case "drop-success":
      style = { bgcolor: "primary.light", color: "primary.contrastText" }
      typography = (
	 <Typography variant="body1">
            Let's read!
         </Typography>
      );
      break;

    case "drop-failure":
      style = { bgcolor: "error.light", color: "error.dark" };
      typography = (
	 <Typography variant="body1">
           Only PDF files are supported at this time!
         </Typography>
      );
      break;
  }

  return (
    <Dialog open={isOpen} onClose={close} maxWidth="xl" fullWidth>
      <Box
	onDragExit={handleDragExit}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
	  ...style,
          minHeight: "300px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
	{ typography }
      </Box>
    </Dialog>
  );
}

export default connector(PDFDropModal);
