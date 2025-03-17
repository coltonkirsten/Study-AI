import React from "react";
import Header from "./Header";
import "../styles/BrowseView.css";

const BrowseView = ({
  activeStudySet,
  browseQuestions,
  setBrowseQuestions,
  updateQuestionStatus,
  goBack,
}) => {
  if (!activeStudySet) return <div>Study set not found</div>;

  return (
    <div className="browse-view">
      <Header
        currentView="browse"
        goBack={goBack}
        title={activeStudySet.name}
      />

      <div className="browse-stats">
        <p>Total Questions: {activeStudySet.questions.length}</p>
        <p>
          Learned: {activeStudySet.questions.filter((q) => q.learned).length}
        </p>
        <p>
          Remaining: {activeStudySet.questions.filter((q) => !q.learned).length}
        </p>
      </div>

      <div className="question-filters">
        <button
          className="filter-button all-button"
          onClick={() => setBrowseQuestions(activeStudySet.questions)}
        >
          All
        </button>
        <button
          className="filter-button learned-button"
          onClick={() =>
            setBrowseQuestions(
              activeStudySet.questions.filter((q) => q.learned)
            )
          }
        >
          Learned
        </button>
        <button
          className="filter-button remaining-button"
          onClick={() =>
            setBrowseQuestions(
              activeStudySet.questions.filter((q) => !q.learned)
            )
          }
        >
          Remaining
        </button>
      </div>

      <div className="questions-list">
        {browseQuestions.map((question) => (
          <div
            className={`question-card ${
              question.learned ? "learned" : "not-learned"
            }`}
            key={question.id}
          >
            <div className="question-content">
              <h4>
                {question.learned ? "✓ " : ""}
                {question.question}
              </h4>
              <div className="question-details">
                <p>
                  <strong>Type:</strong>{" "}
                  {question.type === "freeResponse"
                    ? "Free Response"
                    : "Multiple Choice"}
                </p>

                {question.type === "freeResponse" ? (
                  <p>
                    <strong>Answer:</strong> {question.answer}
                  </p>
                ) : (
                  <>
                    <p>
                      <strong>Options:</strong>
                    </p>
                    <ul>
                      {question.options.map((option, index) => (
                        <li
                          key={index}
                          className={
                            Array.isArray(question.correctAnswer)
                              ? question.correctAnswer.includes(option)
                                ? "correct-option"
                                : ""
                              : option === question.correctAnswer
                              ? "correct-option"
                              : ""
                          }
                        >
                          {option}{" "}
                          {Array.isArray(question.correctAnswer)
                            ? question.correctAnswer.includes(option)
                              ? " (correct)"
                              : ""
                            : option === question.correctAnswer
                            ? " (correct)"
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            <div className="question-status">
              {question.learned ? (
                <button
                  onClick={() => updateQuestionStatus(question.id, false)}
                >
                  Mark as Not Learned
                </button>
              ) : (
                <button onClick={() => updateQuestionStatus(question.id, true)}>
                  Mark as Learned
                </button>
              )}
            </div>
          </div>
        ))}
        {browseQuestions.length === 0 && (
          <div className="no-questions">
            <p>No questions match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseView;
