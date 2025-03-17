import React, { useState, useRef } from "react";
import { generateStudySet, parseTextFile, parsePdfFile } from "../utils/openai";
import "../styles/CreateStudySetModal.css";

const CreateStudySetModal = ({ isOpen, onClose, onCreateStudySet }) => {
  const [contentType, setContentType] = useState("text"); // 'text', 'txt'
  const [textContent, setTextContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) {
    return null;
  }

  const handleFileUpload = async (e) => {
    console.log("File upload initiated");
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setFileName(file.name);
    setProgress("");
    setError("");

    try {
      setContentType("file");
      const fileType =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
          ? "PDF"
          : "text";

      setProgress(`Extracting text from ${fileType} file...`);

      let content;
      if (fileType === "PDF") {
        content = await parsePdfFile(file);
      } else if (
        file.type === "text/plain" ||
        file.name.toLowerCase().endsWith(".txt") ||
        file.name.toLowerCase().endsWith(".text")
      ) {
        content = await parseTextFile(file);
      } else {
        setError("Unsupported file type. Please upload a PDF or text file.");
        return;
      }

      if (!content || content.trim() === "") {
        setError(
          `No text could be extracted from the ${fileType} file. Please try another file or paste text directly.`
        );
        return;
      }

      setTextContent(content);
      setProgress(`Text successfully extracted from ${fileType} file!`);
      setTimeout(() => setProgress(""), 2000);
    } catch (err) {
      console.error("Error processing file:", err);
      setError(
        `Failed to process the file: ${
          err.message || "Unknown error"
        }. Please try again.`
      );
    }
  };

  const handleGenerateStudySet = async () => {
    if (!textContent.trim()) {
      setError("Please provide some content to generate questions from.");
      return;
    }

    if (!title.trim()) {
      setError("Please provide a title for your study set.");
      return;
    }

    setIsLoading(true);
    setError("");
    setProgress("Analyzing content and generating questions...");

    try {
      const studySet = await generateStudySet(textContent, title);
      setProgress("Study set created successfully!");
      setTimeout(() => {
        onCreateStudySet(studySet);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error generating study set:", error);
      setError(
        "Failed to generate study set. Please try again or check the console for more details."
      );
      setProgress("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Study Set</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="title">Study Set Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your study set"
              className="form-control"
            />
          </div>

          <div className="content-selection">
            <div className="selection-tabs">
              <button
                className={`tab-button ${
                  contentType === "text" ? "active" : ""
                }`}
                onClick={() => setContentType("text")}
              >
                Paste Text
              </button>
              <button
                className={`tab-button ${
                  contentType === "file" ? "active" : ""
                }`}
                onClick={() => fileInputRef.current.click()}
              >
                Upload File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".txt,.text,.pdf,application/pdf,text/plain"
                onChange={handleFileUpload}
              />
            </div>

            {contentType === "file" && fileName && (
              <div className="file-info">
                <p>
                  <strong>File:</strong> {fileName}
                </p>
              </div>
            )}

            <textarea
              className="content-textarea"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your notes, lecture content, or any material you want to create questions from..."
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {progress && <div className="progress-message">{progress}</div>}

          <div className="modal-footer">
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="generate-button"
              onClick={handleGenerateStudySet}
              disabled={isLoading || !textContent.trim()}
            >
              {isLoading ? "Generating..." : "Generate Study Set"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStudySetModal;
