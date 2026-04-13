import { useState, useEffect } from "react";

// ---------------------- UTIL: SHUFFLE ----------------------
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------- HOOK: TIMER ----------------------
function useTimer(seconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onExpire]);

  return timeLeft;
}

// ---------------------- COMPONENT: LOADER ----------------------
function Loader() {
  return <div className="loader">Loading...</div>;
}

// ---------------------- COMPONENT: ERROR MESSAGE ----------------------
function ErrorMessage({ message }) {
  return <div className="error">{message}</div>;
}

// ---------------------- COMPONENT: START SCREEN ----------------------
function StartScreen({ setGameState, setQuestions }) {
  const [category, setCategory] = useState("9");
  const [difficulty, setDifficulty] = useState("easy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("scores")) || [];
    setScores(saved);
  }, []);

  async function startGame() {
    setLoading(true);
    setError("");

    try {
      const url = `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.results.length) throw new Error("No questions found.");

      setQuestions(data.results);
      setGameState("QUIZ_ACTIVE");
    } catch (err) {
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="start-screen">
      <h1>Grand Master Trivia Engine</h1>

      <label>Category:</label>
      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="9">General Knowledge</option>
        <option value="17">Science</option>
        <option value="23">History</option>
        <option value="11">Film</option>
      </select>

      <label>Difficulty:</label>
      <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <button onClick={startGame}>Start Game</button>

      {loading && <Loader />}
      {error && <ErrorMessage message={error} />}

      <h2>Top Scores</h2>
      <ul>
        {scores.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------- COMPONENT: QUIZ ----------------------
function Quiz({ questions, score, setScore, setGameState }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedbackClass, setFeedbackClass] = useState("");

  const q = questions[index];

  useEffect(() => {
    const mixed = shuffle([
      q.correct_answer,
      ...q.incorrect_answers
    ]);
    setAnswers(mixed);
  }, [index]);

  const timeLeft = useTimer(15, () => handleAnswer(null));

  function handleAnswer(selected) {
    const correct = selected === q.correct_answer;

    if (correct) {
      setScore(prev => prev + 1);
      setFeedbackClass("correct-flash");
      // new Audio("/sounds/correct.mp3").play();
    } else {
      setFeedbackClass("shake");
      // new Audio("/sounds/wrong.mp3").play();
    }

    setTimeout(() => {
      setFeedbackClass("");
      if (index + 1 < questions.length) {
        setIndex(i => i + 1);
      } else {
        setGameState("RESULTS_SCREEN");
      }
    }, 600);
  }

  return (
    <div className={`quiz ${feedbackClass}`}>
      <h2 dangerouslySetInnerHTML={{ __html: q.question }} />

      <div className="timer">Time Left: {timeLeft}</div>

      <div className="answers">
        {answers.map((a, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(a)}
            dangerouslySetInnerHTML={{ __html: a }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------- COMPONENT: RESULTS SCREEN ----------------------
function ResultsScreen({ score, setGameState }) {
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("scores")) || [];
    const updated = [...saved, score]
      .sort((a, b) => b - a)
      .slice(0, 5);

    localStorage.setItem("scores", JSON.stringify(updated));
  }, [score]);

  return (
    <div className="results-screen">
      <h1>Your Score: {score}</h1>
      <button onClick={() => setGameState("START_SCREEN")}>
        Play Again
      </button>
    </div>
  );
}

// ---------------------- MAIN APP ----------------------
export default function App() {
  const [gameState, setGameState] = useState("START_SCREEN");
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);

  return (
    <div className="app-container">
      {gameState === "START_SCREEN" && (
        <StartScreen
          setGameState={setGameState}
          setQuestions={setQuestions}
        />
      )}

      {gameState === "QUIZ_ACTIVE" && (
        <Quiz
          questions={questions}
          score={score}
          setScore={setScore}
          setGameState={setGameState}
        />
      )}

      {gameState === "RESULTS_SCREEN" && (
        <ResultsScreen
          score={score}
          setGameState={setGameState}
        />
      )}
    </div>
  );
}
