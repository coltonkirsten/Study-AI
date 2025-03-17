import React from "react";
import "../styles/Header.css";

const Header = ({ currentView, goBack, title }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        {currentView !== "library" && (
          <button className="nav-button back-button" onClick={goBack}>
            ← Back
          </button>
        )}
        <h1 className="app-title">{title || "StudyBuddy"}</h1>
      </div>
    </header>
  );
};

export default Header;
