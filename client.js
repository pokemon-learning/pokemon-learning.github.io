let conn;
let playerName; // = "Player" + Math.floor(Math.random() * 1000);
let clientTimer;

function joinGame() {
  const code = document.getElementById("join-code").value;
  const peer = new Peer();

  peer.on("open", () => {
    conn = peer.connect(code);

    conn.on("open", () => {
      document.getElementById("menu").style.display = "none";
      document.getElementById("game").style.display = "block";
      playerName = prompt("Enter your name:");
      conn.send({ type: "join", name: playerName });
    });

    conn.on("data", data => {
      if (data.type === "question") renderQuestion(data.q);
      if (data.type === "leaderboard") renderLeaderboard(data.scores);
      if (data.type === "reveal") renderAnswerReveal(data.correct);
    });
  });
}

function renderQuestion(q) {
  // 1. Reset state
  let finalAnswer = null;
  clearInterval(clientTimer); 
  
  const answersDiv = document.getElementById("answers");
  const questionEl = document.getElementById("question");
  
  // 1. Conditional HTML Building
  let questionHTML = `<span>${q.q}</span>`;
  
  if (q.img) {
    // Medium Mode: Show the image
    questionHTML += `<br><img src="${q.img}" style="width:150px; height:auto; margin:10px; display:block; margin-left:auto; margin-right:auto;">`;
  }
  
  questionEl.innerHTML = questionHTML;
  
  answersDiv.innerHTML = "";


  // 2. Conditional UI Building
  if (q.type === "choice") {
    // Render Buttons ONLY once here
    q.a.forEach((answer, index) => {
      const btn = document.createElement("button");
      btn.innerText = answer;
      
      btn.onclick = () => {
        finalAnswer = index;
        // Visual feedback
        Array.from(answersDiv.children).forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        
        console.log("Answer selected locally: ", index);
      };
      answersDiv.appendChild(btn);
    });
  } else if (q.type === "text") {
    // Render Input Box
    answersDiv.innerHTML = `
      <input type="text" id="text-input" placeholder="Type here..." 
             style="width: 80%; padding: 10px; display: block; margin: 20px auto;">
    `;
  }

  // 3. Start the sync timer (matching the host's 10 seconds)
  let timeLeft = 10;
  clientTimer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = "⏳ " + timeLeft;
    
    if (timeLeft <= 0) {
      clearInterval(clientTimer);
      if (q.type === "text") {
        finalAnswer = document.getElementById("text-input").value.trim();
      }
      // 4. Lock in and send the answer
      conn.send({
        type: "answer",
        name: playerName,
        answer: finalAnswer // Will be null if they didn't click
      });

      
      // Disable buttons so they can't change after time is up
      Array.from(answersDiv.children).forEach(b => b.disabled = true);
      console.log("Time up! Answer sent.");
    }
  }, 1000);
}

function renderAnswerReveal(correct) {
  document.getElementById("question").innerHTML += `<br><span style="color: green;">Réponse correcte: ${correct}</span>`;
}

function renderLeaderboard(scores) {
  const board = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([name, score]) => `${name}: ${score}`)
    .join("<br>");

  document.getElementById("leaderboard").innerHTML = board;
}
