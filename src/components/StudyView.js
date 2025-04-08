import React, { useState, useEffect } from "react";
import TopMenuBar from "./TopMenuBar";
import AiChatModal from "./AiChatModal";
import "../styles/study.css";
import { v4 as uuidv4 } from "uuid";

const StudyView = ({
  currentQuestion,
  userAnswer,
  setUserAnswer,
  selectedOption,
  setSelectedOption,
  selectedOptions,
  setSelectedOptions,
  checkAnswer,
  goBack,
  activeStudySet,
}) => {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Generate a unique session ID for the current question study session
  const [sessionId, setSessionId] = useState(() => {
    return uuidv4();
  });

  // Reset the session ID whenever the question changes
  useEffect(() => {
    if (currentQuestion) {
      setSessionId(uuidv4());
    }
  }, [currentQuestion]);

  if (!currentQuestion) return <div>Loading...</div>;

  const studySetName = activeStudySet ? activeStudySet.name : "";

  const handleAskAI = () => {
    setIsAiChatOpen(true);
  };

  // Check if the question allows multiple answers
  const isMultiSelect = Array.isArray(currentQuestion.correctAnswer);

  // Handle option click for multi-select questions
  const handleMultiSelectOptionClick = (option) => {
    if (selectedOptions.includes(option)) {
      // If already selected, remove it
      setSelectedOptions(selectedOptions.filter((item) => item !== option));
    } else {
      // If not selected, add it
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  return (
    <div className={`study-view ${isAiChatOpen ? "ai-chat-open" : ""}`}>
      <TopMenuBar title={studySetName} goBack={goBack} onAskAI={handleAskAI} />

      <div className="question-card-container">
        <div className="question-card-main">
          <p className="question">{currentQuestion.question}</p>

          {isMultiSelect && (
            <p className="instruction">Select all that apply</p>
          )}

          {currentQuestion.type === "freeResponse" ? (
            <div className="free-response">
              <textarea
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
            </div>
          ) : (
            <div className="multiple-choice">
              {currentQuestion.options.map((option, index) => (
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
                      : setSelectedOption(option)
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
            onClick={checkAnswer}
            disabled={
              currentQuestion.type === "freeResponse"
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
          currentQuestion={currentQuestion}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default StudyView;
