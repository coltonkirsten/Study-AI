import React, { useState, useEffect } from "react";
import TopMenuBar from "./TopMenuBar";
import AiChatModal from "./AiChatModal";
import "../styles/study.css";
import { v4 as uuidv4 } from "uuid";

const ResultView = ({
  currentQuestion,
  userAnswer,
  selectedOption,
  selectedOptions,
  isCorrect,
  studyAgain,
  markAsLearned,
  goBack,
  activeStudySet,
}) => {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Generate a unique session ID for the current result view session
  const [sessionId, setSessionId] = useState(() => {
    return uuidv4();
  });

  // Reset the session ID whenever the question changes
  useEffect(() => {
    if (currentQuestion) {
      setSessionId(uuidv4());
    }
  }, [currentQuestion]);

  const studySetName = activeStudySet ? activeStudySet.name : "";

  const handleAskAI = () => {
    setIsAiChatOpen(true);
  };

  // Check if the question allowed multiple answers
  const isMultiSelect = Array.isArray(currentQuestion.correctAnswer);

  return (
    <div className={`study-view ${isAiChatOpen ? "ai-chat-open" : ""}`}>
      <TopMenuBar
        title={studySetName}
        goBack={goBack}
        onAskAI={handleAskAI}
        isResultView={true}
      />

      <div className="question-card-container">
        <div className="question-card-main">
          {currentQuestion.type === "multipleChoice" ? (
            <p className="question">
              {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
            </p>
          ) : (
            <p className="question">Answer Review</p>
          )}

          <div className="answer-section">
            <h3>Question:</h3>
            <p>{currentQuestion.question}</p>

            <h3>Your Answer:</h3>
            {currentQuestion.type === "freeResponse" ? (
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
            {currentQuestion.type === "freeResponse" ? (
              <p>{currentQuestion.answer}</p>
            ) : isMultiSelect ? (
              <ul className="answer-list correct">
                {currentQuestion.correctAnswer.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            ) : (
              <p>{currentQuestion.correctAnswer}</p>
            )}
          </div>

          <div className="buttons">
            <button className="study-again-button" onClick={studyAgain}>
              Study Again
            </button>
            <button className="got-it-button" onClick={markAsLearned}>
              Got It!
            </button>
          </div>
        </div>
      </div>

      {isAiChatOpen && (
        <AiChatModal
          isOpen={isAiChatOpen}
          onClose={() => setIsAiChatOpen(false)}
          currentQuestion={currentQuestion}
          userAnswer={
            currentQuestion.type === "freeResponse"
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
