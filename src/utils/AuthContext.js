import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { Amplify } from "aws-amplify";
import { Hub } from "@aws-amplify/core";
import {
  getCurrentUser,
  signIn,
  signOut,
  fetchUserAttributes,
} from "@aws-amplify/auth";
import outputs from "../amplify_outputs.json";

// Configure Amplify with authentication settings
Amplify.configure(outputs);

// Create the AuthContext
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Function to check current authenticated user
  const checkUser = useCallback(async () => {
    console.log("AuthContext - Checking user...");
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      console.log("AuthContext - User found:", currentUser);
      try {
        const attributes = await fetchUserAttributes();
        console.log("AuthContext - User attributes:", attributes);
        setUser({ ...currentUser, attributes });
      } catch (attrError) {
        console.log("AuthContext - Could not fetch attributes:", attrError);
        // If we can't get attributes, still set the user
        setUser(currentUser);
      }
    } catch (error) {
      console.log("AuthContext - No user found:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up listener for auth events
  useEffect(() => {
    console.log("AuthContext - Setting up Hub listener");
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      console.log("AuthContext - Auth event:", payload.event);
      switch (payload.event) {
        case "signIn":
          console.log("AuthContext - Sign in event detected");
          checkUser();
          break;
        case "signOut":
          console.log("AuthContext - Sign out event detected");
          setUser(null);
          break;
        case "customOAuthState":
          console.log("AuthContext - customOAuthState", payload);
          break;
        default:
          break;
      }
    });

    // Check for user on mount
    checkUser();

    // Clean up the listener
    return () => {
      console.log("AuthContext - Cleaning up Hub listener");
      unsubscribe();
    };
  }, [checkUser]);

  // Sign in function
  async function handleSignIn(username, password) {
    console.log("AuthContext - Signing in:", username);
    setIsAuthenticating(true);
    try {
      const { isSignedIn, nextStep } = await signIn({ username, password });
      console.log("AuthContext - Sign in result:", { isSignedIn, nextStep });
      if (isSignedIn) {
        await checkUser();
      }
      return { isSignedIn, nextStep };
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }

  // Sign out function
  async function handleSignOut() {
    console.log("AuthContext - Signing out");
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticating,
    signIn: handleSignIn,
    signOut: handleSignOut,
    checkUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
