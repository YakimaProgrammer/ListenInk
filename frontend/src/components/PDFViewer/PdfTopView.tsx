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
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
        className={styles.pdfTopBar}
      >
        {/* Search Icon for searching content */}
        <IconButton className={styles.searchIcon} onClick={openSearchDialog}>
          <Search />
        </IconButton>

        {/* Page Number Display Section */}
        <div className={styles.pageNumberDisplayBox}>
          <IconButton onClick={() => onPageChange(currentPage + 1)}>
            <KeyboardArrowUp className={styles.arrowUpDown} />
          </IconButton>

          <div className={styles.pageNumberContainer}>
            <TextField
              size="small"
              value={transientPage}
              error={!isValid}
              onChange={handleChange}
              className={styles.pageInput}
              sx={{
                width: 50,
                "& .MuiInputBase-root": {
                  height: 28,
                  fontFamily: "Roboto",
                  fontSize: "15px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  padding: "0 8px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
                "& input": {
                  color: "white",
                  textAlign: "center",
                },
              }}
            />
            <span className={styles.pageDivider}>of</span>
            <span className={styles.pageTotal}>{totalPages}</span>
          </div>

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
