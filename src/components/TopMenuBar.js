import React from "react";
import "../styles/TopMenuBar.css";

const TopMenuBar = ({ title, goBack, onAskAI, isResultView = false }) => {
  return (
    <div className="top-menu-bar">
      <div className="menu-left">
        <button className="menu-back-button" onClick={goBack}>
          ← Back
        </button>
      </div>

      <div className="menu-title">
        <h3>{title}</h3>
      </div>

      <div className="menu-right">
        <button className="menu-ai-button" onClick={onAskAI}>
          {isResultView ? "FEEDBACK" : "ASK AI"}
        </button>
      </div>
    </div>
  );
};

export default TopMenuBar;
