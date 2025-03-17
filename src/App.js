import React, { useState, useEffect, useRef } from "react";
import "./styles/App.css";
import StudyLibrary from "./components/StudyLibrary";
import StudyView from "./components/StudyView";
import ResultView from "./components/ResultView";
import BrowseView from "./components/BrowseView";

function App() {
  // Main data structure for study sets
  const [studySets, setStudySets] = useState([]);
  const [activeStudySetId, setActiveStudySetId] = useState(null);
  const [currentView, setCurrentView] = useState("library"); // 'library', 'study', 'result', 'browse'
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]); // New state for multiple selections
  const [isCorrect, setIsCorrect] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState([]);
  const [browseQuestions, setBrowseQuestions] = useState([]);

  // Load study sets from localStorage on initial load
  useEffect(() => {
    const loadStudySets = () => {
      try {
        const savedStudySets = localStorage.getItem("studySets");
        if (savedStudySets) {
          setStudySets(JSON.parse(savedStudySets));
        } else {
          // If no saved study sets, load the default one as a sample
          fetchDefaultStudySet();
        }
      } catch (error) {
        console.error("Error loading study sets:", error);
        fetchDefaultStudySet();
      }
    };

    const fetchDefaultStudySet = async () => {
      try {
        const response = await fetch("/studyset.json");
        const data = await response.json();

        // Create a new study set structure
        const newStudySet = {
          id: "default",
          name: "Sample Study Set",
          description: "A sample study set with various questions",
          dateCreated: new Date().toISOString(),
          questions: data.questions.map((q) => ({
            ...q,
            learned: false,
          })),
        };

        setStudySets([newStudySet]);
        // Save to localStorage
        localStorage.setItem("studySets", JSON.stringify([newStudySet]));
      } catch (error) {
        console.error("Error fetching default study set:", error);
      }
    };

    loadStudySets();
  }, []);

  // Save study sets to localStorage whenever they change
  useEffect(() => {
    if (studySets.length > 0) {
      localStorage.setItem("studySets", JSON.stringify(studySets));
    }
  }, [studySets]);

  // Function to start studying a specific study set
  const startStudy = (studySetId) => {
    const studySet = studySets.find((set) => set.id === studySetId);
    if (!studySet) return;

    setActiveStudySetId(studySetId);

    // Filter for questions that are not yet learned
    const questionsToStudy = studySet.questions.filter((q) => !q.learned);

    if (questionsToStudy.length > 0) {
      // Select a random question from the remaining questions
      const randomIndex = Math.floor(Math.random() * questionsToStudy.length);
      setCurrentQuestion(questionsToStudy[randomIndex]);
      setUserAnswer("");
      setSelectedOption("");
      setSelectedOptions([]); // Reset selected options array
      setRemainingQuestions(questionsToStudy);
      setCurrentView("study");
    } else {
      // All questions are learned
      alert(
        "Congratulations! You have learned all the questions in this study set."
      );
    }
  };

  // Function to check the answer
  const checkAnswer = () => {
    if (currentQuestion.type === "freeResponse") {
      // For free response, we check but don't judge
      setIsCorrect(
        userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase()
      );
    } else if (currentQuestion.type === "multipleChoice") {
      // Check if it's a multi-selection question (array of correct answers)
      if (Array.isArray(currentQuestion.correctAnswer)) {
        // Check if selectedOptions contains all correct answers and nothing extra
        const correctAnswersSet = new Set(currentQuestion.correctAnswer);
        const selectedOptionsSet = new Set(selectedOptions);

        // Check if both sets have the same size and all items from selectedOptions are in correctAnswers
        const isCorrectSize =
          correctAnswersSet.size === selectedOptionsSet.size;
        const allOptionsCorrect = selectedOptions.every((option) =>
          correctAnswersSet.has(option)
        );

        setIsCorrect(isCorrectSize && allOptionsCorrect);
      } else {
        // For single-answer multiple choice, check if the selected option matches the correct answer
        setIsCorrect(selectedOption === currentQuestion.correctAnswer);
      }
    }
    setCurrentView("result");
  };

  // Function to mark question as learned
  const markAsLearned = () => {
    const updatedStudySets = studySets.map((studySet) => {
      if (studySet.id === activeStudySetId) {
        return {
          ...studySet,
          questions: studySet.questions.map((q) => {
            if (q.id === currentQuestion.id) {
              return { ...q, learned: true };
            }
            return q;
          }),
        };
      }
      return studySet;
    });

    setStudySets(updatedStudySets);

    // Update remaining questions
    const updatedStudySet = updatedStudySets.find(
      (set) => set.id === activeStudySetId
    );
    const updatedRemainingQuestions = updatedStudySet.questions.filter(
      (q) => !q.learned
    );
    setRemainingQuestions(updatedRemainingQuestions);

    // Continue studying or return to library
    if (updatedRemainingQuestions.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * updatedRemainingQuestions.length
      );
      setCurrentQuestion(updatedRemainingQuestions[randomIndex]);
      setUserAnswer("");
      setSelectedOption("");
      setSelectedOptions([]); // Reset selected options array
      setCurrentView("study");
    } else {
      // All questions are learned
      alert(
        "Congratulations! You have learned all the questions in this study set."
      );
      setCurrentView("library");
    }
  };

  // Function to study the question again
  const studyAgain = () => {
    // Continue with current study set
    const studySet = studySets.find((set) => set.id === activeStudySetId);
    if (!studySet) {
      setCurrentView("library");
      return;
    }

    // Get a new random question from remaining questions
    if (remainingQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
      setCurrentQuestion(remainingQuestions[randomIndex]);
      setUserAnswer("");
      setSelectedOption("");
      setSelectedOptions([]); // Reset selected options
      setCurrentView("study");
    } else {
      // All questions learned - reset the learned status for this question to continue studying
      const updatedStudySets = studySets.map((studySet) => {
        if (studySet.id === activeStudySetId) {
          return {
            ...studySet,
            questions: studySet.questions.map((q) => {
              if (q.id === currentQuestion.id) {
                return { ...q, learned: false };
              }
              return q;
            }),
          };
        }
        return studySet;
      });

      setStudySets(updatedStudySets);
      setCurrentView("study");
    }
  };

  // Function to browse a study set's questions
  const browseStudySet = (studySetId) => {
    const studySet = studySets.find((set) => set.id === studySetId);
    if (!studySet) return;

    setActiveStudySetId(studySetId);
    setBrowseQuestions(studySet.questions);
    setCurrentView("browse");
  };

  // Add a new study set (from AI generation or file upload)
  const addStudySet = (newStudySet) => {
    setStudySets((prevStudySets) => [...prevStudySets, newStudySet]);
    alert(`Study set "${newStudySet.name}" has been successfully added!`);
  };

  // Function to reset a study set's progress
  const resetStudySetProgress = (studySetId) => {
    const updatedStudySets = studySets.map((studySet) => {
      if (studySet.id === studySetId) {
        return {
          ...studySet,
          questions: studySet.questions.map((q) => ({
            ...q,
            learned: false,
          })),
        };
      }
      return studySet;
    });

    setStudySets(updatedStudySets);
    alert("Study set progress has been reset.");
  };

  // Function to delete a study set
  const deleteStudySet = (studySetId) => {
    if (window.confirm("Are you sure you want to delete this study set?")) {
      const updatedStudySets = studySets.filter((set) => set.id !== studySetId);
      setStudySets(updatedStudySets);
    }
  };

  // Function to update a question's learned status in the browse view
  const updateQuestionStatus = (questionId, isLearned) => {
    const updatedStudySets = studySets.map((studySet) => {
      if (studySet.id === activeStudySetId) {
        return {
          ...studySet,
          questions: studySet.questions.map((q) => {
            if (q.id === questionId) {
              return { ...q, learned: isLearned };
            }
            return q;
          }),
        };
      }
      return studySet;
    });

    setStudySets(updatedStudySets);

    // Update browse questions to reflect the change
    setBrowseQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === questionId ? { ...q, learned: isLearned } : q
      )
    );
  };

  // Handle navigation back based on current view
  const handleGoBack = () => {
    if (
      currentView === "study" ||
      currentView === "browse" ||
      currentView === "result"
    ) {
      setCurrentView("library");
    }
  };

  // Get the active study set
  const activeStudySet = studySets.find((set) => set.id === activeStudySetId);

  // Render the appropriate view based on the current state
  return (
    <div className="App">
      {currentView === "library" && (
        <StudyLibrary
          studySets={studySets}
          startStudy={startStudy}
          browseStudySet={browseStudySet}
          resetStudySetProgress={resetStudySetProgress}
          deleteStudySet={deleteStudySet}
          addStudySet={addStudySet}
        />
      )}

      {currentView === "study" && (
        <StudyView
          currentQuestion={currentQuestion}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          checkAnswer={checkAnswer}
          goBack={handleGoBack}
          activeStudySet={activeStudySet}
        />
      )}

      {currentView === "result" && (
        <ResultView
          currentQuestion={currentQuestion}
          userAnswer={userAnswer}
          selectedOption={selectedOption}
          selectedOptions={selectedOptions}
          isCorrect={isCorrect}
          studyAgain={studyAgain}
          markAsLearned={markAsLearned}
          goBack={handleGoBack}
          activeStudySet={activeStudySet}
        />
      )}

      {currentView === "browse" && (
        <BrowseView
          activeStudySet={activeStudySet}
          browseQuestions={browseQuestions}
          setBrowseQuestions={setBrowseQuestions}
          updateQuestionStatus={updateQuestionStatus}
          goBack={handleGoBack}
        />
      )}
    </div>
  );
}

export default App;
