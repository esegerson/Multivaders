let lastVaderSpawned = null;
let lastId = 0;
let score = 0;
let hitCeiling = 0;
let gameLoopInterval = null;
let statLoopInterval = null;
let orbiterInterval = null;
let turretInterval = null;
let startingVaders = 10;
let autoSolve = false;
let autoSolveInProgress = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let stats = [];
let showStats = false;
let timer = 0;
let elapsedPaused = 0;
let pausedStart = 0;
let totalSeconds = 0;
let overrideSpeed = false;
const vaderRunnerChance = 1 / 10; //This seems really wrong. 1/3 feels like 1/10
let forceNextRunner = false;
let multishots = 0;
const multishotsAwarded = 4;
let multishotActive = function() { return multishots > 0; };

let keybuffer = [];

function gameDomLoaded() {
    document.getElementById("gameContainer").addEventListener("animationend", function(e) { 
        e.target.classList.remove("boom");
    });
    document.getElementById("turret").addEventListener("animationend", function(e) { 
        e.target.classList.remove("pulse");
    });
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
    multishots = 0;
    resetOrbiters();

    //Spawn initial vaders
    for (let i = 0; i < startingVaders; i++) {
        spawnVader(lastId++, true);
    }
    let vaders = document.querySelectorAll("#gameContainer .vader");
    for (const vader of vaders) {
        vader.style.top = Math.random() * window.innerHeight / 2 + "px"; // Randomize initial position above the viewport
        vader.style.animationDelay = Math.random() * 2 + "s"; // Randomize initial animation delay
        vader.classList.remove("active");
    }
    getNextActiveVader(); // Set the first active vader

    setupOrbiters();
    
    timer = performance.now(); // Start the timer
    totalSeconds = 0; //This gets set in gameOver(), used for high score display
    spawnVader(lastId++); // Spawn the first vader
    gameLoopInterval = setInterval(gameLoop, 1000 / 30); //Start the game loop 30fps
    statLoopInterval = setInterval(updateStats, 1000 / 10); //10fps
    orbiterInterval = setInterval(updateOrbiters, 1000 / 60); //60fps
    turretInterval = setInterval(moveTurret, 1000 / 60); //60fps

    //Pre-populate multis (decorative background elements)
    const multiContainer = document.querySelector("#gameContainer .background2");
    for (let i = 0; i < 20; i++) {
        multiContainer.appendChild(createMulti(true));
    } 
    
    //Play music
    let music = document.getElementById("gameMusic");
    music.volume = 0.2;
    music.play();

    //Debugging
    if (window.location.protocol === "file:") {
        //setTimeout(function() { sendKeyPress("`"); }, 1000);
    }
}

function gameLoop() {
    let now = performance.now();

    let vaders = document.querySelectorAll("#gameContainer .vader");
    let incompleteVaders = Array.from(vaders).filter(v => !v.classList.contains("correct"));

    //Spawn regular vader
    if (now - lastVaderSpawned > getDelay() || incompleteVaders.length === 0) {
        if (incompleteVaders.length === 0) {
            let extraPoints = 4;
            if (hitCeiling > 0) extraPoints += 4; //Score MORE if you just cleared the screen (very hard!)
            hitCeiling += 4;
            //Award 4 extra points (in additon to the 1 point for solving each vader)
            score += extraPoints - 1; //Last extra point awarded in incrementScore()
            playChimeSound();
            showScreenTip({ type: "clear", classname: "tipclear", text: "Clear! +" + extraPoints });
            incrementScore(); //Called here to refresh the score display
        }
        else
            hitCeiling -= 1;
        if (hitCeiling < 0) hitCeiling = 0;

        if (!overrideSpeed) spawnVader(lastId++);
    }

    //Move all vaders down
    for (const vader of vaders) {
        let speed = parseFloat(vader.getAttribute("data-speed") || 1);
        if (overrideSpeed) speed = 0;
        if (vader.classList.contains("runner")) {
            let left = parseFloat(vader.style.left);
            let direction = parseInt(vader.getAttribute("data-dir")) * -1;
            let newLeft = left + speed * direction;
            vader.style.left = newLeft + "px";
            if (vader.classList.contains("active") && !runnerOutOfBounds(vader).canBeActive) {
                vader.classList.remove("active");
                getNextActiveVader();
            }
        } else {
            let top = parseFloat(vader.style.top || "-150");
            if (top < 50 && score < 100) { //Do a fast slide-in so user doesn't have to wait
                speed = (50 - top) / 5 * speed; //Hustle to get onto the screen
                if (speed < 0.2) speed = 0.2; // Ensure a minimum speed
            }
            vader.style.top = (top + speed) + "px";
        }
    }

    // Tint the background based on vader positions
    tintBackground(); 

    //Cull solved vaders
    for (const vader of vaders) {
        if (vader.classList.contains("correct")) {
            let solvedTime = parseFloat(vader.getAttribute("data-solved") || 0);
            if (solvedTime > 0 && now - solvedTime > 8000) 
                vader.remove();
        } else if (vader.classList.contains("runner") && runnerOutOfBounds(vader).canBeRemoved) {
            vader.remove();
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
        
        //Auto-solver kicks into 2nd gear after 100 points
        let readDelay = score < 100 ? 700 : 600;
        let digitDelay = score < 100 ? 200 : 130;
        let submitDelay = score < 100 ? 300 : 130;
            
        if (now - lastSolve > readDelay && !autoSolveInProgress) {
            autoSolveInProgress = true;
            let activeVader = document.querySelector("#gameContainer .vader.active");
            let facts = getFactsFromVader(activeVader);
            let result = facts.factA * facts.factB;
            let delay = 0;
            for (let c of result.toString()) {
                setTimeout(() => { sendKeyPress(c); }, delay);
                delay += digitDelay;
            }
            setTimeout(() => { sendKeyPress("Enter"); autoSolveInProgress = false; }, delay += submitDelay);
        }
    }

    //Animate background
    manageBackgroundMultis();

    //Animate laser particles
    moveLaserParticles();
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
    totalSeconds = Math.floor((performance.now() - timer - elapsedPaused) / 1000);
    clearInterval(gameLoopInterval); // Stop the game loop
    clearInterval(statLoopInterval); // Stop the stats loop
    clearInterval(orbiterInterval); // Stop the orbiter loop
    clearInterval(turretInterval); // Stop the turret loop
    let music = document.getElementById("gameMusic");
    music.volume = 0.1;
    setTimeout(() => {
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("gameContainer").style.display = "none";
        document.body.removeEventListener("keydown", keyListener);
        document.body.classList.toggle("noscroll");

        //Show high scores
        document.getElementById("highScoresGameOver").style.display = "block";
        populateHighScoresUI();
    }, 5000);
}

function spawnVader(id, init = false) {
    let isRunner = () => {
        const chance = (Math.random() / vaderRunnerChance);
        let msg = chance + "";
        if (!init && container.querySelectorAll(".runner").length === 0 
                && !multishotActive()
                && (forceNextRunner || chance < 1)) {
            forceNextRunner = false;
            return true;
        }
        return false;
    };
    let problem = getProblem();
    let vader = createVader(id, problem.factA, problem.factB);
    let container = document.getElementById("vaderContainer");
    if (container.querySelectorAll(".active").length === 0)
        vader.classList.add("active");
    if (isRunner()) {
        vader.classList.add("runner");
        let direction = Math.random() * 2 < 1 ? -1 : 1;
        vader.style.left = direction < 0 ? "-200px" : window.innerWidth + 100 + "px";
        vader.style.top = (Math.random() * window.innerHeight * .7) + "px";
        vader.setAttribute("data-dir", direction);
        vader.setAttribute("data-speed", parseFloat(vader.getAttribute("data-speed")) * 8);
    }
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
    const activeVader = document.querySelector("#gameContainer .vader.active");
    if (multishotActive() && activeVader && vaderIsSame(vaderClone, activeVader)) {
        vaderClone.classList.add("related");
        vaderClone.querySelector(".result").textContent = activeVader.querySelector(".result").textContent;
    }
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
    let seconds = 460 / (score + 20) - 2.87 - hitCeiling;
    if (seconds < 0.9 && hitCeiling == 0) seconds = 0.9; // Ensure a minimum delay of 1 second
    if (seconds < 0.7 && hitCeiling > 0) seconds = 0.7; // If the user is hitting the ceiling, allow a faster rate
    return seconds * 1000;
}

function isPaused() {
    return gameContainer.classList.contains("paused");
}

function keyListener(e) {
    let paused = isPaused();
    const activeVader = document.querySelector(".active");
    const relatedVaders = getRelatedVaders(activeVader);
    const result = activeVader.querySelector(".result");
    if (document.querySelector(".vader.dead")) {
        return; // If a vader is dead, ignore all key presses
    } else if (e.key === "Escape") {
        if (paused) return; // Cannot quit while paused
        for (const vader of document.querySelectorAll("#gameContainer .vader:not(.correct)")) {
            vader.classList.remove("active");
            vader.classList.remove("correct");
            vader.classList.remove("incorrect");
            vader.classList.add("dead");
        }
        setDeadBackgroundStyle(1); // Set background to dead state
        gameOver();
    } else if (e.key === " ") {
        keyListenerHelper.doPause(paused);
    } else if (e.key === "Pause") {
        if (paused) return; // Cannot autosolve while paused
        e.preventDefault();
        autoSolve = !autoSolve; // Toggle auto-solve mode
    } else if (e.key === "Backspace") {
        if (paused) return; // Cannot type while paused
        e.preventDefault();
        result.textContent = result.textContent.slice(0, -1);
        if (result.textContent.length === 0) result.textContent = "\xa0";
        activeVader.classList.remove("correct");
        activeVader.classList.remove("incorrect");
        if (multishotActive())
            for (const v of relatedVaders)
                v.querySelector(".result").textContent = result.textContent;
    } else if (e.key.length === 1 && e.key >= '0' && e.key <= '9') {
        if (paused) return; // Cannot type while paused
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
        if (multishotActive()) { //Copy pressed number to all related vaders
            for (const v of relatedVaders) {
                v.querySelector(".result").textContent = result.textContent;
                v.classList.remove("incorrect");
            }
        }
    } else if (e.key === "Enter") {
        if (paused) return; // Cannot type while paused
        if (result.textContent === (activeVader.getAttribute("data-last-val") || "~")) 
            return; //Prevent accidental double-enters on wrong answers which can quickly end the game
        if (result.textContent === "" || result.textContent === "\u00A0") { //nbsp
            //Nothing entered
            const runner = document.querySelector("#gameContainer .vader.runner");
            if (runner != null) {
                //If special vader is in play, grab that one
                activeVader.classList.remove("active");
                runner.classList.add("active");
            }
            return;
        }
        keyListenerHelper.doEnter(activeVader, result);
    } else if (e.key === "`") {
        //Toggle stats display
        showStats = !showStats;
    } else if (e.key === "ArrowLeft" || e.key === "a") {
        //Left
        if (paused) return; // Cannot play while paused
        selectDifferentVader(-1);
    } else if (e.key === "ArrowRight" || e.key === "d") {
        //Right
        if (paused) return; // Cannot play while paused
        selectDifferentVader(1);
    } else if (e.key === "PageUp" && showStats) {
        //Debug: Stop vaders only when stats are shown
        overrideSpeed = !overrideSpeed;
        let vaders = document.querySelectorAll("#gameContainer .vader");
        for (const vader of vaders)
            if (overrideSpeed) vader.classList.add("paused");
            else vader.classList.remove("paused");
    } else if (e.key === "PageDown" && showStats) {
        //Debug: whatever I'm currently testing
        //forceNextRunner = !forceNextRunner;
        //spawnVader(lastId++, false);
    }
}

class keyListenerHelper {
    static doEnter(activeVader, result) {
        const facts = getFactsFromVader(activeVader);
        const expectedResult = facts.factA * facts.factB;
        const relatedVaders = multishotActive()
                ? [activeVader, ...getRelatedVaders(activeVader)]
                : [activeVader];
        if (parseInt(result.textContent) === expectedResult) {
            for (const [i, v] of relatedVaders.entries()) {
                v.classList.remove("incorrect");
                v.classList.add("correct");
                v.classList.remove("active");
                v.setAttribute("data-solved", performance.now());
                zapLaser(v, i === 0, relatedVaders.length);
                setTimeout(incrementScore, i * 100); //Animates multishot better
                showScreenTip({ type: "point", classname: "tippoint", text: "+1",
                    x: parseInt(v.style.left) + v.offsetWidth / 2 + 30,
                    y: parseInt(v.style.top) + v.offsetHeight - 60
                });
            }
            if (multishotActive()) {
                multishots--;
                hideOneOrbiter();
                if (!multishotActive()) endMultishot();
            }
            if (activeVader.classList.contains("runner")) {
                multishots += multishotsAwarded;
                orbitDetails.movementMode = "transfer";
                orbitDetails.initTransfer(activeVader);
            }
            getNextActiveVader(activeVader.getAttribute("data-id"));
            playKeyboardPress(3); //3 = the bass harmonic
        } else {
            for (const [i, v] of relatedVaders.entries()) {
                v.setAttribute("data-last-val", result.textContent);
                v.classList.add("incorrect");
                let speed = parseFloat(v.getAttribute("data-speed"));
                v.setAttribute("data-speed", speed * 3); // Increase speed on incorrect answer
            }
        }
    }

    static doPause(paused) {
        let gameContainer = document.getElementById("gameContainer");
        gameContainer.classList.toggle("paused");
        paused = !paused;
        if (paused) {
            clearInterval(gameLoopInterval);
            document.getElementById("paused").style.display = "block";
            let music = document.getElementById("gameMusic");
            music.volume = 0.1; //Lower volume when paused
            pausedStart = performance.now();
        } else {
            gameLoopInterval = setInterval(gameLoop, 33); // Resume the game loop
            document.getElementById("paused").style.display = "none";
            let music = document.getElementById("gameMusic");
            music.volume = 0.2;
            elapsedPaused += (performance.now() - pausedStart);
        }
    }
}

function getNextActiveVader() {
    //Get the lowest vader on screen
    const vaders = Array.from(document.querySelectorAll("#gameContainer .vader:not(.correct)"));
    
    let maxTop = -1000;
    let id = null;
    for (const vader of vaders) {
        if (vader.classList.contains("runner") && !runnerOutOfBounds(vader).canBeActive) { 
            continue; //Don't auto-target a runner close to the edges
        }
        if (parseInt(vader.style.top) > maxTop) {
            maxTop = parseInt(vader.style.top);
            id = vader.getAttribute("data-id");
        }
    }
    if (id != null) 
        vaders.filter(v => v.getAttribute("data-id") === id)[0].classList.add("active");
    if (multishotActive()) initMultishot();
}

function runnerOutOfBounds(vader) {
    const margin = 100;
    const dir = parseInt(vader.getAttribute("data-dir"));
    const rect = vader.getBoundingClientRect();
    let rv = { };
    rv.fullyVisible = rect.left > 0 && rect.right < window.innerWidth;
    rv.fullyInvisible = rect.right < -margin || rect.left > window.innerWidth + margin; //Margin for orbiters
    rv.canBeActive = (dir > 0 && rect.left > 0)
        || (dir < 0 && rect.right < window.innerWidth);
    rv.canBeRemoved = (dir > 0 && rect.left < -margin)
        || (dir < 0 && rect.left > window.innerWidth + margin);
    return rv;
}

function selectDifferentVader(direction) {
    //Direction: -1 = left of current active vader, 1 = right
    const vaders = Array.from(document.querySelectorAll("#gameContainer .vader:not(.correct)"));
    if (vaders.length === 0) return;
    for (const v of vaders) v.classList.remove("related");
    const activeVader = document.querySelector("#gameContainer .vader.active");
    const vaderPos = parseInt(activeVader.style.left);
    const eligibleVaders = vaders.filter(v => {
        const pos = parseInt(v.style.left);
        return direction === -1 ? pos < vaderPos : pos > vaderPos;
    });
    if (eligibleVaders.length === 0) return; //No eligible vaders in that direction
    const nearestVader = eligibleVaders.reduce((prev, curr) => {
        const prevLeft = parseInt(prev.style.left);
        const currLeft = parseInt(curr.style.left);
        if (direction === -1)
            return currLeft > prevLeft ? curr : prev;
        else
            return currLeft < prevLeft ? curr : prev;
    });
    if (nearestVader) {
        activeVader.classList.remove("active");
        nearestVader.classList.add("active");
        if (multishotActive()) initMultishot();
    }
}

function getRelatedVaders(activeVader) {
    let rv = [];
    let otherVaders = document.querySelectorAll("#gameContainer .vader:not(.correct):not(.active)");
    for (const vader of otherVaders)
        if (vaderIsSame(activeVader, vader)) rv.push(vader);
    return rv;
}

function incrementScore() {
    //Also updates the score display
    score++;
    document.getElementById("score").textContent = score;
    document.getElementById("score2").textContent = score;
    document.getElementById("pauseScore").textContent = score;
}

function tintBackground() {
    let vaders = document.querySelectorAll("#gameContainer .vader:not(.correct):not(.runner)");
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
    if (!showStats) {
        container.style.display = "none";
        return;
    }
    container.style.display = "block";
    let secs = ((performance.now() - timer - elapsedPaused) / 1000).toFixed(0);
    let min = Math.floor(secs / 60);
    let sec = secs % 60;

    //Get some stats
    stats.NumVaders = document.querySelectorAll("#gameContainer .vader:not(.correct)").length;
    stats.Delay = (getDelay() / 1000).toFixed(1) + "s";
    stats.HitCeiling = hitCeiling;
    stats.Speed = (getSpeed(0) * 33).toFixed(0) + "px/s";
    stats.Lifespan = (getEstimatedLifespan() / 33).toFixed(0) + "s";
    stats.Runner = "force=" + (forceNextRunner ? "on" : "off") + " : " 
        + document.querySelectorAll(".vader.runner").length;
    stats.Multishots = multishots + " : " + (multishotActive() ? "ACTIVE" : "off");
    stats.Time = min + ":" + (sec < 10 ? "0" : "") + sec;
    stats.Chord = getChord();
    
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

function manageBackgroundMultis() {
    //A multi is just a visual decoration, a large "×" character that floats up the screen
    const maxNumMultis = 20 + score / 5; //When score = 100, maxNumMultis = 40
    const multiWidth = 100;
    const bgContainer = document.querySelector("#gameContainer .background2");
        
    //Spawn
    let numMultis = bgContainer.querySelectorAll(".multi").length;
    if (numMultis < maxNumMultis) bgContainer.appendChild(createMulti(false));

    //Move up and cull
    for (const multi of bgContainer.querySelectorAll(".multi")) {
        let top = parseFloat(multi.style.top || "0");
        let speed = multi.getAttribute("data-speed") || 1;
        if (overrideSpeed) speed = 0;
        top -= speed;
        multi.style.top = top + "px";
        if (top < multiWidth * -1) multi.remove();
    }
}

function createMulti(init) {
    const multiWidth = 20;
    const left = Math.round(Math.random() * (window.innerWidth - multiWidth));
    const top = init ? Math.round(Math.random() * window.innerHeight) : window.innerHeight;
    let multi = document.createElement("div");
    multi.classList.add("multi");
    multi.style.left = left + "px";
    multi.style.top = top + "px";
    multi.style.fontSize = (Math.random() * 5 + 10) + "rem";
    multi.style.animationDelay = (Math.random() * -10) + "s"; //Negative delay so there's no "jump"
    multi.style.opacity = (Math.random() * 0.2).toString();
    multi.setAttribute("data-speed", getSpeed() * 2);
    return multi;
}

function zapLaser(targetVader, isFirst, numZapped) {
    let resultElement = targetVader.querySelector(".result");
    let targetX = parseInt(targetVader.style.left) + targetVader.offsetWidth / 2 + 20;
    let targetY = parseInt(targetVader.style.top) + targetVader.offsetHeight - 20;
    const turret = document.getElementById("turret");
    const turretLocation = getVaderCenter(turret);
    let turretX = turretLocation.x; //window.innerWidth / 2;
    let turretY = turretLocation.y; //window.innerHeight - 10;

    //Draw
    let g = document.getElementById("sparks");
    let svgl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    svgl.setAttribute('x1', turretX);
    svgl.setAttribute('y1', turretY);
    svgl.setAttribute('x2', targetX);
    svgl.setAttribute('y2', targetY);
    createLaserParticles(g, turretX, turretY, targetX, targetY);
    g.append(svgl);

    //Schedule line removal
    setTimeout(() => { svgl.remove(); }, 100);

    if (isFirst) {
        //Pulse turret
        const turret = document.querySelector("#gameContainer .turret .circle");
        turret.classList.remove("pulse");
        void turret.offsetWidth; //Force reflow to restart animation
        turret.classList.add("pulse");
    
        if (multishotActive() && numZapped > 1) {
            //Shake screen
            const screen = document.getElementById("gameContainer");
            screen.classList.remove("boom");
            void screen.offsetWidth; //Force reflow to restart animatin
            screen.classList.add("boom");

            //Draw network lines
            const n = networkFor(targetVader);
            drawNetworkFor(targetVader, n);
            setTimeout(() => { 
                //Schedule line removal
                const svg = document.getElementById("networkLines"); 
                svg.replaceChildren(); //Clear all children
            }, 100); 
        }
    }
}

function createLaserParticles(g, x1, y1, x2, y2) {
    //Create small particles along the laser path for a more dramatic effect
    //Randomly place a particle somewhere along the line from (x1, y1) to (x2, y2)
    let numParticles = 100;
    for (let i = 0; i < numParticles; i++) {
        let t = Math.random();
        let px = x1 + t * (x2 - x1);
        let py = y1 + t * (y2 - y1);
        let vx = (Math.random() * 2 - 1) * 0.5;
        let vy = (Math.random() * 2 - 1) * 0.5;
        let particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        particle.setAttribute("cx", px);
        particle.setAttribute("cy", py);
        particle.setAttribute("vx", vx);
        particle.setAttribute("vy", vy);
        particle.style.animationDelay = (Math.random() * -10) + "s"; //Negative delay so there's no "jump"

        //Add particle
        g.append(particle);

        //Schedule particle removal
        setTimeout(() => { particle.remove(); }, 10000);
    }
}

function moveLaserParticles() {
    let g = document.getElementById("sparks");
    for (const particle of g.querySelectorAll("circle")) {
        let cx = parseFloat(particle.getAttribute("cx"));
        let cy = parseFloat(particle.getAttribute("cy"));
        let vx = parseFloat(particle.getAttribute("vx"));
        let vy = parseFloat(particle.getAttribute("vy"));
        cx += vx;
        cy += vy;
        particle.setAttribute("cx", cx);
        particle.setAttribute("cy", cy);
    }
}

function showScreenTip(tipDetails) {
    //This is the yellow "+1" or "Clear!" that briefly appears on screen
    let tc = document.getElementById("tipContainer");
    let e = document.createElement("div");
    switch (tipDetails.type) {
        case "clear":
            e.className = tipDetails.classname;
            e.textContent = tipDetails.text;
            break;
        case "point":
            e.className = tipDetails.classname;
            e.textContent = tipDetails.text;
            e.style.left = tipDetails.x + "px";
            e.style.top = tipDetails.y + "px";
            break;
    }
    tc.appendChild(e);
    e.addEventListener("animationend", () => { e.remove(); });
}

function vaderIsSame(vader1, vader2) {
    let facts1 = getFactsFromVader(vader1);
    let facts2 = getFactsFromVader(vader2);
    return facts1.id !== facts2.id 
        && ((facts1.factA === facts2.factA && facts1.factB === facts2.factB)
        || (facts1.factA === facts2.factB && facts1.factB === facts2.factA));
}

function initMultishot() {
    const activeVader = document.querySelector("#gameContainer .vader.active");
    const relatedVaders = getRelatedVaders(activeVader);
    for (const v of relatedVaders) {
        v.classList.add("related");
        v.querySelector(".result").textContent = activeVader.querySelector(".result").textContent;
    }
    document.querySelector("#turret .circle").classList.add("multishot");
}

function endMultishot() {
    const relatedVaders = document.querySelectorAll("#gameContainer .vader.related");
    for (const v of relatedVaders)
        v.classList.remove("related");
    document.querySelector("#turret .circle").classList.remove("multishot");
    resetOrbiters();
}

function getVaderCenter(vader) {
    const rect = vader.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return { x, y };
}

function getFactsFromVader(vader) {
    const id = vader.getAttribute("id");
    const factA = parseInt(vader.querySelector(".factA").textContent);
    const factB = parseInt(vader.querySelector(".factB").textContent);
    return { id, factA, factB };
}

function networkFor(vader) {
    return [...document.querySelectorAll("#gameContainer .vader:not(.correct)")]
        .filter(v => vaderIsSame(vader, v));
}

function drawNetworkFor(vader, network) {
    const vaderCenter = getVaderCenter(vader);
    for (const v of network) {
        const vCenter = getVaderCenter(v);
        //Draw line from vaderCenter to vCenter
        let g = document.getElementById("networkLines");
        let svgl = document.createElementNS("http://www.w3.org/2000/svg", "line");
        svgl.setAttribute('x1', vaderCenter.x);
        svgl.setAttribute('y1', vaderCenter.y);
        svgl.setAttribute('x2', vCenter.x);
        svgl.setAttribute('y2', vCenter.y);
        svgl.setAttribute('stroke', 'url(#fadeLine)');
        g.append(svgl);

        //Draw lines to every other node in the network
        for (const v2 of network) {
            if (v2 === v) continue;
            const v2Center = getVaderCenter(v2);
            let svgl2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            svgl2.setAttribute('x1', vCenter.x);
            svgl2.setAttribute('y1', vCenter.y);
            svgl2.setAttribute('x2', v2Center.x);
            svgl2.setAttribute('y2', v2Center.y);
            svgl2.setAttribute('stroke', 'url(#fadeLine)');
            g.append(svgl2);
        }
    }
}