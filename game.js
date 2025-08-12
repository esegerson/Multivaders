let presets = {
    A: [[3,3], [6,6], [5,3], [8,4], [8,8], [3,4], [5,5], [9,9], [6,4], [3,5], [4,8], [4,3], [4,6]],
    B: [[4,4], [4,5], [7,3], [7,4], [8,5], [8,7], [9,3], [9,4], [9,5], [5,4], [3,7], [4,7], [5,8], [7,8], [3,9], [4,9], [5,9]],
    C: [[5,6], [5,7], [6,3], [6,8], [7,6], [7,7], [7,9], [8,3], [9,6], [9,8], [6,5], [7,5], [3,6], [8,6], [6,7], [9,7], [3,8], [6,9], [8,9]],
    D: [[12,3], [12,4], [12,5], [12,6], [12,7], [12,8], [12,9], [12,11], [12,12], [3,12], [4,12], [5,12], [6,12], [7,12], [8,12], [9,12], [11,12]],
    E: [[1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], [1,8], [1,9], [1,10], [1,11], [1,12], 
        [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1],
        [2,2], [2,3], [2,4], [2,5], [2,6], [2,7], [2,8], [2,9], [2,10], [2,11], [2,12],
        [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2],
        [3,10], [4,10], [5,10], [6,10], [7,10], [8,10], [9,10], [10,10], [11,10], [12,10],
        [10,3], [10,4], [10,5], [10,6], [10,7], [10,8], [10,9], [10,11], [10,12],
        [11,3], [11,4], [11,5], [11,6], [11,7], [11,8], [11,9], [11,11],
        [3,11], [4,11], [5,11], [6,11], [7,11], [8,11], [9,11],
        [0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8], [0,9], [0,10], [0,11], [0,12],
        [1,0], [2,0], [3,0], [4,0], [5,0], [6,0], [7,0], [8,0], [9,0], [10,0], [11,0], [12,0]]
};

let selectedProblems = [];
let lastVaderSpawned = null;
let lastId = 0;
let score = 0;
let gameLoopInterval = null;
let statLoopInterval = null;
let startingVaders = 10;
let autoSolve = false;
let autoSolveInProgress = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let stats = [];

function preset(set) {
    const buttons = document.querySelectorAll('.grid button');
    const presetKey = String.fromCharCode(64 + set); // Convert 1 -> 'A', 2 -> 'B', etc.
    const selectedPreset = presets[presetKey];
    if (selectedPreset) {
        for (const f of selectedPreset) {
            const button = document.querySelector(`button[data-fact-a="${f[0]}"][data-fact-b="${f[1]}"]`);
            if (button) {
                button.classList.add('selected');
            }
        }
        document.getElementById("setName").textContent = "Set " + presetKey;
    }
}

function clearSelection() {
    document.querySelectorAll(".grid button").forEach(b => b.classList.remove("selected"));
}

function start() {
    const selectedButtons = document.querySelectorAll('.grid button.selected');
    if (selectedButtons.length === 0) {
        alert("Please select at least one multiplication fact.");
        return;
    }
    document.getElementById('gameTitle').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    // Here you can initialize the game with the selected multiplication facts
    document.getElementsByTagName("body")[0].addEventListener("keydown", keyListener);
    console.log("Starting game with selected facts:", Array.from(selectedButtons).map(btn => btn.textContent));
    selectedProblems = Array.from(selectedButtons).map(btn => ({
        factA: btn.getAttribute("data-fact-a"),
        factB: btn.getAttribute("data-fact-b")
    }));

    //Init
    document.body.classList.toggle("noscroll");
    document.querySelectorAll("#gameContainer .vader").forEach(v => v.remove()); // Clear previous vaders
    score = -1;
    incrementScore(); // Start score at 0

    //Spawn initial vaders
    for (let i = 0; i < startingVaders; i++) {
        spawnVader(lastId++);
    }
    let vaders = document.querySelectorAll("#gameContainer .vader");
    for (const vader of vaders) {
        vader.style.top = Math.random() * window.innerHeight / 2 + "px"; // Randomize initial position above the viewport
        vader.style.animationDelay = Math.random() * 2 + "s"; // Randomize initial animation delay
        vader.classList.remove("active");
    }
    getNextActiveVader(); // Set the first active vader
    
    timer = performance.now(); // Start the timer
    spawnVader(lastId++); // Spawn the first vader
    gameLoopInterval = setInterval(gameLoop, 33); // Start the game loop ~30fps
    statLoopInterval = setInterval(updateStats, 10); // Update stats every 1/100 second
    
    //Play music
    let music = document.getElementById("gameMusic");
    music.volume = 0.2;
    music.play();
}

function gameLoop() {
    let now = performance.now();

    let vaders = document.querySelectorAll("#gameContainer .vader");
    let incompleteVaders = Array.from(vaders).filter(v => !v.classList.contains("correct"));

    //Spawn regular vader
    if (now - lastVaderSpawned > getDelay() || incompleteVaders.length === 0) {
        spawnVader(lastId++);
    }

    //Move all vaders down
    for (const vader of vaders) {
        let speed = parseFloat(vader.getAttribute("data-speed") || 1);
        let top = parseFloat(vader.style.top || "-150");
        if (top < 50) {
            speed = (50 - top) / 5 * speed; //Hustle to get onto the screen
            if (speed < 0.2) speed = 0.2; // Ensure a minimum speed
        }
        vader.style.top = (top + speed) + "px";
    }

    // Tint the background based on vader positions
    tintBackground(); 

    //Cull solved vaders
    for (const vader of vaders) {
        if (!vader.classList.contains("correct")) continue;
        let solvedTime = parseFloat(vader.getAttribute("data-solved") || 0);
        if (solvedTime > 0 && now - solvedTime > 8000) {
            vader.remove(); // Remove vaders that have been solved for more than 8 seconds
        }
    }

    //Check for game over condition
    let windowHeight = window.innerHeight - 180;
    for (const vader of vaders) {
        if (vader.classList.contains("correct")) continue; // Skip solved vaders
        let top = parseFloat(vader.style.top || "-150");
        if (top > windowHeight) {
            // Game over condition: a vader has reached the bottom
            gameOver(vader);
            return;
        }
    }

    //Autosolve (secret mode)
    if (autoSolve) {
        let solvedVaders = document.querySelectorAll("#gameContainer .vader.correct");
        let lastSolve = Math.max(
            ... Array.from(solvedVaders).map(v => parseInt(v.getAttribute("data-solved") || 0))
        );
        if (now - lastSolve > 700 && !autoSolveInProgress) {
            autoSolveInProgress = true;
            let activeVader = document.querySelector("#gameContainer .vader.active");
            let factA = parseInt(activeVader.querySelector(".factA").textContent);
            let factB = parseInt(activeVader.querySelector(".factB").textContent);
            let result = factA * factB;
            let delay = 0;
            for (let c of result.toString()) {
                setTimeout(() => { sendKeyPress(c); }, delay);
                delay += 200;
            }
            setTimeout(() => { sendKeyPress("Enter"); autoSolveInProgress = false; }, delay += 300);
        }
    }
}

function sendKeyPress(key) {
    const event = new KeyboardEvent("keydown", {
        key: key,
        bubbles: false,
        cancelable: true
    });
    keyListener(event);
}

function gameOver(vader) {
    if (vader) vader.classList.add("dead");
    clearInterval(gameLoopInterval); // Stop the game loop
    clearInterval(statLoopInterval); // Stop the stats loop
    setTimeout(() => {
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("gameContainer").style.display = "none";
        document.body.removeEventListener("keydown", keyListener);
        document.body.classList.toggle("noscroll");
        document.getElementById("playAgain").focus();
    }, 5000);
}

function spawnVader(id) {
    let problem = getProblem();
    let vader = createVader(id, problem.factA, problem.factB);
    let container = document.getElementById("gameContainer");
    if (container.querySelectorAll(".active").length === 0)
        vader.classList.add("active");
    container.appendChild(vader);
    lastVaderSpawned = performance.now();
}

function getProblem() {
    if (selectedProblems.length === 0) {
        alert("No multiplication facts selected.");
        return null;
    }
    const randomIndex = Math.floor(Math.random() * selectedProblems.length);
    return selectedProblems[randomIndex];
}

function createVader(id, factA, factB) {
    let vaderTemplate = document.getElementById("vaderTemplate");
    let vaderClone = vaderTemplate.cloneNode(true);
    vaderClone.querySelector(".factA").textContent = factA;
    vaderClone.querySelector(".factB").textContent = factB;
    vaderClone.querySelector(".result").textContent = "\xa0"; // Non-breaking space
    vaderClone.id = "vader-" + id; // Unique ID for the vader
    vaderClone.setAttribute("data-id", id);
    vaderClone.style.top = "-132px"; // Start above the viewport
    vaderClone.style.left = Math.random() * (window.innerWidth - 100) + "px"; // Random horizontal position
    vaderClone.setAttribute("data-speed", getSpeed());
    return vaderClone;
}

function getSpeed(variance = 1) {
    //Variance = 1 allows some randomness to the speed,
    //but that's annoying when displaying a speed stat, so variance = 0 kills that
    let difficulty = score / 3;
    let rv = Math.round((Math.random() * variance * difficulty / 2 + difficulty) * 10) / 200;
    if (rv < 0.2) rv = 0.2; // Ensure a minimum speed
    return rv; // Speed in pixels per frame (33ms)
}

function getEstimatedLifespan() {
    let v = getSpeed(0); //px / s
    let h = window.innerHeight - 180; //px
    return h / v; //s
}

function getDelay() {
    /*  Basic core function is y = 460 / (x + 20) - 2.87
        Sample points:
          Score  Delay (s)
              0  20
              6  15
             16  10
             38   5
             47   4
             58   3
             75   2
            100   1
        The idea is to start out very generous at 20 seconds per problem, 
        but by the time the initial screen is cleared, the delay is down to 10 seconds or less,
        and by 100 points, the delay is down to 1 second, which is insanely difficult.
    */
    let seconds = 460 / (score + 20) - 2.87;
    if (seconds < 1) seconds = 1; // Ensure a minimum delay of 1 second
    return seconds * 1000;
}

function keyListener(e) {
    const activeVader = document.querySelector(".active");
    const result = activeVader.querySelector(".result");
    if (document.querySelector(".vader.dead")) {
        return; // If a vader is dead, ignore all key presses
    } else if (e.key === "Escape") {
        for (const vader of document.querySelectorAll("#gameContainer .vader:not(.correct)")) {
            vader.classList.remove("active");
            vader.classList.remove("correct");
            vader.classList.remove("incorrect");
            vader.classList.add("dead");
        }
        setDeadBackgroundStyle(1); // Set background to dead state
        gameOver();
    } else if (e.key === " ") {
        let gameContainer = document.getElementById("gameContainer");
        gameContainer.classList.toggle("paused");
        if (gameContainer.classList.contains("paused")) {
            clearInterval(gameLoopInterval);
            document.getElementById("paused").style.display = "block";
        } else {
            gameLoopInterval = setInterval(gameLoop, 33); // Resume the game loop
            document.getElementById("paused").style.display = "none";
        }
    } else if (e.key === "Pause") {
        e.preventDefault();
        autoSolve = !autoSolve; // Toggle auto-solve mode
    } else if (e.key === "Backspace") {
        e.preventDefault();
        result.textContent = result.textContent.slice(0, -1);
        if (result.textContent.length === 0) result.textContent = "\xa0";
        activeVader.classList.remove("correct");
        activeVader.classList.remove("incorrect");
    } else if (e.key.length === 1 && e.key >= '0' && e.key <= '9') {
        e.preventDefault();

        if (activeVader.classList.contains("incorrect")) {
            result.textContent = ""; // Reset if previously incorrect
            activeVader.classList.remove("incorrect");
        }

        if (result.textContent.length === 1 && result.textContent === "\xa0") result.textContent = "";

        if (result.textContent.length < 3) {
            result.textContent += e.key;
            playKeyboardPress(Math.floor(Math.random() * 3));
        }
    } else if (e.key === "Enter") {
        if (result.textContent === (activeVader.getAttribute("data-last-val") || "~")) 
            return; //Prevent accidental double-enters on wrong answers which can quickly end the game
        const factA = parseInt(activeVader.querySelector(".factA").textContent);
        const factB = parseInt(activeVader.querySelector(".factB").textContent);
        const expectedResult = factA * factB;
        if (parseInt(result.textContent) === expectedResult) {
            activeVader.classList.remove("incorrect");
            activeVader.classList.add("correct");
            activeVader.classList.remove("active");
            activeVader.setAttribute("data-solved", performance.now());
            incrementScore();
            getNextActiveVader(activeVader.getAttribute("data-id"));
            playKeyboardPress(3); //3 = the bass harmonic
        } else {
            activeVader.setAttribute("data-last-val", result.textContent);
            activeVader.classList.add("incorrect");
            let speed = parseFloat(activeVader.getAttribute("data-speed"));
            activeVader.setAttribute("data-speed", speed * 2); // Increase speed on incorrect answer
        }
    }
}

function getNextActiveVader() {
    //Get the lowest vader on screen
    const vaders = Array.from(document.querySelectorAll("#gameContainer .vader:not(.correct)"));
    
    let maxTop = -1000;
    let id = null;
    for (const vader of vaders) {
        if (parseInt(vader.style.top) > maxTop) {
            maxTop = parseInt(vader.style.top);
            id = vader.getAttribute("data-id");
        }
    }
    if (id != null) 
        vaders.filter(v => v.getAttribute("data-id") === id)[0].classList.add("active");
}

function incrementScore() {
    score++;
    document.getElementById("score").textContent = score;
    document.getElementById("score2").textContent = score;
}

function tintBackground() {
    let vaders = document.querySelectorAll("#gameContainer .vader:not(.correct)"); //Solved vaders are not counted
    let largestTop = Math.max(...Array.from(vaders).map(v => parseFloat(v.style.top || "0")));
    let windowHeight = window.innerHeight - 200;
    let distanceToBottom = windowHeight - largestTop;
    if (distanceToBottom < 400) {
        let o = (400 - distanceToBottom) / 400;
        setDeadBackgroundStyle(o);
            
    } else {
        document.body.style.removeProperty("background");
    }
}

function updateStats() {
    let container = document.getElementById("statsContainer");

    //Get some stats
    stats.NumVaders = document.querySelectorAll("#gameContainer .vader:not(.correct)").length;
    stats.Delay = (getDelay() / 1000).toFixed(1) + "s";
    stats.Speed = (getSpeed(0) * 33).toFixed(0) + "px/s";
    stats.Lifespan = (getEstimatedLifespan() / 33).toFixed(0) + "s";
    stats.Chord = getChord();
    
    //Debug
    //let oldVal = container.querySelector("#chord").textContent;
    //container.querySelector("#chord").textContent = "Chord: " + getChord();
    //if (container.querySelector("#chord").textContent != oldVal) playKeyboardPress(0);

    //Display stats
    let dl = document.createElement("dl");
    dl.innerHTML = '';
    for (const key in stats) {
        const dt = document.createElement("dt");
        dt.textContent = key;
        const dd = document.createElement("dd");
        dd.textContent = stats[key];
        dl.appendChild(dt);
        dl.appendChild(dd);
    }
    let oldDl = container.getElementsByTagName("dl")[0];
    if (oldDl) oldDl.remove();
    container.appendChild(dl);

}

function setDeadBackgroundStyle(o) {
    document.body.style.background = 
        "linear-gradient(to bottom, rgba(0,0,0,0), rgba(255,0,0," + o + ")), linear-gradient(to bottom, #000, #459)";
}

