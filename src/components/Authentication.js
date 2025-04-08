import React, { useState, useEffect, useRef } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import { useAuth } from "../utils/AuthContext";
import "@aws-amplify/ui-react/styles.css";
import "../styles/Authentication.css";

const Authentication = ({ children }) => {
  const { user, signOut, isAuthenticating, checkUser } = useAuth();
  const [showAuthenticator, setShowAuthenticator] = useState(false);
  const [justAuthenticated, setJustAuthenticated] = useState(false);
  const authenticatorUserRef = useRef(null);
  const prevAuthUserRef = useRef(null);

  // Function to toggle the authenticator visibility
  const toggleAuthenticator = () => {
    setShowAuthenticator(!showAuthenticator);
  };

  // Effect to check user when component mounts
  useEffect(() => {
    console.log("Authentication - Initial check user");
    checkUser();
  }, [checkUser]);

  // Watch for changes to the user state
  useEffect(() => {
    console.log("Authentication - user state changed:", user);

    // If user just authenticated and modal is open, close it
    if (user && showAuthenticator && justAuthenticated) {
      console.log("Authentication - User authenticated, closing modal");
      setShowAuthenticator(false);
      setJustAuthenticated(false);
    }
  }, [user, showAuthenticator, justAuthenticated]);

  // Handle authenticator user change
  const handleAuthenticatorUser = (authenticatorUser) => {
    console.log("Authentication - Authenticator user:", authenticatorUser);

    if (authenticatorUser && !authenticatorUserRef.current) {
      // New authentication
      authenticatorUserRef.current = authenticatorUser;
      setJustAuthenticated(true);

      // Force check user
      console.log("Authentication - New login detected, checking user");
      checkUser();

      // Force update app state immediately
      setTimeout(() => {
        checkUser();
      }, 500);
    } else if (!authenticatorUser && authenticatorUserRef.current) {
      // User signed out from authenticator
      authenticatorUserRef.current = null;
    }
  };

  // AuthenticatorWrapper component that safely uses the hook pattern
  const AuthenticatorWrapper = () => {
    return (
      <Authenticator loginMechanisms={["email"]}>
        {({ signOut: authenticatorSignOut, user: authenticatorUser }) => {
          // This runs on each render, detecting changes without using hooks
          if (prevAuthUserRef.current !== authenticatorUser) {
            // If the user has changed
            handleAuthenticatorUser(authenticatorUser);
            // Update the reference
            prevAuthUserRef.current = authenticatorUser;
          }

          // Show a success message if authenticated
          if (authenticatorUser) {
            return (
              <div className="auth-success">
                <p>Sign in successful! Redirecting to your library...</p>
              </div>
            );
          }
          return null;
        }}
      </Authenticator>
    );
  };

  // Pass authentication methods to children
  return (
    <>
      {/* Render the main app */}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            user,
            signOut,
            showAuthenticator: toggleAuthenticator,
            isAuthenticated: !!user,
          });
        }
        return child;
      })}

      {/* Overlay authenticator when needed */}
      {showAuthenticator && (
        <div className="auth-overlay">
          <div className="auth-modal">
            <div className="auth-modal-header">
              <h2>Sign in to StudyBuddy</h2>
              <button className="close-button" onClick={toggleAuthenticator}>
                ×
              </button>
            </div>
            <AuthenticatorWrapper />
          </div>
        </div>
      )}
    </>
  );
};

export default Authentication;
