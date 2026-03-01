let allPokemon = [];
let quizPool = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;

// Elements
const genSelect = document.getElementById("quiz-gen-select");
const numQuestionsInput = document.getElementById("num-questions");
const startBtn = document.getElementById("start-quiz");

const quizCard = document.getElementById("quiz-card");
const quizNameEl = document.getElementById("quiz-pokemon-name");
const quizImageEl = document.getElementById("quiz-pokemon-image");
const quizAnswerInput = document.getElementById("quiz-answer");
const submitBtn = document.getElementById("submit-answer");
const feedbackEl = document.getElementById("quiz-feedback");
const progressEl = document.getElementById("quiz-progress");

const quizResult = document.getElementById("quiz-result");
const scoreEl = document.getElementById("quiz-score");
const restartBtn = document.getElementById("restart-quiz");

const scoreTracker = document.createElement("p"); // live score element
quizCard.appendChild(scoreTracker); // add under quiz card

// Load Pokémon data
fetch('pokemon.json')
  .then(res => res.json())
  .then(data => {
    allPokemon = data;
  });

// Start Quiz
startBtn.addEventListener("click", () => {
  const selectedGen = genSelect.value;
  const numQuestions = parseInt(numQuestionsInput.value);

  // Filter pool
  quizPool = selectedGen === "all"
    ? [...allPokemon]
    : allPokemon.filter(p => p.generation === selectedGen);

  if (quizPool.length === 0) {
    alert("Aucun Pokémon trouvé dans cette génération !");
    return;
  }

  // Shuffle and select questions
  quizQuestions = shuffleArray([...quizPool]).slice(0, numQuestions);
  currentIndex = 0;
  score = 0;

  quizCard.style.display = "block";
  quizResult.style.display = "none";
  showNextQuestion();
});
// Existing button click listener
submitBtn.addEventListener("click", submitAnswer);

// Add Enter key listener on input
quizAnswerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    submitAnswer();
  }
});
// Submit Answer
function normalizeText(str) {
  return str
    .normalize("NFD")                 // separate accents from letters
    .replace(/[\u0300-\u036f]/g, "")  // remove diacritics
    .replace(/[^\p{L}\p{N}]/gu, "")   // remove special characters (keep letters/numbers)
    .toLowerCase()
    .trim();
}

function submitAnswer() {
  const answer = normalizeText(quizAnswerInput.value);
  const correct = normalizeText(quizQuestions[currentIndex].name);

  if (answer === correct) {
    feedbackEl.textContent = "Correct! ✅";
    score++;
  } else {
    feedbackEl.textContent = `Incorrect! ❌ La bonne réponse est ${quizQuestions[currentIndex].name}`;
  }
  updateScore(); // live score update

  currentIndex++;
  if (currentIndex < quizQuestions.length) {
    setTimeout(() => {
      quizAnswerInput.value = "";
      feedbackEl.textContent = "";
      showNextQuestion();
    }, 3000);
  } else {
    setTimeout(showResult, 3000);
  }
}

// Show next question
function showNextQuestion() {
  const pokemon = quizQuestions[currentIndex];
  quizNameEl.textContent = "Quel est ce Pokémon ?";
  quizImageEl.src = pokemon.image;
  quizImageEl.style.visibility = "visible";
  quizAnswerInput.value = "";
  progressEl.textContent = `Question ${currentIndex + 1} sur ${quizQuestions.length}`;
}

// Show result
function showResult() {
  quizCard.style.display = "none";
  quizResult.style.display = "block";
  scoreEl.textContent = `Vous avez obtenu ${score} sur ${quizQuestions.length} !`;
}

// Restart Quiz
restartBtn.addEventListener("click", () => {
  quizResult.style.display = "none";
  quizCard.style.display = "none";
});

// Update live score
function updateScore() {
  scoreTracker.textContent = `Score: ${score} / ${currentIndex+1}`;
}
// Utility: shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
