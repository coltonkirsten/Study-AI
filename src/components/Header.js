import React from "react";
import "../styles/Header.css";

const Header = ({
  currentView,
  goBack,
  title,
  isAuthenticated,
  signOut,
  user,
}) => {
  const isStudyOrResultView =
    currentView === "study" || currentView === "result";
  const isLibraryView = currentView === "library";

  const handleSignOut = () => {
    if (signOut) {
      signOut();
    }
  };

  const handleAskAI = () => {
    // Call the global window event for AI chat
    const aiChatEvent = new CustomEvent("openAiChat");
    window.dispatchEvent(aiChatEvent);
  };

  return (
    <div className="header-wrapper">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            {currentView !== "library" && currentView !== "landing" ? (
              <button className="nav-button back-button" onClick={goBack}>
                ← Back
              </button>
            ) : (
              <h1 className="app-title">StudyBuddy</h1>
            )}
          </div>

          <div className="header-center">
            {isAuthenticated && user && (
              <span className="user-greeting">
                Hello, {user.username || user.attributes?.email || "User"}
              </span>
            )}
          </div>

          <div className="header-right">
            {isStudyOrResultView && (
              <button className="ai-button" onClick={handleAskAI}>
                {currentView === "result" ? "Feedback" : "Ask AI"}
              </button>
            )}
            {isAuthenticated && isLibraryView && (
              <button
                className="sign-out-button inverted"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
