import React from "react";
import "../styles/BrowseView.css";

const BrowseView = ({ questions, onUpdateStatus }) => {
  if (!questions || questions.length === 0) {
    return (
      <div className="browse-view">
        <div className="no-questions">
          <p>No questions to display.</p>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const learnedQuestions = questions.filter((q) => q.learned).length;
  const remainingQuestions = totalQuestions - learnedQuestions;

  return (
    <div className="browse-view">
      <div className="browse-stats">
        <p>Total Questions: {totalQuestions}</p>
        <p>Learned: {learnedQuestions}</p>
        <p>Remaining: {remainingQuestions}</p>
      </div>

      <div className="questions-list">
        {questions.map((question) => (
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
                <button onClick={() => onUpdateStatus(question.id, false)}>
                  Mark as Not Learned
                </button>
              ) : (
                <button onClick={() => onUpdateStatus(question.id, true)}>
                  Mark as Learned
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseView;
