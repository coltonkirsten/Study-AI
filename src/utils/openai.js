import { OpenAI } from "openai";
import { z } from "zod";
import {
  STUDY_SET_GENERATION_PROMPT,
  STUDY_SET_GENERATION_MODEL,
  GENERATION_TEMPERATURE,
  getStudySetGenerationMessage,
} from "./prompts";
import { OPENAI_API_KEY } from "./apiConfig";

// Define schemas for the different question types
const FreeResponseQuestion = z.object({
  id: z.string().optional(),
  type: z.literal("freeResponse"),
  question: z.string(),
  answer: z.string(),
});

const MultipleChoiceQuestion = z.object({
  id: z.string().optional(),
  type: z.literal("multipleChoice"),
  question: z.string(),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.string(),
});

// Define the union type for questions
const Question = z.discriminatedUnion("type", [
  FreeResponseQuestion,
  MultipleChoiceQuestion,
]);

// Define the schema for a study set
const StudySet = z.object({
  name: z.string(),
  description: z.string(),
  questions: z.array(Question).min(1).max(20),
});

const initializeOpenAI = () => {
  try {
    let openai;
    // Initialize OpenAI client
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    return openai;
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error);
    throw new Error("Failed to initialize OpenAI client");
  }
};

// Generate a study set from the provided content
export const generateStudySet = async (content, title) => {
  try {
    console.log("Starting to generate study set...");
    const openaiClient = initializeOpenAI();

    // Use regular completions API instead of structured outputs if encountering issues
    console.log("Sending request to OpenAI...");
    const completion = await openaiClient.chat.completions.create({
      model: STUDY_SET_GENERATION_MODEL,
      messages: [
        {
          role: "system",
          content: STUDY_SET_GENERATION_PROMPT,
        },
        getStudySetGenerationMessage(title, content),
      ],
      response_format: { type: "json_object" },
      temperature: GENERATION_TEMPERATURE,
    });

    console.log("Received response from OpenAI.");
    const responseContent = completion.choices[0]?.message.content;

    if (!responseContent) {
      console.error("No response content from OpenAI");
      throw new Error("No response content from OpenAI");
    }

    console.log("Response content length:", responseContent.length);
    try {
      // Parse the JSON response
      console.log("Parsing JSON response...");
      const parsedResponse = JSON.parse(responseContent);

      // Validate the response against our schema
      console.log("Validating response against schema...");
      const validationResult = StudySet.safeParse(parsedResponse);

      if (!validationResult.success) {
        console.error("Validation error:", validationResult.error);
        throw new Error(
          "Response from OpenAI did not match the expected format"
        );
      }

      console.log("Successfully generated and validated study set.");
      return validationResult.data;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error(
        "Response content preview:",
        responseContent.substring(0, 200) + "..."
      );
      throw new Error("Failed to parse the response from OpenAI");
    }
  } catch (error) {
    console.error("Error generating study set:", error);
    if (error.response) {
      console.error("OpenAI API error:", error.response.data);
    }
    throw new Error(
      "Failed to generate study set. Please check your API key and try again."
    );
  }
};

// Parse a text file and extract its content
export const parseTextFile = async (file) => {
  try {
    // Read the file as text
    const text = await file.text();
    return text;
  } catch (error) {
    console.error("Error parsing text file:", error);
    throw error;
  }
};

// Parse a PDF file and extract its content
export const parsePdfFile = async (file) => {
  try {
    // Dynamically import the PDF utility to avoid loading it unless needed
    const pdfUtils = await import("./pdfUtils");
    return await pdfUtils.extractTextFromPdf(file);
  } catch (error) {
    console.error("Error parsing PDF file:", error);
    throw error;
  }
};
