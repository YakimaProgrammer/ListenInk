import React, { useState, useRef, useEffect } from "react";
import "./Profile.css";

export const Profile = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  const handleLogout = () => {
    alert("Logged out");
    setShowDropdown(false);
  };

  // Close the dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="profile-container" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="profile-button">
        <img src="/logo512.png" className="profile-image" alt="Profile" />
      </button>

      {showDropdown && (
        <div className="profile-dropdown">
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
