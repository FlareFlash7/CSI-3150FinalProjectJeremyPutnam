const app = document.getElementById("app");

let questions = [];
let index = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 15;

// ---------------------------
// Render Start Screen
// ---------------------------
function renderStartScreen() {
  app.innerHTML = `
    <div class="screen">
      <h1>Grand Master Trivia Engine</h1>

      <label>Category</label>
      <select id="category">
        <option value="9">General Knowledge</option>
        <option value="17">Science</option>
        <option value="23">History</option>
        <option value="11">Film</option>
      </select>

      <label>Difficulty</label>
      <select id="difficulty">
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <button id="startBtn">Start Game</button>

      <h2>Top Scores</h2>
      <ul class="leaderboard" id="leaderboard"></ul>
    </div>
  `;

  loadScores();
  document.getElementById("startBtn").onclick = startGame;
}

// ---------------------------
// Load Scores
// ---------------------------
function loadScores() {
  const saved = JSON.parse(localStorage.getItem("scores")) || [];
  const list = document.getElementById("leaderboard");
  list.innerHTML = saved.map(s => `<li>${s}</li>`).join("");
}

// ---------------------------
// Start Game
// ---------------------------
async function startGame() {
  const category = document.getElementById("category").value;
  const difficulty = document.getElementById("difficulty").value;

  const url = `https://opentdb.com/api.php?amount=50&category=${category}&difficulty=${difficulty}&type=multiple`;

  app.innerHTML = `<h2>Loading questions...</h2>`;

  const res = await fetch(url);
  const data = await res.json();

  questions = data.results;
  index = 0;
  score = 0;

  renderQuestion();
}

// ---------------------------
// Render Question
// ---------------------------
function renderQuestion() {
  const q = questions[index];
  const answers = shuffle([
    q.correct_answer,
    ...q.incorrect_answers
  ]);

  app.innerHTML = `
    <div class="screen">
      <h2>${q.question}</h2>
      <div class="timer" id="timer">⏳ 15s</div>

      <div class="answers">
        ${answers
          .map(a => `<button class="answerBtn">${a}</button>`)
          .join("")}
      </div>
    </div>
  `;

  document.querySelectorAll(".answerBtn").forEach(btn => {
    btn.onclick = () => handleAnswer(btn, q.correct_answer);
  });

  startTimer();
}

// ---------------------------
// Timer
// ---------------------------
function startTimer() {
  timeLeft = 15;
  document.getElementById("timer").textContent = `⏳ ${timeLeft}s`;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = `⏳ ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      nextQuestion();
    }
  }, 1000);
}

// ---------------------------
// Handle Answer
// ---------------------------
function handleAnswer(btn, correct) {
  clearInterval(timerInterval);

  if (btn.textContent === correct) {
    btn.classList.add("correct");
    score++;
  } else {
    btn.classList.add("wrong");
  }

  setTimeout(nextQuestion, 600);
}

// ---------------------------
// Next Question
// ---------------------------
function nextQuestion() {
  index++;
  if (index < questions.length) {
    renderQuestion();
  } else {
    renderResults();
  }
}

// ---------------------------
// Results Screen
// ---------------------------
function renderResults() {
  saveScore(score);

  app.innerHTML = `
    <div class="screen">
      <h1>Your Score: ${score}</h1>
      <button id="restartBtn">Play Again</button>
    </div>
  `;

  document.getElementById("restartBtn").onclick = renderStartScreen;
}

// ---------------------------
// Save Score
// ---------------------------
function saveScore(score) {
  const saved = JSON.parse(localStorage.getItem("scores")) || [];
  const updated = [...saved, score].sort((a, b) => b - a).slice(0, 5);
  localStorage.setItem("scores", JSON.stringify(updated));
}

// ---------------------------
// Shuffle Utility
// ---------------------------
function shuffle(arr) {
  return arr
    .map(a => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map(a => a.value);
}

// ---------------------------
// Start App
// ---------------------------
renderStartScreen();
