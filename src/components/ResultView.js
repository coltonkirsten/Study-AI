import React, { useState, useEffect } from "react";
import AiChatModal from "./AiChatModal";
import "../styles/study.css";
import { v4 as uuidv4 } from "uuid";

const ResultView = ({
  question,
  userAnswer,
  selectedOption,
  selectedOptions,
  isCorrect,
  onStudyAgain,
  onMarkLearned,
}) => {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Generate a unique session ID for the current result view session
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

  // Check if the question allowed multiple answers
  const isMultiSelect = Array.isArray(question.correctAnswer);

  return (
    <div className={`study-view ${isAiChatOpen ? "ai-chat-open" : ""}`}>
      <div className="question-card-container">
        <div className="question-card-main">
          {question.type === "multipleChoice" ? (
            <p className="question">
              {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
            </p>
          ) : (
            <p className="question">Answer Review</p>
          )}

          <div className="answer-section">
            <h3>Question:</h3>
            <p>{question.question}</p>

            <h3>Your Answer:</h3>
            {question.type === "freeResponse" ? (
              <p>{userAnswer}</p>
            ) : isMultiSelect ? (
              <ul className="answer-list">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map((option, index) => (
                    <li key={index}>{option}</li>
                  ))
                ) : (
                  <li className="no-selection">No options selected</li>
                )}
              </ul>
            ) : (
              <p>{selectedOption}</p>
            )}

            <h3>Correct Answer:</h3>
            {question.type === "freeResponse" ? (
              <p>{question.answer}</p>
            ) : isMultiSelect ? (
              <ul className="answer-list correct">
                {question.correctAnswer.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            ) : (
              <p>{question.correctAnswer}</p>
            )}
          </div>

          <div className="buttons">
            <button className="study-again-button" onClick={onStudyAgain}>
              Study Again
            </button>
            <button className="got-it-button" onClick={onMarkLearned}>
              Got It!
            </button>
          </div>
        </div>
      </div>

      {isAiChatOpen && (
        <AiChatModal
          isOpen={isAiChatOpen}
          onClose={() => setIsAiChatOpen(false)}
          currentQuestion={question}
          userAnswer={
            question.type === "freeResponse"
              ? userAnswer
              : isMultiSelect
                ? selectedOptions.join(", ")
                : selectedOption
          }
          isInFeedbackMode={true}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default ResultView;
