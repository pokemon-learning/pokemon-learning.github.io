let peer;
let connections = [];
let scores = {};
let currentQ = 0;
let timer;
let QUESTIONS = [];
let POKEMON_DATA = []; // This will hold our fetched Pokémon data
let gameSettings = { gen: "All", difficulty: "medium" };
let correctAnswer;
// A master list of all possible Pokémon types for distractors
const ALL_TYPES = ["Acier", "Dragon", "Eau", "Électrik", "Feu", "Fée", "Glace", "Insecte", "Normal", "Plante", "Poison", "Psy", "Sol", "Spectre", "Ténèbres"];

fetch('pokemon.json')
  .then(res => res.json())
  .then(data => {
    POKEMON_DATA = data;
    console.log(POKEMON_DATA);
  });

function normalizeText(str) {
  return str
    .normalize("NFD")                 // separate accents from letters
    .replace(/[\u0300-\u036f]/g, "")  // remove diacritics
    .replace(/[^\p{L}\p{N}]/gu, "")   // remove special characters (keep letters/numbers)
    .toLowerCase()
    .trim();
}


function createGame() {
    gameSettings.gen = document.getElementById("gen-select").value;
    gameSettings.difficulty = document.getElementById("difficulty-select").value;
    peer = new Peer();

    peer.on("open", id => {
        alert("Partagez ce code de connexion avec vos amis :\n" + id);

        document.getElementById("menu").style.display = "none";
        document.getElementById("game").style.display = "block";
        document.getElementById("start-btn").style.display = "inline-block";

    });

    peer.on("connection", conn => {

    conn.on("open", () => {
        console.log("Connection fully open");
        connections.push(conn);

        conn.on("data", data => {
        if (data.type === "join") {
            scores[data.name] = 0;
            updateLeaderboard();
        }

        if (data.type === "answer") {
            const q = QUESTIONS[currentQ];
            console.log("Received answer:", data.answer);
            console.log("Correct answer index:", q);
            if (q.type === "choice") {
                if (data.answer === q.correct) {
                    scores[data.name]++;
                }
            } else if (q.type === "text") {
                if (normalizeText(data.answer) === normalizeText(q.correct)) {
                    scores[data.name]++;
                }
            }
        }
        });
    });

  });
};


function startTournament() {
  console.log("Tournament starting");
  QUESTIONS = [];
  for (let i = 0; i < 10; i++) {
    if (gameSettings.difficulty === "easy") {
      QUESTIONS.push(generateEasyNameQuestion());
    }
    if (gameSettings.difficulty === "medium") {
        if (i < 5) { // First 5 questions are "Name that Pokémon"
            //QUESTIONS.push(generateEasyNameQuestion());
            QUESTIONS.push(generateMediumTypeQuestion());
        } else { // Last 5 questions are "What's the type?"
            //QUESTIONS.push(generateMediumTypeQuestion());
            QUESTIONS.push(generateEasyNameQuestion());
        }
    }
    if (gameSettings.difficulty === "hard") {
        if (i%2 === 0) { // Even questions are "Name that Pokémon"
            QUESTIONS.push(generateHardNameQuestion());
        } else { // Odd questions are "What's the type?"
            QUESTIONS.push(generateHardTypeQuestion());
        }
    }
  }
  console.log(QUESTIONS);

  document.getElementById("game").style.display = "block";

  currentQ = 0;
  showQuestion();
}
function generateEasyNameQuestion() {
    let pool = POKEMON_DATA;
    if (gameSettings.gen !== "All") {
        pool = POKEMON_DATA.filter(p => p.generation === gameSettings.gen);
    }
  // 1. Pick a random Pokémon for the question
  const target = pool[Math.floor(Math.random() * pool.length)];
  
  // 2. Pick 3 OTHER random Pokémon for wrong answers (distractors)
  const distractors = pool
    .filter(p => p.name !== target.name) // Don't pick the same one
    .sort(() => 0.5 - Math.random())    // Shuffle the list
    .slice(0, 3)                         // Take the first 3
    .map(p => p.name);                   // We only need the names

  // 3. Combine correct answer and distractors, then shuffle them
  const answers = [target.name, ...distractors].sort(() => 0.5 - Math.random());
  
  // 4. Find where the correct answer ended up after the shuffle
  const correctIndex = answers.indexOf(target.name);

  return {
    type: "choice",
    q: "Quel est ce Pokémon?",
    img: target.image, // We'll add this to the UI!
    a: answers,
    correct: correctIndex
  };
}

function generateMediumTypeQuestion() {
    let pool = POKEMON_DATA;
    if (gameSettings.gen !== "All") {
        pool = POKEMON_DATA.filter(p => p.generation === gameSettings.gen);
    }

    // 1. Pick the target Pokémon
    const target = pool[Math.floor(Math.random() * pool.length)];
    
    // 2. Pick ONE of its types to be the "Correct Option" shown on a button
    // This handles both single and dual-type Pokémon naturally
    const displayedCorrectType = target.types[Math.floor(Math.random() * target.types.length)];

    // 3. Pick distractors from ALL_TYPES
    // CRITICAL: Filter out BOTH types if the Pokémon has two
    const distractors = ALL_TYPES
        .filter(type => !target.types.includes(type)) 
        .sort(() => 0.5 - Math.random())
        .slice(0, 3); // 3 distractors + 1 correct = 4 options

    // 4. Combine and Shuffle
    const answers = [displayedCorrectType, ...distractors].sort(() => 0.5 - Math.random());
    
    return {
        type: "choice",
        q: `Quel est le type de ${target.name}?`,
        img: target.image,
        a: answers,
        // The index of the specific type we put in the button list
        correct: answers.indexOf(displayedCorrectType) 
    };
}


function generateHardTypeQuestion() {
    let pool = POKEMON_DATA;
    if (gameSettings.gen !== "All") {
        pool = POKEMON_DATA.filter(p => p.generation === gameSettings.gen);
    }

    // 1. Pick the target Pokémon
    const target = pool[Math.floor(Math.random() * pool.length)];
    
    // 2. Pick ONE of its types to be the "Correct Option" shown on a button
    // This handles both single and dual-type Pokémon naturally
    const displayedCorrectType = target.types[Math.floor(Math.random() * target.types.length)];

    // 3. Pick distractors from ALL_TYPES
    // CRITICAL: Filter out BOTH types if the Pokémon has two
    const distractors = ALL_TYPES
        .filter(type => !target.types.includes(type)) 
        .sort(() => 0.5 - Math.random())
        .slice(0, 3); // 3 distractors + 1 correct = 4 options

    // 4. Combine and Shuffle
    const answers = [displayedCorrectType, ...distractors].sort(() => 0.5 - Math.random());
    
    return {
        type: "choice",
        q: `Quel est le type de ${target.name}?`,
        img: null,
        a: answers,
        // The index of the specific type we put in the button list
        correct: answers.indexOf(displayedCorrectType) 
    };
}

function generateHardNameQuestion() {
    let pool = POKEMON_DATA;
    if (gameSettings.gen !== "All") {
        pool = POKEMON_DATA.filter(p => p.generation === gameSettings.gen);
    }

    // 1. Pick a random Pokémon for the question
    const target = pool[Math.floor(Math.random() * pool.length)];

    // 2. Return the text-based question object
    return {
        type: "text",          // Tells renderQuestion to show an <input>
        q: "Quel est ce Pokémon ?",
        img: target.image,     
        correct: target.name   // This is now a string (e.g., "Pikachu")
    };
}

function showQuestion() {
  const q = QUESTIONS[currentQ];

  document.getElementById("question").innerText = q.q;
  document.getElementById("timer").innerText = "⏳ 10";

  connections.forEach(c => c.send({ type: "question", q }));

  let timeLeft = 10;

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = "⏳ " + timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer); // Stop this countdown
      handleEndOfRound(q);  // Move to the transition phase
    }
  }, 1000);
}

function handleEndOfRound(currentQuestion) {
  // 1. Show the correct answer on the host screen
  if (currentQuestion.type === "choice") {
    correctAnswer = currentQuestion.a[currentQuestion.correct];
    document.getElementById("question").innerHTML = `
      <span style="color: green;">Réponse correcte: ${correctAnswer}</span>
    `;
  } else if (currentQuestion.type === "text") {
    correctAnswer = currentQuestion.correct;
    document.getElementById("question").innerHTML = `
      <span style="color: green;">Réponse correcte: ${correctAnswer}</span>
    `;
  }
  
  // 2. Tell the clients the round is over (optional: send them the correct index)
  connections.forEach(c => c.send({ 
    type: "reveal", 
    correct: correctAnswer
  }));

  // 3. The "Breather" delay (3 seconds) before the next question
  document.getElementById("timer").innerText = "Prochaine question dans 3...";
  
  setTimeout(() => {
    nextQuestion(); // This now happens after a 3-second pause
  }, 3000);
}

function nextQuestion() {
  clearInterval(timer);
  currentQ++;

  if (currentQ < QUESTIONS.length) {
    showQuestion();
  } else {
    endGame();
  }

  updateLeaderboard();
}

function updateLeaderboard() {
  const board = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([name, score]) => `${name}: ${score}`)
    .join("<br>");

  document.getElementById("leaderboard").innerHTML = board;

  connections.forEach(c => c.send({ type: "leaderboard", scores }));
}

function endGame() {
  document.getElementById("question").innerText = "🏆 Game Over!";
}
