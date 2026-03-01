let allPokemon = [];
let learningPool = [];   // Pokémon still to learn (current gen)
let history = [];        // Stack of previous Pokémon (current gen)
let currentPokemon = null;
let mode = "image";      // "image" or "name"
let visibility = "False"; // For image mode: whether to show name or not
let progress = {};       // Tracks per-gen progress: { gen: { learningPool, history, knownCount } }

const nameEl = document.getElementById("pokemon-name");
const imageEl = document.getElementById("pokemon-image");
const genSelect = document.getElementById("gen-select");
const btn = document.getElementById("direct-names");
// Load saved progress if available
const savedProgress = localStorage.getItem('pokemonProgress');
if (savedProgress) {
  progress = JSON.parse(savedProgress);
}


// Load Pokémon data
fetch('pokemon.json')
  .then(res => res.json())
  .then(data => {
    allPokemon = data;
    resetLearningPool();
    nextPokemon();
  });

// Reset or load the learning pool for selected generation
function resetLearningPool() {
  const selectedGen = genSelect.value;

  // Initialize progress for this generation if it doesn't exist
  if (!progress[selectedGen]) {
    const pool = selectedGen === "all"
      ? [...allPokemon]
      : allPokemon.filter(p => p.generation === selectedGen);

    progress[selectedGen] = {
      learningPool: pool,
      history: [],
      knownCount: 0
    };
  }

  // Load current generation data
  learningPool = progress[selectedGen].learningPool;
  history = progress[selectedGen].history;
  currentPokemon = history.length > 0 ? history[history.length - 1] : null;

  updateProgress();

  // If no current Pokémon, pick next
  if (!currentPokemon) nextPokemon();
  else showCurrentPokemon();
}

// Pick the next Pokémon
function nextPokemon() {
  if (learningPool.length === 0) {
    alert("Vous avez appris tous les Pokémon de cette sélection !");
    currentPokemon = null;
    showCurrentPokemon();
    return;
  }

  // Pick a random Pokémon
  const index = Math.floor(Math.random() * learningPool.length);
  currentPokemon = learningPool[index];

  // Add to history
  history.push(currentPokemon);

  showCurrentPokemon();
  saveProgress();
}


// Show Pokémon based on current mode
function showCurrentPokemon() {
  if (!currentPokemon) return;

  if (mode === "image") {
    imageEl.src = currentPokemon.image;
    imageEl.style.visibility = "visible";
    if (visibility === "True") {
      nameEl.textContent = currentPokemon.name;
    } else {
      nameEl.textContent = "???";
    }
  } else {
    nameEl.textContent = currentPokemon.name;
    imageEl.src = currentPokemon.image;
    imageEl.style.visibility = "hidden";
  }
}
// Reveal the name
document.getElementById("reveal").addEventListener("click", () => {
  if (!currentPokemon) return;
  nameEl.textContent = currentPokemon.name;
  imageEl.style.visibility = "visible";
});

// Mode buttons
btn.addEventListener("click", () => {
  visibility = visibility === "True" ? "False" : "True"; // toggle variable
  btn.classList.toggle("selected"); // toggle highlight
  showCurrentPokemon();
});
document.getElementById("mode-image").addEventListener("click", () => {
  mode = "image";
  showCurrentPokemon();
});
document.getElementById("mode-name").addEventListener("click", () => {
  mode = "name";
  showCurrentPokemon();
});

// Previous button
document.getElementById("previous").addEventListener("click", () => {
  if (history.length < 2) return; // nothing previous
  history.pop(); // remove current
  currentPokemon = history.pop(); // go back one
  showCurrentPokemon();
  saveProgress();
});

// Known button
document.getElementById("known").addEventListener("click", () => {
  if (!currentPokemon) return;

  // Remove from learning pool
  learningPool = learningPool.filter(p => p.number !== currentPokemon.number);

  // Move to next Pokémon
  nextPokemon();
});

document.getElementById("next").addEventListener("click", () => {
  // Move to next Pokémon
  nextPokemon();
});

// Generation selector
genSelect.addEventListener("change", () => {
  resetLearningPool();
});

// Progress display
function updateProgress() {
  const selectedGen = genSelect.value;

  let knownInGen = 0;
  let totalInGen = 0;

  if (selectedGen === "all") {
    // Sum over all generations
    for (const genData of Object.values(progress)) {
      knownInGen += genData.knownCount;
      //totalInGen += genData.knownCount + genData.learningPool.length;
    }
  } else {
    // Per-generation counts
    const currentGenData = progress[selectedGen] || { learningPool: [], history: [], knownCount: 0 };
    knownInGen = currentGenData.knownCount;
    totalInGen = knownInGen + currentGenData.learningPool.length;
  }

  // Update per-gen or all-gen display
  document.getElementById("learned-count").textContent = knownInGen;
  if (selectedGen !== "all") {
    document.getElementById("total-count").textContent = totalInGen;
  } else {
    document.getElementById("total-count").textContent = allPokemon.length;
  }

  // Progress bar
  const percent = totalInGen === 0 ? 0 : (knownInGen / totalInGen) * 100;
  const bar = document.getElementById("progress-bar");
  if (bar) bar.style.width = percent + "%";

  // Optional: update global known (sum over all gens)
  const globalKnown = Object.values(progress).reduce((sum, genData) => sum + genData.knownCount, 0);
  const globalTotal = allPokemon.length;

  const globalEl = document.getElementById("global-learned-count");
  if (globalEl) globalEl.textContent = globalKnown;
  const globalTotalEl = document.getElementById("global-total-count");
  if (globalTotalEl) globalTotalEl.textContent = globalTotal;
}



// Save progress for current generation
function saveProgress() {
  const selectedGen = genSelect.value;
  if (!progress[selectedGen]) return;

  progress[selectedGen].learningPool = learningPool;
  progress[selectedGen].history = history;
  progress[selectedGen].knownCount = allPokemon
    .filter(p => !learningPool.some(lp => lp.number === p.number) &&
                 (selectedGen === "all" || p.generation === selectedGen)).length;

  // Save the entire progress object to localStorage
  localStorage.setItem('pokemonProgress', JSON.stringify(progress));

  updateProgress();
}
// Reset all progress button
document.getElementById("reset-progress").addEventListener("click", () => {
  if (!confirm("Êtes-vous sûr de vouloir réinitialiser tous les progrès ? Cette action est irréversible.")) return;

  // Clear in-memory progress
  progress = {};

  // Clear saved progress from localStorage
  localStorage.removeItem('pokemonProgress');

  // Re-initialize the learning pool for current generation
  resetLearningPool();
});
