import React, { FC, MouseEvent, useState } from "react";
import { IconButton, Menu, MenuItem, Avatar } from "@mui/material";
import styles from "./index.module.scss"; // Import the SCSS module

/**
 * Profile component with a clickable avatar.
 * Clicking opens a dropdown; includes "Log Out".
 */
export const Profile: FC = () => {
  // MUI menu anchor element (null when closed).
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  /** Open the menu by setting the anchor */
  const handleMenuClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  /** Close the menu by clearing the anchor */
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /** Example logout action */
  const handleLogout = () => {
    alert("Logged out");
    handleMenuClose(); // also close the menu
  };

  // Whether the menu is open depends on anchorEl
  const open = Boolean(anchorEl);

  return (
    <div>
      {/* Avatar Button */}
      <IconButton
        onClick={handleMenuClick}
        sx={{
          padding: 0, // Remove padding
          margin: 0, // Remove margin
          // "&:hover": { backgroundColor: "transparent" }, // Remove hover background
        }}
      >
        <Avatar
          src="/logo512.png"
          alt="Profile"
          sx={{ width: 40, height: 40 }}
        />
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        // optional: position the menu exactly as you like
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleLogout}>Log Out</MenuItem>
      </Menu>
    </div>
  );
};

export default Profile;
