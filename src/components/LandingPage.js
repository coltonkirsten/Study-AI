import React, { useEffect } from "react";
import "../styles/LandingPage.css";
import { useAuth } from "../utils/AuthContext";

const LandingPage = ({ onSignIn, showAuthenticator, isAuthenticated }) => {
  const { user } = useAuth();

  // Log authentication state
  useEffect(() => {
    console.log("LandingPage - Auth state:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  // If user becomes authenticated, call onSignIn to navigate to the main app
  useEffect(() => {
    if (isAuthenticated) {
      console.log("LandingPage: User is authenticated, navigating to app");
      onSignIn();
    }
  }, [isAuthenticated, onSignIn]);

  // If we're already authenticated, don't even render the landing page content
  if (isAuthenticated) {
    return <div className="loading">Redirecting to your library...</div>;
  }

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">StudyBuddy</h1>
        <p className="landing-subtitle">Your personal study assistant</p>
        <div className="landing-features">
          <div className="feature">
            <div className="feature-icon">📚</div>
            <h3>Organize Your Study Sets</h3>
            <p>Create and manage custom study sets for any subject</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🧠</div>
            <h3>Track Your Progress</h3>
            <p>Monitor what you've learned and what you need to review</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Learning</h3>
            <p>Get help with explanations and study recommendations</p>
          </div>
        </div>

        <button className="sign-in-button" onClick={showAuthenticator}>
          Sign In to Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
