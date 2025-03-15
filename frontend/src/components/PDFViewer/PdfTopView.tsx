// Import necessary components and modules from MUI library.
import {
  Search,
  KeyboardArrowUp,
  KeyboardArrowDown,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material";
import { Box, IconButton, TextField } from "@mui/material";
import { useEffect, useState } from "react";

// Import styles (CSS) from other scss files.
// import styles from "./PdfViewer.module.scss";
import styles from "./pdfTopBar.module.scss";

interface PdfTopViewProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  openSearchDialog: () => void;
}

export function PdfTopView({
  currentPage,
  totalPages,
  zoomLevel,
  onPageChange,
  onZoomChange,
  openSearchDialog,
}: PdfTopViewProps) {
  // Holding users to the strict input validation requirements sucks.
  // Let's transiently let them break those requirements
  const [transientPage, setTransientPage] = useState(`${currentPage}`);
  const [isValid, setIsValid] = useState(true);

  // Reset transientPage when the external page changes. We trust this value
  useEffect(() => {
    setTransientPage(`${currentPage}`);
    setIsValid(true);
  }, [currentPage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPage = parseFloat(e.target.value);

    // Update transient value immediately
    setTransientPage(e.target.value);

    // A page must be between zero and the maximum number of pages and must be an integer
    if (
      newPage >= 0 &&
      newPage <= totalPages &&
      newPage === Math.floor(newPage)
    ) {
      onPageChange(newPage);
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  return (
    <div>
      {/* Entire Top Bar Section */}
      {/* Box for the top bar */}
      <Box
        sx={{
          width: 1040,
          height: 40,
          backgroundColor: "#dee7eb",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Search Icon for searching content */}
        <IconButton className={styles.searchIcon} onClick={openSearchDialog}>
          <Search />
        </IconButton>

        {/* Page Number Display Section */}
        <div className={styles.pageNumberDisplayBox}>
          <IconButton onClick={() => onPageChange(currentPage + 1)}>
            <KeyboardArrowUp
              className={`${styles.pageNumberDisplayBox} ${styles.arrowUpDown}`}
            />
          </IconButton>

          <TextField
            size="small"
            value={transientPage}
            error={!isValid}
            onChange={handleChange}
            fullWidth={true}
            sx={{
              width: 60,
              "& .MuiInputBase-root": {
                height: 20, // Force smaller height
                fontFamily: "Roboto", // Change font
                fontSize: "15px", // Reduce font size
              },
              borderRadius: 1, // this border radius is for the bgcolor that matches the input box
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <span
            style={{
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Roboto",
            }}
          >
            /
          </span>
          <span style={{ fontFamily: "Roboto" }}>{totalPages}</span>

          <IconButton onClick={() => onPageChange(currentPage - 1)}>
            <KeyboardArrowDown className={styles.arrowUpDown} />
          </IconButton>
        </div>

        {/* Zoom Control Section */}
        <div className={styles.zoomControl}>
          <IconButton onClick={() => onZoomChange(zoomLevel - 10)}>
            <ZoomOut />
          </IconButton>
          <span>{zoomLevel}%</span>
          <IconButton onClick={() => onZoomChange(zoomLevel + 10)}>
            <ZoomIn />
          </IconButton>
        </div>
      </Box>
    </div>
  );
}
