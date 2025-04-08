import React, { useState, useEffect } from "react";
import AiChatModal from "./AiChatModal";
import "../styles/study.css";
import { v4 as uuidv4 } from "uuid";

const StudyView = ({
  question,
  userAnswer,
  onAnswer,
  selectedOption,
  onSelectOption = () => {},
  selectedOptions = [],
  onSelectOptions = () => {},
  onCheckAnswer,
}) => {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Generate a unique session ID for the current question study session
  const [sessionId, setSessionId] = useState(() => {
    return uuidv4();
  });

  // Reset the session ID whenever the question changes
  useEffect(() => {
    if (question) {
      setSessionId(uuidv4());
    }
  }, [question]);

  // Listen for global AI chat events
  useEffect(() => {
    const handleAiChatEvent = () => {
      setIsAiChatOpen(true);
    };

    window.addEventListener("openAiChat", handleAiChatEvent);

    // Cleanup
    return () => {
      window.removeEventListener("openAiChat", handleAiChatEvent);
    };
  }, []);

  if (!question) return <div>Loading...</div>;

  // Check if the question allows multiple answers
  const isMultiSelect = Array.isArray(question.correctAnswer);

  // Handle option click for multi-select questions
  const handleMultiSelectOptionClick = (option) => {
    if (selectedOptions.includes(option)) {
      // If already selected, remove it
      onSelectOptions(selectedOptions.filter((item) => item !== option));
    } else {
      // If not selected, add it
      onSelectOptions([...selectedOptions, option]);
    }
  };

  return (
    <div className={`study-view ${isAiChatOpen ? "ai-chat-open" : ""}`}>
      <div className="question-card-container">
        <div className="question-card-main">
          <p className="question">{question.question}</p>

          {isMultiSelect && (
            <p className="instruction">Select all that apply</p>
          )}

          {question.type === "freeResponse" ? (
            <div className="free-response">
              <textarea
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => onAnswer(e.target.value)}
              />
            </div>
          ) : (
            <div className="multiple-choice">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`option ${
                    isMultiSelect
                      ? selectedOptions.includes(option)
                        ? "selected"
                        : ""
                      : selectedOption === option
                        ? "selected"
                        : ""
                  }`}
                  onClick={() =>
                    isMultiSelect
                      ? handleMultiSelectOptionClick(option)
                      : onSelectOption(option)
                  }
                >
                  {isMultiSelect ? (
                    <span className="checkbox">
                      {selectedOptions.includes(option) ? "☑" : "☐"}
                    </span>
                  ) : (
                    <span className="radio">
                      {selectedOption === option ? "●" : "○"}
                    </span>
                  )}
                  {option}
                </div>
              ))}
            </div>
          )}

          <button
            className="submit-button"
            onClick={onCheckAnswer}
            disabled={
              question.type === "freeResponse"
                ? !userAnswer.trim()
                : isMultiSelect
                  ? selectedOptions.length === 0
                  : !selectedOption
            }
          >
            Submit Answer
          </button>
        </div>
      </div>

      {isAiChatOpen && (
        <AiChatModal
          isOpen={isAiChatOpen}
          onClose={() => setIsAiChatOpen(false)}
          currentQuestion={question}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default StudyView;
