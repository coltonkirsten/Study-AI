import React, { useState } from "react";
import CreateStudySetModal from "./CreateStudySetModal";
import "../styles/StudyLibrary.css";

const StudyLibrary = ({
  studySets,
  onStartStudy,
  onBrowseStudySet,
  onResetProgress,
  onDeleteStudySet,
  onAddStudySet,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateStudySet = (studySet) => {
    // Add an ID and timestamp to the study set
    const newStudySet = {
      ...studySet,
      id: `set_${Date.now()}`,
      dateCreated: new Date().toISOString(),
      questions: studySet.questions.map((q) => ({
        ...q,
        id:
          q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        learned: false,
      })),
    };

    onAddStudySet(newStudySet);
  };

  return (
    <div className="library-view">
      <div className="spacer" style={{ height: "90px" }}></div>
      <div className="library-actions">
        <button className="create-button" onClick={() => setIsModalOpen(true)}>
          Create Study Set
        </button>
      </div>
      <div className="spacer" style={{ height: "10px" }}></div>
      {studySets.length === 0 ? (
        <div className="no-sets">
          <p>You don't have any study sets yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="study-sets-list">
          {studySets.map((studySet) => {
            const totalQuestions = studySet.questions.length;
            const learnedQuestions = studySet.questions.filter(
              (q) => q.learned
            ).length;
            const progressPercentage =
              totalQuestions > 0
                ? Math.round((learnedQuestions / totalQuestions) * 100)
                : 0;

            return (
              <div className="study-set-card" key={studySet.id}>
                <div className="study-set-info">
                  <h3>{studySet.name}</h3>
                  <p className="description">{studySet.description}</p>
                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                    <span className="progress-text">
                      {learnedQuestions} / {totalQuestions} learned (
                      {progressPercentage}%)
                    </span>
                  </div>
                </div>
                <div className="study-set-actions">
                  <button onClick={() => onStartStudy(studySet.id)}>
                    Study
                  </button>
                  <button onClick={() => onBrowseStudySet(studySet.id)}>
                    Browse
                  </button>
                  <button onClick={() => onResetProgress(studySet.id)}>
                    Reset
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => onDeleteStudySet(studySet.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateStudySetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateStudySet={handleCreateStudySet}
      />
    </div>
  );
};

export default StudyLibrary;
