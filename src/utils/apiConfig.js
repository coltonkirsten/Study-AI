// API configuration for OpenAI
export const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "";

// Check if API key exists, provide console warnings in dev environment
if (!OPENAI_API_KEY && process.env.NODE_ENV !== "production") {
  console.warn(
    "⚠️ OpenAI API key is not set. Set the REACT_APP_OPENAI_API_KEY environment variable in .env file."
  );
}
