//Hard-coded presets, "Set A", etc.
//From "Simply Good and Beautiful Math 3"
let presets = {
    A: [[3,3], [6,6], [5,3], [8,4], [8,8], [3,4], [5,5], [9,9], [6,4], [3,5], [4,8], [4,3], [4,6]],
    B: [[4,4], [4,5], [7,3], [7,4], [8,5], [8,7], [9,3], [9,4], [9,5], [5,4], [3,7], [4,7], [5,8], [7,8], [3,9], [4,9], [5,9]],
    C: [[5,6], [5,7], [6,3], [6,8], [7,6], [7,7], [7,9], [8,3], [9,6], [9,8], [6,5], [7,5], [3,6], [8,6], [6,7], [9,7], [3,8], [6,9], [8,9]],
    D: [[12,3], [12,4], [12,5], [12,6], [12,7], [12,8], [12,9], [12,11], [12,12], [3,12], [4,12], [5,12], [6,12], [7,12], [8,12], [9,12], [11,12]],
    //E is not an explicit set from "Good & Beautiful", it's just "everything else"
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
let selectedSetName = "";
const defaultInitials = "\u2013\u2013\u2013"; //EN DASH x3

document.addEventListener("DOMContentLoaded", function() {
    //Generate 12x12 buttons
    const maxFactor = 12;
    const gridContainer = document.querySelector('.grid');
    for (let i = 0; i <= maxFactor; i++)
        for (let j = 0; j <= maxFactor; j++) {
            const button = document.createElement('button');
            button.textContent = i + " \u00d7 " + j; // Display the product of i and j
            button.setAttribute("data-fact-a", i);
            button.setAttribute("data-fact-b", j);
            button.addEventListener("click",() => {
                button.classList.toggle("selected");
                updatePresetButtons();
                updateClearButton();
                //Select the commutative one (if not a square)
                const commutativeButton = document.querySelector(`button[data-fact-a="${j}"][data-fact-b="${i}"]`);
                if (commutativeButton && i !== j) commutativeButton.classList.toggle("selected");
                updatePresetButtons();
            });
            gridContainer.appendChild(button);
        }
    updateClearButton();
    refreshCustomPresetButtons();
    gameDomLoaded();
});

window.addEventListener("load", function() {
    if (window.location.protocol === "file:")
        console.clear(); //Helps with debugging; don't care about all the GET 200s
});

function preset(set) {
    //For loading hardcoded presets ("Set A")
    const presetKey = String.fromCharCode(64 + set); // Convert 1 -> 'A', 2 -> 'B', etc.
    const selectedPreset = presets[presetKey];
    if (selectedPreset) {
        const setButton = document.querySelectorAll("#presetButtons > button.hardcoded")[set - 1];
        setButton.classList.add("hover");
        const numSelectedSets = document.querySelectorAll("#presetButtons .selected, #presetButtons .hover").length;
        if (noSelectedFacts() && numSelectedSets === 1) setButton.classList.add("selected");
        if (numSelectedSets > 1) {
            document.querySelectorAll("#presetButtons .selected, #presetButtons .hover").forEach(b => {
                //If more than one set selected, turn all selected sets into hover
                b.classList.remove("selected");
                b.classList.add("hover");
            });
        }        
        for (const f of selectedPreset) {
            const button = document.querySelector(`button[data-fact-a="${f[0]}"][data-fact-b="${f[1]}"]`);
            if (button) button.classList.add('selected');
        }
    }
    let numSelectedSets = document.querySelectorAll("#presetButtons .selected, #presetButtons .hover").length;
    selectedSetName = numSelectedSets === 1 ? "Set " + presetKey : "";
    updateClearButton();
    updateStartButton();
}

function presetCustom(btn) {
    let presetName = btn.innerText;
    if (btn.classList.contains("delete")) {
        //Delete this preset
        let presetList = JSON.parse(localStorage.getItem("presets"));
        presetList = presetList.filter(p => p.name !== presetName);
        localStorage.setItem("presets", JSON.stringify(presetList));

        //Delete high scores for this preset
        let highscoreList = JSON.parse(localStorage.getItem("highscores"));
        highscoreList = highscoreList.filter(s => s.name !== presetName);
        localStorage.setItem("highscores", JSON.stringify(highscoreList));
        
        //Update UI
        deletePreset(document.getElementById("btnDeletePreset"));
        refreshCustomPresetButtons();
        return;
    } else {
        //Load this preset
        let preset = JSON.parse(localStorage.getItem("presets")).filter(p => p.name === btn.innerText)[0];
        for (const f of preset.facts) {
            const button = document.querySelector(`button[data-fact-a="${f[0]}"][data-fact-b="${f[1]}"]`);
            if (button) button.classList.add('selected');
        }
        
        let numSelectedSets = document.querySelectorAll("#presetButtons .selected, #presetButtons .hover").length;
        if (numSelectedSets === 0) {
            btn.classList.add("selected");
            numSelectedSets++;
        } else {
            document.querySelectorAll("#presetButtons .selected, #presetButtons .hover").forEach(b => {
                //If more than one set selected, turn all selected sets into hover
                b.classList.remove("selected");
                b.classList.add("hover");
            });
            btn.classList.add("hover");
            numSelectedSets++;
        }
        selectedSetName = numSelectedSets === 1 ? presetName : "";
        updateClearButton();
        updateStartButton();
        document.getElementById("setNote").style.display 
            = numSelectedSets === 1 ? "none" : "inline";
    }
}

function clearSelection() {
    document.querySelectorAll(".grid button").forEach(b => b.classList.remove("selected"));
    for (const b of document.querySelectorAll("#presetButtons button")) 
        b.classList.remove("selected");
    selectedSetName = "";
    updateClearButton();
    updatePresetButtons();
}

function updateClearButton() {
    let noFactsSelected = noSelectedFacts();
    let presetSelected = noSelectedPreset();
    document.getElementById("btnClear").disabled = noFactsSelected;
    document.getElementById("btnClear").title = noFactsSelected 
        ? "No  facts to clear." 
        : "Clear all selected multiplication facts.";
    document.getElementById("btnMakePreset").disabled = noFactsSelected || !presetSelected;
    document.getElementById("btnMakePreset").title = noFactsSelected 
        ? "Select at least one multiplication fact to create a preset." 
        : "Create a custom preset from the selected multiplication facts.";
    if (noFactsSelected) document.querySelectorAll("#presetButtons button.hover").forEach(b => b.classList.remove("hover"));
    closeNewPresetUi();
}

function openPresetModal() {
    document.getElementById("btnMakePreset").style.display = "none";
    document.getElementById("presetSave").style.display = "inline";
    document.getElementById("setname").select();
    document.getElementById("setname").focus();
}

function closeNewPresetUi() {
    document.getElementById("btnMakePreset").style.display = "inline";
    document.getElementById("presetSave").style.display = "none";
}

function savePreset() {
    let presetName = document.getElementById("setname").value.trim();
    if (presetName.length === 0) {
        let n = document.getElementById("presetList").children.length + 1;
        presetName = "Custom " + n;
    }
    let newPreset = {
        name: presetName,
        facts: Array.from(document.querySelectorAll(".grid button.selected")).map(b => [
            parseInt(b.getAttribute("data-fact-a")),
            parseInt(b.getAttribute("data-fact-b"))
        ]),
        highScores: []
    };
    if (newPreset.facts.length === 0) {
        alert("Please select at least one multiplication fact before saving a preset.");
        return;
    }
    let presetList = JSON.parse(localStorage.getItem("presets"));
    if (presetList == null) 
        presetList = [];
    else if (presetList.some(x => x.name === newPreset.name)) {
        alert("A preset with that name already exists. Please choose a different name.");
        return;
    } else if (presetName.length === 5 && /\bSet [A-E]\b/.test(presetName)) {
        alert("A preset with that name already exists. Please choose a different name.");
        return;
    }
    presetList.push(newPreset);
    localStorage.setItem("presets", JSON.stringify(presetList));
    refreshCustomPresetButtons();
    closeNewPresetUi();
}

function deletePreset(deleteButton) {
    const buttons = document.querySelectorAll("#presetList > BUTTON");
    for (const b of buttons)
        if (b.classList.contains("delete")) 
            b.classList.remove("delete"); 
        else {
            b.classList.add("delete");
            b.style.animationDelay = (Math.random() * -1) + "s"; //Negative delay so there's no "jump"
        }
    if (deleteButton.classList.contains("deleteMode")) {
        deleteButton.classList.remove("deleteMode");
        deleteButton.innerText = deleteButton.innerText.replace("Done Deleting", "Delete Preset");
    } else {
        deleteButton.classList.add("deleteMode");
        deleteButton.innerText = deleteButton.innerText.replace("Delete Preset", "Done Deleting");
    }
}

function refreshCustomPresetButtons() {
    let presetList = JSON.parse(localStorage.getItem("presets"));
    if (presetList == null) presetList = [];
    let container = document.getElementById("presetList");
    container.innerHTML = '';
    for (const p of presetList) {
        let el = document.createElement("button");
        el.innerText = p.name;
        el.setAttribute("onclick", "presetCustom(this)");
        el.setAttribute("onmouseover", "hoverPreset(this)");
        el.setAttribute("onmouseout", "clearHoverPreset()");
        container.appendChild(el);
        container.appendChild(document.createTextNode(" ")); //Add a space between buttons
    }
    const hasCustomPresets = container.childNodes.length > 0;
    document.getElementById("btnDeletePreset").disabled = !hasCustomPresets;
    document.getElementById("btnDeletePreset").title = hasCustomPresets
        ? "Delete a custom preset"
        : "No custom presets to delete";
}

function hoverPreset(el) {
    if (el.classList.contains("hardcoded")) {
        const buttons = document.querySelectorAll('.grid button');
        const presetKey = el.innerText.replace("Set ", "").trim(); // Extract 'A', 'B', etc.
        const selectedPreset = presets[presetKey];
        for (const f of selectedPreset) {
            const button = document.querySelector(`button[data-fact-a="${f[0]}"][data-fact-b="${f[1]}"]`);
            if (button) button.classList.add('hover');
        }
    } else {
        let preset = JSON.parse(localStorage.getItem("presets")).filter(p => p.name === el.innerText)[0];
        for (const f of preset.facts) {
            const button = document.querySelector(`button[data-fact-a="${f[0]}"][data-fact-b="${f[1]}"]`);
            if (button) button.classList.add('hover');
        }
    }
}

function clearHoverPreset() {
    for (const b of document.querySelectorAll('.grid button.hover')) {
        b.classList.remove('hover');
    }
}

function noSelectedFacts() {
    return document.querySelectorAll(".grid button.selected").length === 0;
}

function noSelectedPreset() {
    return document.querySelectorAll("#presetButtons button.selected").length === 0;
}

function combinePresets() {
    //Put all hardcoded and custom presets into one object
    //Also, grab a reference to the corresponding button
    let combinedPresets = JSON.parse(localStorage.getItem("presets"));
    for (const p of combinedPresets) 
        p.element = Array.from(document.querySelectorAll("#presetList > button"))
            .find(x => x.textContent === p.name);
    for (let key in presets) {
        const setName = "Set " + key;
        combinedPresets.push({
            name: setName,
            facts: presets[key],
            element: Array.from(document.querySelectorAll("#presetButtons > button.hardcoded"))
                .find(x => x.textContent === setName)
        });
    }
    return combinedPresets;
}

function selectedFactsToArray() {
    //Convert list of buttons to facts
    const selectedButtons = document.querySelectorAll(".grid button.selected");
    let selectedFacts = [];
    for (const b of selectedButtons)
        selectedFacts.push([parseInt(b.getAttribute("data-fact-a")), parseInt(b.getAttribute("data-fact-b"))]);
    return selectedFacts;
}

function arraysMatch(a, b) {
    if (a.length !== b.length) return false;
    const bCopy = [...b];
    for (let itemA of a) {
        const matchIx = bCopy.findIndex(itemB => itemA.length === itemB.length && itemA.every((v, i) => v === itemB[i]));
        if (matchIx === -1) return false;
        bCopy.splice(matchIx, 1); //Remove matched item to prevent dups
    }
    return true;
}

function isArraySetSubset(a, b) {
    //If a is fully represented in b, return true
    return a.every(subA =>
        b.some(subB => 
          Array.isArray(subB) &&
          subA.length === subB.length &&
          subA.every((val, i) => val === subB[i])
        )
      );
}

function updateStartButton() {
    const selectedFacts = selectedFactsToArray();
    document.getElementById("startGame").disabled = selectedFacts.length === 0;
    document.getElementById("startGame").setAttribute("title", 
        selectedFacts.length === 0 ? "Select at least one fact to play" : "Play!");

    document.getElementById("btnViewHighScores").style.display = selectedSetName !== "" ? "inline" : "none";
}

function updatePresetButtons() {
    const selectedFacts = selectedFactsToArray();
    const presets = combinePresets();
    const exactMatches = presets.filter(p => arraysMatch(p.facts, selectedFacts));
    for (const p of presets) {
        p.element.classList.remove("selected");
        p.element.classList.remove("hover");
        const isExactMatch = arraysMatch(p.facts, selectedFacts);
        const isSubset = isArraySetSubset(p.facts, selectedFacts);
        if (isExactMatch && exactMatches.length === 1)
            p.element.classList.add("selected");
        else if (isExactMatch || isSubset)
            p.element.classList.add("hover");
    }

    const numPresetSelected = presets.filter(p => p.element.classList.contains("selected")).length;

    selectedSetName = numPresetSelected === 1 ? exactMatches[0].name : "";

    document.getElementById("setNote").style.display 
        = numPresetSelected === 1 || selectedFacts.length == 0 ? "none" : "inline";
    updateStartButton();
}

function submitHighScore() {
    saveHighScore();
    document.getElementById("gameOverButtons").style.display = "inline-block";
}

function defaultHighScores() {
    return [
        {rank: 1, initials: defaultInitials, score: 90, date: "", time: ""},
        {rank: 2, initials: defaultInitials, score: 60, date: "", time: ""},
        {rank: 3, initials: defaultInitials, score: 30, date: "", time: ""}
    ];
}

function saveHighScore() {
    const maxEntriesPerSet = 10;
    const minScoreToQualify = 2;
    const defaultScores = defaultHighScores();

    //Get initials
    let initials = document.getElementById("initialsInput").value.trim().toUpperCase();
    if (initials.length === 0) initials = defaultInitials;
    //else if (initials.length < 3) initials = initials.padEnd(3, " ");
    else if (initials.length > 3) initials = initials.substring(0, 3);

    //Get set name
    let setName = selectedSetName;
    if (setName === "") {
        alert("Unable to save high score: No preset selected.");
        return;
    }

    //Get score
    let score = parseInt(document.getElementById("score2").innerText);
    if (isNaN(score)) score = 0;
    if (score < minScoreToQualify) {
        alert("Score too low to qualify for high scores.");
        return;
    }

    //Construct entry
    const entry = {
        rank:       0, //To be set later
        initials:   initials,
        score:      score,
        date:       new Date().toLocaleDateString(), //MM/DD/YYYY
        time:       totalSeconds //Future use, not displaying currently
    };

    //Load existing highscores
    let highscoreList = JSON.parse(localStorage.getItem("highscores"));
    if (highscoreList == null) highscoreList = [];
    
    //Find or create set entry
    let setEntry = highscoreList.find(s => s.name === setName);
    if (setEntry == null) {
        setEntry = {
            name: setName,
            scores: defaultScores.slice()
        };
        highscoreList.push(setEntry);
    }

    //Add new score    
    setEntry.scores.push(entry);

    //Sort and trim
    setEntry.scores.sort((a, b) => b.score - a.score);
    if (setEntry.scores.length > maxEntriesPerSet)
        setEntry.scores = setEntry.scores.slice(0, maxEntriesPerSet);
    
    //Update ranks
    for (let i = 0; i < setEntry.scores.length; i++)
        setEntry.scores[i].rank = i + 1;

    //Save back to localStorage
    localStorage.setItem("highscores", JSON.stringify(highscoreList));
}

function getHighScoresForSet(setName) {
    let highscoreList = JSON.parse(localStorage.getItem("highscores"));
    if (highscoreList == null) return [];
    let setEntry = highscoreList.find(s => s.name === setName);
    if (setEntry == null) return defaultHighScores();
    return setEntry.scores;
}

function isHighScore(setName, score) {
    if (setName === "") return false;
    if (score < 2) return false;
    let highscoreList = getHighScoresForSet(setName);
    if (highscoreList.length < 10) return true;
    return score > highscoreList[highscoreList.length - 1].score;
}

function populateHighScoresUI() {
    //Grab DOM elements
    const divHsMainMenu = document.getElementById("highScoresMainMenu");
    const divHsGameOver = document.getElementById("highScoresGameOver");
    const h2MainMenu = divHsMainMenu.querySelector("h2");
    const h2GameOver = divHsGameOver.querySelector("h2");
    const h3MainMenu = divHsMainMenu.querySelector("h3");
    const h3GameOver = divHsGameOver.querySelector("h3");
    const olMainMenu = divHsMainMenu.querySelector("ol");
    const olGameOver = divHsGameOver.querySelector("ol");
    const pNewHighScore = divHsGameOver.querySelector("p");
    const btns = document.getElementById("gameOverButtons");
    
    //Load existing highscores
    let highscoreList = getHighScoresForSet(selectedSetName);

    //Get score, determine if it's a high score, and if so, what rank
    const score = document.getElementById("score2").textContent;
    const isHS = isHighScore(selectedSetName, score);
    const newRank = isHS ? highscoreList.filter(entry => score < entry.score).length + 1 : 99;
    if (newRank <= 10) {
        //Insert new score into list for display purposes
        highscoreList.splice(newRank - 1, 0, {
            rank: newRank,
            initials: "",
            score: score,
            date: new Date().toLocaleDateString()
        });
        for (let i = newRank; i < highscoreList.length; i++)
            highscoreList[i].rank += 1;
        document.getElementById("initialsInput").value = ""; //Clear initials input
    }

    //Clear existing entries
    olMainMenu.replaceChildren(); 
    olGameOver.replaceChildren();

    //Set titles
    h3MainMenu.textContent = selectedSetName;
    h3GameOver.textContent = selectedSetName;

    //Populate both lists
    let newMarked = false;
    for (const entry of highscoreList) {
        const li = document.createElement("li");
        const dl = document.createElement("dl");
        const dt = document.createElement("dt");
        if (isHS && entry.rank === newRank) {
            li.classList.add("new");
            newMarked = true;
        }
        if (isHS && entry.rank > 10) li.classList.add("kicked"); //Show the last one getting kicked off the list
        dt.textContent = ordinal(entry.rank) + ":";
        const ddInitials = document.createElement("dd");
        ddInitials.textContent = entry.initials;
        const ddScore = document.createElement("dd");
        ddScore.textContent = entry.score;
        const ddDate = document.createElement("dd");
        ddDate.textContent = entry.date;
        dl.appendChild(dt);
        dl.appendChild(ddInitials);
        dl.appendChild(ddScore);
        dl.appendChild(ddDate);
        li.appendChild(dl);
        olMainMenu.appendChild(li);
        olGameOver.appendChild(li.cloneNode(true));
    }

    //Show instructions
    h2GameOver.style.display = selectedSetName === "" ? "none" : "block";
    pNewHighScore.style.display = isHS ? "block" : "none";
    btns.style.display = isHS ? "none" : "inline-block";

    //Add listeners for initials input if needed
    if (isHS && newMarked) document.addEventListener("keydown", initialsInputKeyDown);
}

function ordinal(n) {
    return n + (n % 10 === 1 && n % 100 !== 11 ? "st" :
                n % 10 === 2 && n % 100 !== 12 ? "nd" :
                n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");
}

function initialsInputKeyDown(e) {
    //Keys allowed: A-Z, Backspace, Delete

    const inputEl = document.getElementById("initialsInput");
    const entry = document.querySelector("#highScoresGameOver ol.highscorelist li.new");
    let val = inputEl.value;
    
    if (e.key === "Enter") {
        submitHighScore();
        document.removeEventListener("keydown", initialsInputKeyDown);
        newNameSparks();
        document.querySelector(".highscorelist li.new").classList.add("emphasize");
        document.querySelector(".highscorelist li.new").classList.add("full"); //For short names
        document.querySelector(".highscorelist li.kicked")?.classList.add("hidden");
        document.querySelector("#highScoresGameOver p").style.opacity = "0";
        e.preventDefault();
    } else if (e.key === "Backspace") {
        val = val.slice(0, -1);
        entry.classList.remove("full");
        e.preventDefault();
    } else if (e.key.length === 1 && ((e.key >= 'A' && e.key <= 'Z') || (e.key >= 'a' && e.key <= 'z'))  && val.length < 3) {
        val += e.key;
        if (val.length >= 3) entry.classList.add("full"); else entry.classList.remove("full");
        e.preventDefault();
    }
    inputEl.value = val;
    document.querySelector("#highScoresGameOver ol.highscorelist li.new dd:nth-child(2)").textContent = val;
}

function newNameSparks() {
    //Find the bounding box of the new entry, generate 100 sparks, and animate them drifting away
    const entry = document.querySelector("#highScoresGameOver ol.highscorelist li.new");
    const rect = entry.getBoundingClientRect();
    const g = document.getElementById("nameSparksGroup");
    createNewNameSparks(g, rect.left, rect.top, rect.right, rect.bottom);
    const nameSparkAnimationInterval = setInterval(() => {
        moveNameParticles();
    }, 1000 / 30);
    setTimeout(() => {
        clearInterval(nameSparkAnimationInterval);
    }, 10 * 1000);
}

function createNewNameSparks(g, x1, y1, x2, y2) {
    let numParticles = 300;
    for (let i = 0; i < numParticles; i++) {
        let px = Math.random() * (x2 - x1) + x1;
        let py = Math.random() * (y2 - y1) + y1;
        let vx = (Math.random() * 2 - 1) * 2.0;
        let vy = (Math.random() * 2 - 1) * 1.5;
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

function moveNameParticles() {
    let g = document.getElementById("nameSparksGroup");
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

function playAgain() {
    document.getElementById("gameContainer").style.display = "block";
    document.getElementById("gameOver").style.display = "none";
    start();
}

function viewHighScoresMainMenu() {
    if (selectedSetName === "") return; //Should not be possible; populate() requires this
    document.getElementById("highScoresMainMenu").style.display = "block";
    document.getElementById("gameTitle").style.display = "none";
    populateHighScoresUI();
}

function returnToMainMenuFromHighScores() {
    document.getElementById("gameTitle").style.display = "block";
    document.getElementById("highScoresMainMenu").style.display = "none";
}