// // ScoreContext.tsx
// import { createContext, useContext, useState } from 'react';

// type ScoreContextType = {
//   totalScore: number;
//   updateScore: (delta: number) => void;
//   resetScore: () => void;
// };

// const ScoreContext = createContext<ScoreContextType>({
//   totalScore: 0,
//   updateScore: () => {},
//   resetScore: () => {},
// });

// export const ScoreProvider = ({ children }: { children: React.ReactNode }) => {
//   const [totalScore, setTotalScore] = useState(0);

//   const updateScore = (delta: number) => {
//     setTotalScore(prev => Math.max(0, prev + delta)); // Ensure score doesn't go negative
//   };

//   const resetScore = () => {
//     setTotalScore(0);
//   };

//   return (
//     <ScoreContext.Provider value={{ totalScore, updateScore, resetScore }}>
//       {children}
//     </ScoreContext.Provider>
//   );
// };

// export const useScore = () => useContext(ScoreContext);



// ScoreContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

type ScoreContextType = {
  totalScore: number;
  updateScore: (delta: number) => void;
  resetScore: () => void;
  levelTwoScore: number;
  setLevelTwoScore: (score: number) => void;
  questionnaireScore: number;
  setQuestionnaireScore: (score: number) => void;
  updateQuestionnaireScore: (delta: number) => void;
};

const ScoreContext = createContext<ScoreContextType>({
  totalScore: 0,
  updateScore: () => {},
  resetScore: () => {},
  levelTwoScore: 0,
  setLevelTwoScore: () => {},
  questionnaireScore: 0,
  setQuestionnaireScore: () => {},
  updateQuestionnaireScore: () => {},
});

export const ScoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [totalScore, setTotalScore] = useState(0);
  const [levelTwoScore, setLevelTwoScore] = useState(0);
  const [questionnaireScore, setQuestionnaireScore] = useState(0);

  // Initialize questionnaireScore with levelTwoScore when it changes
  useEffect(() => {
    setQuestionnaireScore(levelTwoScore);
  }, [levelTwoScore]);

  const updateScore = (delta: number) => {
    setTotalScore(prev => Math.max(0, prev + delta)); // Ensure score doesn't go negative
  };

  const resetScore = () => {
    setTotalScore(0);
  };

  const updateQuestionnaireScore = (delta: number) => {
    setQuestionnaireScore((prevScore) => prevScore + delta);
  };

  return (
    <ScoreContext.Provider
      value={{ 
        totalScore,
        updateScore,
        resetScore,
        levelTwoScore, 
        setLevelTwoScore, 
        questionnaireScore, 
        setQuestionnaireScore, 
        updateQuestionnaireScore 
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
};

export const useScore = () => useContext(ScoreContext);
