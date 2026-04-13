import { useState, useEffect } from "react";

// ======================================================
// SHUFFLE UTILITY
// ======================================================
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ======================================================
// TIMER HOOK
// ======================================================
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

// ======================================================
// LOADER
// ======================================================
function Loader() {
  return <div className="loader">Loading...</div>;
}

// ======================================================
// ERROR MESSAGE
// ======================================================
function ErrorMessage({ message }) {
  return <div className="error">{message}</div>;
}

// ======================================================
// START SCREEN
// ======================================================
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
      // UPDATED URL — always fetch 50 questions + category + difficulty
      const url = `https://opentdb.com/api.php?amount=50&category=${category}&difficulty=${difficulty}&type=multiple`;

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
    <div className="screen">
      <h1>Grand Master Trivia Engine</h1>

      <label>Category</label>
      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="9">General Knowledge</option>
        <option value="17">Science</option>
        <option value="23">History</option>
        <option value="11">Film</option>
      </select>

      <label>Difficulty</label>
      <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <button onClick={startGame}>Start Game</button>

      {loading && <Loader />}
      {error && <ErrorMessage message={error} />}

      <h2>Top Scores</h2>
      <ul className="leaderboard">
        {scores.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

// ======================================================
// QUIZ SCREEN
// ======================================================
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
    } else {
      setFeedbackClass("shake");
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
    <div className={`screen ${feedbackClass}`}>
      <h2 dangerouslySetInnerHTML={{ __html: q.question }} />

      <div className="timer">⏳ {timeLeft}s</div>

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

// ======================================================
// RESULTS SCREEN
// ======================================================
function ResultsScreen({ score, setGameState }) {
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("scores")) || [];
    const updated = [...saved, score]
      .sort((a, b) => b - a)
      .slice(0, 5);

    localStorage.setItem("scores", JSON.stringify(updated));
  }, [score]);

  return (
    <div className="screen">
      <h1>Your Score: {score}</h1>
      <button onClick={() => setGameState("START_SCREEN")}>
        Play Again
      </button>
    </div>
  );
}

// ======================================================
// MAIN APP
// ======================================================
export default function App() {
  const [gameState, setGameState] = useState("START_SCREEN");
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);

  return (
    <div className="app">
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

// ======================================================
// EMBEDDED CSS
// ======================================================
const style = document.createElement("style");
style.innerHTML = `
  body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #111;
    color: white;
  }

  .app {
    padding: 20px;
    max-width: 600px;
    margin: auto;
  }

  .screen {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  select, button {
    padding: 10px;
    font-size: 1rem;
    border-radius: 6px;
    border: none;
  }

  button {
    background: #4caf50;
    color: white;
    cursor: pointer;
  }

  button:hover {
    background: #45a049;
  }

  .answers button {
    width: 100%;
    margin-bottom: 10px;
    background: #333;
  }

  .answers button:hover {
    background: #444;
  }

  .timer {
    font-size: 1.4rem;
    font-weight: bold;
    text-align: center;
  }

  .leaderboard {
    list-style: none;
    padding: 0;
  }

  .leaderboard li {
    background: #222;
    padding: 8px;
    margin-bottom: 5px;
    border-radius: 4px;
  }

  .loader {
    text-align: center;
    font-size: 1.2rem;
  }

  .error {
    color: #ff4444;
    font-weight: bold;
  }

  /* Animations */
  .correct-flash {
    animation: flashGreen 0.4s;
  }

  @keyframes flashGreen {
    0% { background-color: #0f0; }
    100% { background-color: transparent; }
  }

  .shake {
    animation: shakeAnim 0.4s;
  }

  @keyframes shakeAnim {
    0% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    50% { transform: translateX(6px); }
    75% { transform: translateX(-6px); }
    100% { transform: translateX(0); }
  }
`;
document.head.appendChild(style);
