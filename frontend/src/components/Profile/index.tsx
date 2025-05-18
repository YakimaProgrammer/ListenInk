import React, { FC, MouseEvent, useState } from "react";
import { IconButton, Menu, MenuItem, Avatar } from "@mui/material";
import { useDispatch } from "react-redux";
import { AppDispatch, logout } from "@/store";
import { useNavigate } from "react-router";
import { urlFor } from "@/pages/urlfor";

/**
 * Profile component with a clickable avatar.
 * Clicking opens a dropdown; includes "Log Out".
 */
export const Profile: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
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
    navigate(urlFor("login"));
    dispatch(logout())
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
          padding: 0,
          margin: 0,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            transform: "scale(1.05)",
          },
          transition: "all 0.3s ease",
        }}
      >
        <Avatar
          src="/api/v1/auth/profile_picture/@me"
          alt="Profile"
	  sx={{
	    width: 40,
            height: 40,
            backgroundColor: "rgba(30, 30, 45, 0.9)",
            color: "white",
            fontWeight: "bold",
            fontSize: "18px",
            border: "2px solid rgba(255, 255, 255, 0.2)",
	  }}
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
