let selectedOperator = Operator.MULTIPLICATION;
let selectedOperatorRandom = false;
let selectedFormat = "";
let selectedFormatRandom = false;
let selectedProblems = [];
let selectedSetName = "";
const defaultInitials = "\u2013\u2013\u2013"; //EN DASH x3
let menuLoopInterval = null;
let hideCursorTimer = 0;
const osk = {
    isOn: false, //On-screen keyboard (either numeric or alpha)
    isNumeric: true, //When false, is alpha for initials entry
    numericEl: null,
    alphaEl: null,
    bind: function() {
        this.numericEl = document.getElementById("inputTable");
        this.alphaEl = document.getElementById("inputTableAlpha");
    },
    toggleOn: function() {
        this.isOn = !this.isOn;
        this.setState(this.isOn, this.isNumeric);
    },
    toggleMode: function() {
        this.isNumeric = !this.isNumeric;
        this.setState(this.isOn, this.isNumeric);
    },
    setState: function(isOn, isNumeric) {
        this.isOn = isOn;
        this.isNumeric = isNumeric;
        if (isOn) {
            if (isNumeric) {
                this.numericEl.classList.remove("hidden");
                this.alphaEl.classList.add("hidden");
            } else {
                this.numericEl.classList.add("hidden");
                this.alphaEl.classList.remove("hidden");
            }
        } else {
            this.numericEl.classList.add("hidden");
            this.alphaEl.classList.add("hidden");
        }
    }
}

window.addEventListener("load", function() {
    if (window.location.protocol === "file:" || window.location.host.indexOf("192.168") > -1)
        setTimeout(() => console.clear(), 1000); //Helps with debugging; don't care about all the GET 200s
    osk.bind();

    ['mousemove','mousedown','touchstart'].forEach(e =>
        window.addEventListener(e, resetHideCursorTimer, { passive: true })
    );
    resetHideCursorTimer();

    //Redirect if operator in URL
    if (window.location.search !== "" && window.location.search.indexOf("op=") > -1) {
        const op = window.location.search.split("op=")[1]; //This only works if op is last query parameter; I'm lazy
        selectOperator(op); //Auto-select operator for user-convenience
    }

    updateUltraButton();
});

window.addEventListener("keydown", function(e) {
    //Global listener for consistency
    if (e.key === "F11") {
        toggleFullscreen();
        e.preventDefault(); //Don't undo toggle
    }
});

function resetHideCursorTimer() {
    document.documentElement.classList.remove("hide-cursor");
    clearTimeout(hideCursorTimer);
    hideCursorTimer = setTimeout(() => {
        const gameIsActive = document.getElementById("gameContainer").style.display === "block"
            && document.querySelectorAll("#gameContainer .vader").length > 0
            && !isPaused();
        if (gameIsActive)
            document.documentElement.classList.add('hide-cursor');
    }, 4000);
}

function displayMouse() {
    clearTimeout(hideCursorTimer);
    document.documentElement.classList.remove("hide-cursor");
}

function normalizePreset(preset, fallbackOperator = Operator.MULTIPLICATION) {
    if (!preset || typeof preset !== "object" || Array.isArray(preset)) return null;
    return {
        name: preset.name || "",
        facts: Array.isArray(preset.facts) ? preset.facts : [],
        operator: preset.operator || fallbackOperator,
        highScores: Array.isArray(preset.highScores) ? preset.highScores : []
    };
}

function getPresetsFromStorage() {
    let presetList = JSON.parse(localStorage.getItem("presets") || "[]");
    if (!Array.isArray(presetList)) presetList = [];
    const normalizedPresets = presetList
        .map(preset => normalizePreset(preset, Operator.MULTIPLICATION))
        .filter(Boolean);
    const needsUpgrade = presetList.some(preset => !preset || typeof preset !== "object" || !("operator" in preset));
    if (needsUpgrade) localStorage.setItem("presets", JSON.stringify(normalizedPresets));
    return normalizedPresets;
}

function savePresetsToStorage(presetList) {
    const normalizedPresets = (presetList || [])
        .map(preset => normalizePreset(preset, Operator.MULTIPLICATION))
        .filter(Boolean);
    localStorage.setItem("presets", JSON.stringify(normalizedPresets));
    return normalizedPresets;
}

//Highscore helpers: normalize entries and migrate older entries lacking an operator
function normalizeHighscoreEntry(entry, fallbackOperator = Operator.MULTIPLICATION) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    return {
        name: entry.name || "",
        operator: entry.operator || fallbackOperator,
        scores: Array.isArray(entry.scores) ? entry.scores : []
    };
}

function getHighscoresFromStorage() {
    let list = JSON.parse(localStorage.getItem("highscores") || "[]");
    if (!Array.isArray(list)) list = [];
    const normalized = list.map(e => normalizeHighscoreEntry(e, Operator.MULTIPLICATION)).filter(Boolean);
    const needsUpgrade = list.some(e => !e || typeof e !== "object" || !("operator" in e));
    if (needsUpgrade) localStorage.setItem("highscores", JSON.stringify(normalized));
    return normalized;
}

function saveHighscoresToStorage(list) {
    const normalized = (list || []).map(e => normalizeHighscoreEntry(e, Operator.MULTIPLICATION)).filter(Boolean);
    localStorage.setItem("highscores", JSON.stringify(normalized));
    return normalized;
}

function getHardcodedPresetDefinitions(operator) {
    return hardcodedPresets.filter(preset => preset.operator === operator);
}

function getHardcodedPresetsForOperator(operator) {
    return (getHardcodedPresetDefinitions(operator) || []).map(preset => ({
        ...preset,
        operator
    }));
}

function getCustomPresetsForOperator(operator) {
    return getPresetsFromStorage().filter(preset => preset.operator === operator);
}
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.search.includes("experimental")) {
        document.getElementById("inputTable")?.classList.remove("experimental-hide");
    }

    bindFormatOptions();
    updateFormatOptionVisibility();
    updateFormatSelection();
});

function bindFormatOptions() {
    document.querySelectorAll("#formatSelect .format-option").forEach(option => {
        const format = option.dataset.format;
        option.addEventListener("click", () => selectFormat(format));
        option.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectFormat(format);
            }
        });
    });
}

function updateFormatOptionVisibility() {
    document.querySelectorAll("#formatSelect .format-option").forEach(option => {
        const isDivisionOnly = option.classList.contains("division-only");
        option.style.display = (!isDivisionOnly || selectedOperator === Operator.DIVISION) ? "flex" : "none";
    });
}

function updateFormatSelection() {
    document.querySelectorAll("#formatSelect .format-option").forEach(option => {
        option.classList.toggle("selected", selectedFormat === Format[option.dataset.format]);
    });
    updateStartButton();
}

function selectOperator(operator) {
    const bgSymbol = function() {
        switch (selectedOperator) {
            case Operator.ADDITION: return "+";
            case Operator.SUBTRACTION: return "-";
            case Operator.MULTIPLICATION: return "&#215;";
            case Operator.DIVISION: return "&#247";
            case "ULTRA": return "&#8252;"; //!! symbol
            default: return "?";
        }
    };

    selectedOperator = Operator[operator]; //"ULTRA" is not in the Operators enum
    if (operator === "ULTRA") {
        var btn = document.getElementById("btnUltra");
        if (btn.disabled || btn.classList.contains("hidden") || btn.classList.contains("locked")) return; //Failsafe
        document.getElementById("titleSelectOperator").style.display = "none";
        selectedOperator = operator;
        document.querySelector("#gameContainer > .background").innerHTML = bgSymbol();
        putSelectedOperatorInUrl();
        start();
        return;
    }
    document.getElementById("titleSelectOperator").style.display = "none";
    updateFormatOptionVisibility();
    document.getElementById("gameTitle").style.display = "block";
    generateFactsGrid();
    document.getElementById("opDisplay").textContent = operator.toLowerCase();

    const exampleNum = function(part) {
        let parts = [0, 0, 0];
        switch (selectedOperator) {
            case Operator.ADDITION: parts = [6, 3, 9]; break;
            case Operator.SUBTRACTION: parts = [9, 6, 3]; break;
            case Operator.MULTIPLICATION: parts = [3, 2, 6]; break;
            case Operator.DIVISION: parts = [6, 2, 3]; break;
        }
        return parts[part];
    }

    //Draw the background for game
    document.querySelector("#gameContainer > .background").innerHTML = bgSymbol();

    //Fix format preview operator
    document.querySelectorAll(".format-preview td.operator").forEach(td => td.innerHTML = bgSymbol());

    //Pre-select Stacked
    document.querySelectorAll("#formatSelect .format-option[data-format=STACKED]")[0].classList.add("selected");
    selectFormat("STACKED");

    //Fix format preview facts
    document.querySelectorAll(".format-preview td.factA").forEach( td => td.innerText = exampleNum(0));
    document.querySelectorAll(".format-preview td.factB").forEach( td => td.innerText = exampleNum(1));
    document.querySelectorAll(".format-preview td.result").forEach(td => td.innerText = exampleNum(2));

    //Pre-populate multis (decorative background elements)
    const multiContainer = document.querySelector("#menuContainer .background2");
    for (let i = 0; i < 20; i++) {
        multiContainer.appendChild(createMulti(true));
    } 
    menuLoopInterval = setInterval(menuLoop, 33); //Start the menu loop 30fps

    //Change tooltips on hardcoded presets
    const presets = getHardcodedPresetDefinitions(selectedOperator);
    document.querySelectorAll("#presetButtons button.hardcoded").forEach(b => {
        b.classList.remove("selected"); //Deselect any residual selections from prior operator
        const setName = b.textContent;
        const setLetter = setName.split("Set ")[1];   //A, B, C, D, E
        const ix = setLetter.charCodeAt(0) - 65;      //0, 1, 2, 3, 4
        const desc = presets.find(x => x.name === setName)?.description ?? setName;
        const high = getHigestScoreForSet(setName);
        b.title = desc + "\n\n" + high;
    });

    putSelectedOperatorInUrl();
}

function updateUltraButton(makeVisible = false, unlock = false) {
    const btn = document.getElementById("btnUltra");
    let isLocked = true;
    let isHidden = true;

    /*  1. Tease ultra mode when player has gotten accustomed to the game.
        2. Unlock when player has shown overall mastery

        Details:
            First:  make visible if:
                a: there are at least 4 good scores for each operator, or
                b: there are at least 25 good scores across all operators, or
                c: the unlock condition (below) is met
            Second:  unlock if there is a good score in sets A through E for all operators
        
            Score counts exclude default "---" initials.
            Good scores beat the default 3rd place (30 points).
            Condition A playstyle:  doesn't mater the preset. 
                Shows overall interest or proficiency in all operators.
            Condition B playstyle:  doesn't matter the operator.
                Shows exceeding interest in the game as a whole. 
                Many high scores in custom presets for only Addition will satisfy this.
    */

    const filterScores = (minValidScore) => {
        const scores = getHighscoresFromStorage();
        const scoresFiltered = [];
        scores.forEach(set => {
            const setEntries = set.scores.filter(x => x.initials !== defaultInitials && x.score >= minValidScore);
            setEntries.forEach(x => {
                scoresFiltered.push({
                    operator:   set.operator,
                    set:        set.name,
                    score:      x.score,
                    initials:   x.initials
                });
            });
        });
        return scoresFiltered;
    };

    const meetsConditionA = (scores, minNum) => {
        //Return true if at least minNum scores for each operator
        //scores is prefiltered to exclude too-low scores
        //Custom sets are allowed (not excluded)
        for (const op of Object.keys(Operator))
            if (scores.filter(x => x.operator === op).length < minNum) 
                return false;
        return true;
    }

    const meetsConditionB = (scores, minNum) => {
        //Returns true if at least minNum scores across all operators
        //scores is prefiltered to exclude too-low scores
        //Custom sets are allowed (not excluded)
        return scores.length >= minNum;
    }

    const meetsConditionC = (scores) => {
        //Return true if there is a score in every default set for every operator
        //scores is prefiltered to exclude too-low scores
        const defaultSetNames = new Set(hardcodedPresets.map(x => x.name));
        for (const op of Object.keys(Operator))
            for (const setName of defaultSetNames)
                if (scores.filter(x => x.operator === op && x.set === setName).length === 0)
                    return false;
        return true;
    };

    const getNextGoalForC = (scores) => {
        //This code based on meetsConditionC()
        const defaultSetNames = new Set(hardcodedPresets.map(x => x.name));
        for (const op of Object.keys(Operator))
            for (const setName of defaultSetNames)
                if (scores.filter(x => x.operator === op && x.set === setName).length === 0)
                    return titleCase(op.toLowerCase()) + " " + setName;
        return "None";
    };

    const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    const cheat = (e) => {
        const isVisible = !document.getElementById("btnUltra").classList.contains("hidden");
        if (e.key === "Pause" && !isVisible) updateUltraButton(true, false);
        if (e.key === "`" && isVisible) updateUltraButton(true, true);
    };

    const seededRandom = (seed) => {
        let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return x - Math.floor(x);
    };

    const getDailyAside = () => {
        var d = new Date();
        var r = seededRandom(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        var ix = Math.floor(r * asides.length);
        return asides[ix];
    };

    const minValidScore = defaultHighScores().find(x => x.rank === 3).score;
    const scoresFiltered = filterScores(minValidScore);
    const numScoresNeededPerOp = 4;
    const minTotalValidScoresAllOps = 25;
    const asides = [
        "Can you beat 100?",
        "Let's do this!",
        "The ultimate challenge!",
        "Your path to beat the game!",
        "The final wave.",
        "Are you ready?",
        "How good are you?",
        "Meet the boss.",
        "Are you faster than a calculator?",
        
        //Quotes (\u2013 is en-dash, displays well in tooltip and DOM)
        "“The only way to learn mathematics is to do mathematics.” \u2013 Paul Halmos",
        "“What we learn with pleasure, we never forget.” \u2013 Alfred Mercier",
        "“You never fail until you stop trying.” \u2013 Albert Einstein",
        "“Mathematics is not a spectator sport.” \u2013 John Wesley Young",
        "“Mathematics is the door and key to the sciences.” \u2013 Roger Bacon",
        "“Mathematical knowledge adds vigor to the mind.” \u2013 John Locke",
        "“Mathematics is the music of reason.” \u2013 James Joseph Sylvester"
    ];

    //Calculate
    const conditionA = meetsConditionA(scoresFiltered, numScoresNeededPerOp);
    const conditionB = meetsConditionB(scoresFiltered, minTotalValidScoresAllOps);
    const conditionC = meetsConditionC(scoresFiltered);

    //Apply tests
    if (conditionA || conditionB || conditionC || makeVisible) isHidden = false;
    if (conditionC || unlock) isLocked = false;
    
    //Cheat
    if (!makeVisible && isLocked) document.addEventListener("keydown", cheat);
    
    //Change DOM
    if (!isHidden) {
        btn.classList.remove("hidden");
        const goal = getNextGoalForC(scoresFiltered);
        const msg = "To unlock, get a score of " 
            + minValidScore + " or better on \"Set A\" through \"Set E\" "
            + "for all operators.\n\nNext goal: " + goal;
        btn.title = msg;
        btn.querySelector("aside").innerHTML = msg.replaceAll("\n", "<br>");
    }
    
    if (!isLocked) {
        btn.classList.remove("locked");
        btn.disabled = false;
        const msg = getDailyAside();
        btn.title = msg;
        btn.querySelector("aside").innerHTML = msg;
    }
}

function getHigestScoreForSet(setName) {
    const highscores = getHighScoresForSet(setName, selectedOperator);
    const filtered = highscores.filter(o => o.initials !== defaultInitials);
    const highest = filtered.length > 0 ? filtered[0] : null;
    if (highest === null || highest.initials === defaultInitials) 
        return "No high score; be the first!";
    return "High score: " + highest.score + " set by " + highest.initials;
}

function menuLoop() {
    manageBackgroundMultis(false); //Background multis for the menu, not the game
}

function selectFormat(format) {
    selectedFormat = Format[format];
    updateFormatSelection();
    document.getElementById("gameTitle").style.display = "block";
}

function backToOperatorSelection() {
    document.getElementById("gameTitle").style.display = "none";
    document.getElementById("titleSelectOperator").style.display = "block";
    clearInterval(menuLoopInterval);
    document.querySelector("#menuContainer .background2").innerHTML = "";

    //Remove operator from URL
    var refresh = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: refresh }, '', refresh); 
}

function generateFactsGrid() {
    const buttonText = function(i, j) {
        switch (selectedOperator) {
            case Operator.ADDITION: return i + " + " + j;
            case Operator.SUBTRACTION: return i + " - " + j;
            case Operator.MULTIPLICATION: return i + " \u00d7 " + j;
            case Operator.DIVISION: return i + " \u00f7 " + j;
            default: return i + " ? " + j;
        }
    };
    const isValidButton = function(i, j) {
        switch (selectedOperator) {
            case Operator.ADDITION: 
            case Operator.SUBTRACTION: 
            case Operator.MULTIPLICATION: return true;
            case Operator.DIVISION: return j !== 0;
            default: return false;
        }
    };

    //Generate 13x13 buttons (includes zero)
    const maxFactor = 12;
    const gridContainer = document.querySelector('.grid');
    gridContainer.innerHTML = ''; //Clear existing buttons
    for (let i = 0; i <= maxFactor; i++)
        for (let j = 0; j <= maxFactor; j++) {
            const button = document.createElement('button');
            let factA =i;
            const factB = j;
            if (selectedOperator === Operator.SUBTRACTION) factA += factB;
            if (selectedOperator === Operator.DIVISION) factA *= factB;
            button.textContent = buttonText(factA, factB);
            button.setAttribute("data-fact-a", factA);
            button.setAttribute("data-fact-b", factB);
            if (!isValidButton(i, j)) button.setAttribute("disabled", "true");
            button.addEventListener("click",() => {
                button.classList.toggle("selected");
                updatePresetButtons();
                updateClearButton();
                //Select the commutative one (if not a square)
                const commutativeButton = document.querySelector(`button[data-fact-a="${j}"][data-fact-b="${i}"]`);
                if (commutativeButton && i !== j 
                        && (selectedOperator === Operator.MULTIPLICATION 
                        || selectedOperator === Operator.ADDITION)) {
                    commutativeButton.classList.toggle("selected");
                }
                updatePresetButtons();
            });
            gridContainer.appendChild(button);
        }
    updateClearButton();
    refreshCustomPresetButtons();
    gameDomLoaded();
    updateStartButton();
}

function preset(set) {
    //For loading hardcoded presets ("Set A")
    const selectedPreset = getHardcodedPresetDefinitions(selectedOperator)[set - 1];
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
        for (const f of selectedPreset.facts) {
            const button = document.querySelector(`button[data-fact-a="${f[0]}"][data-fact-b="${f[1]}"]`);
            if (button) button.classList.add('selected');
        }
    }
    let numSelectedSets = document.querySelectorAll("#presetButtons .selected, #presetButtons .hover").length;
    selectedSetName = numSelectedSets === 1 ? selectedPreset?.name || "" : "";
    updateClearButton();
    updateStartButton();
}

function presetCustom(btn) {
    let presetName = btn.innerText;
    if (btn.classList.contains("delete")) {
        //Delete this preset
        let presetList = getPresetsFromStorage();
        presetList = presetList.filter(p => p.name !== presetName || p.operator !== selectedOperator);
        savePresetsToStorage(presetList);

        //Delete high scores for this preset
            let highscoreList = getHighscoresFromStorage();
            highscoreList = highscoreList.filter(s => !(s.name === presetName && s.operator === selectedOperator));
            saveHighscoresToStorage(highscoreList);
        
        //Update UI
        deletePreset(document.getElementById("btnDeletePreset"));
        refreshCustomPresetButtons();
        clearHoverPreset();
        return;
    } else {
        //Load this preset
        const presetList = getPresetsFromStorage();
        let preset = presetList.find(p => p.name === btn.innerText && p.operator === selectedOperator);
        if (!preset) return;
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
        : "Create a custom preset from the selected " + selectedOperator.toLowerCase() + " facts.";
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
        operator: selectedOperator,
        highScores: []
    };
    if (newPreset.facts.length === 0) {
        alert("Please select at least one fact before saving a preset.");
        return;
    }
    let presetList = getPresetsFromStorage();
    if (presetList.some(x => x.name === newPreset.name && x.operator === newPreset.operator)) {
        alert("A preset with that name already exists. Please choose a different name.");
        return;
    } else if (presetName.length === 5 && /\bSet [A-E]\b/.test(presetName)) {
        alert("A preset with that name already exists. Please choose a different name.");
        return;
    }
    presetList.push(newPreset);
    savePresetsToStorage(presetList);
    refreshCustomPresetButtons();
    closeNewPresetUi();
    const newBtn = Array.from(document.getElementById("presetList").querySelectorAll("button")).find(b => b.textContent === presetName);
    newBtn.classList.add("selected");
    selectedSetName = presetName;
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
    let presetList = getCustomPresetsForOperator(selectedOperator);
    let container = document.getElementById("presetList");
    container.innerHTML = '';
    for (const p of presetList) {
        let el = document.createElement("button");
        el.innerText = p.name;
        el.setAttribute("onclick", "presetCustom(this)");
        el.setAttribute("onmouseover", "hoverPreset(this)");
        el.setAttribute("onmouseout", "clearHoverPreset()");
        el.title = getHigestScoreForSet(p.name);
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
        const setNumber = Array.from(document.querySelectorAll("#presetButtons > button.hardcoded")).indexOf(el) + 1;
        const selectedPreset = getHardcodedPresetDefinitions(selectedOperator)[setNumber - 1];
        for (const f of selectedPreset?.facts || []) {
            const button = document.querySelector(`button[data-fact-a="${f[0]}"][data-fact-b="${f[1]}"]`);
            if (button) button.classList.add('hover');
        }
    } else {
        let preset = getCustomPresetsForOperator(selectedOperator).find(p => p.name === el.innerText);
        if (!preset) return;
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
    let combinedPresets = getCustomPresetsForOperator(selectedOperator);
    for (const p of combinedPresets) 
        p.element = Array.from(document.querySelectorAll("#presetList > button"))
            .find(x => x.textContent === p.name);
    for (const presetDefinition of getHardcodedPresetsForOperator(selectedOperator)) {
        combinedPresets.push({
            name: presetDefinition.name,
            description: presetDefinition.description ?? presetDefinition.name,
            facts: presetDefinition.facts,
            operator: presetDefinition.operator,
            element: Array.from(document.querySelectorAll("#presetButtons > button.hardcoded"))
                .find(x => x.textContent === presetDefinition.name)
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
    document.getElementById("startGame").disabled = selectedFacts.length === 0 || selectedFormat === "";
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
    document.getElementById("btnPlayAgain").focus();
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

    //Load existing highscores (operator-aware)
    let highscoreList = getHighscoresFromStorage();

    //Find or create set entry (match both name and operator)
    let setEntry = highscoreList.find(s => s.name === setName && s.operator === selectedOperator);
    if (setEntry == null) {
        setEntry = {
            name: setName,
            operator: selectedOperator,
            scores: defaultScores.slice()
        };
        highscoreList.push(setEntry);
    }

    //Insert new score at proper position
    let insertAt = setEntry.scores.length;
    for (let i = 0; i < insertAt; i++)
        if (setEntry.scores[i].score <= entry.score) { insertAt = i; break; }
    setEntry.scores.splice(insertAt, 0, entry);
    if (setEntry.scores.length > maxEntriesPerSet)
        setEntry.scores = setEntry.scores.slice(0, maxEntriesPerSet);
    
    //Update ranks
    for (let i = 0; i < setEntry.scores.length; i++)
        setEntry.scores[i].rank = i + 1;

    //Save back to localStorage (normalize before saving)
    saveHighscoresToStorage(highscoreList);
}

function getHighScoresForSet(setName, operator = selectedOperator) {
    const highscoreList = getHighscoresFromStorage();
    if (!highscoreList || highscoreList.length === 0) return defaultHighScores();
    const setEntry = highscoreList.find(s => s.name === setName && s.operator === operator);
    if (!setEntry) return defaultHighScores();
    return setEntry.scores;
}

function isHighScore(setName, score) {
    if (setName === "") return false;
    if (score < 2) return false;
    let highscoreList = getHighScoresForSet(setName);
    if (highscoreList.length < 10) return true;
    return score >= highscoreList[highscoreList.length - 1].score;
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
    const pNotice    = divHsGameOver.querySelector("#noset");
    const pNewHighScore = divHsGameOver.querySelector("p");
    const submitBtn = document.getElementById("btnEnter");
    const btns = document.getElementById("gameOverButtons");
    
    //Load existing highscores
    let highscoreList = getHighScoresForSet(selectedSetName);

    //Get score, determine if it's a high score, and if so, what rank
    const today = new Date().toLocaleDateString();
    const isHS = isHighScore(selectedSetName, score);
    const insertionIx = isHS ? highscoreList.findIndex(entry => entry.score <= score) : -1;
    const newRank = isHS ? (insertionIx === -1 ? highscoreList.length + 1 : insertionIx + 1) : 99;
    if (newRank <= 10) {
        //Insert new score into list for display purposes
        highscoreList.splice(newRank - 1, 0, {
            rank: newRank,
            initials: "",
            score: score,
            date: today
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
    olGameOver.style.display = "";
    pNotice.style.display = "none";

    //Show instructions
    h2GameOver.style.display = selectedSetName === "" ? "none" : "block";
    pNewHighScore.style.display = isHS ? "block" : "none";
    btns.style.display = isHS ? "none" : "inline-block";
    if (!isHS) {
        document.getElementById("gameOverButtons").style.display = "block";
        document.getElementById("btnPlayAgain").focus();
    }

    //Add listeners for initials input if needed
    if (isHS && newMarked) document.addEventListener("keydown", initialsInputKeyDown);

    //Prep submit button
    submitBtn.style.display = "";
    submitBtn.setAttribute("disabled", true);
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
    const btnEnter = document.getElementById("btnEnter");
    let val = inputEl.value;
    
    if (e.key === "Enter") {
        submitHighScore();
        document.removeEventListener("keydown", initialsInputKeyDown);
        newNameSparks();
        document.querySelector(".highscorelist li.new").classList.add("emphasize");
        document.querySelector(".highscorelist li.new").classList.add("full"); //For short names
        document.querySelector(".highscorelist li.kicked")?.classList.add("hidden");
        btnEnter.style.display = "none";
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
    if (val.length === 0) 
        btnEnter.setAttribute("disabled", true);
    else
        btnEnter.removeAttribute("disabled");
}

function btnEnterSubmitInitials() {
    sendKeyPress('Enter', false);
    document.getElementById("btnEnter").style.display = "none";
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
    osk.toggleMode();
    start();
}

function viewHighScoresMainMenu() {
    if (selectedSetName === "") return; //Should not be possible; populate() requires this
    document.getElementById("highScoresMainMenu").style.display = "block";
    document.getElementById("gameTitle").style.display = "none";
    score = 0; //Without this, function below will allow insertion of a new (dup) high score
    populateHighScoresUI();
}

function returnToMainMenuFromHighScores() {
    document.getElementById("gameTitle").style.display = "block";
    document.getElementById("highScoresMainMenu").style.display = "none";
}

function returnToMainMenuFromGameOver() {
    document.getElementById("gameTitle").style.display = "block";
    document.getElementById("gameOver").style.display = "none";
    let music = document.getElementById("gameMusic");
    music.pause();
    music.currentTime = 0;
    document.querySelectorAll("#gameContainer .vader").forEach(v => v.remove()); //Clear vaders
    tintBackground(); 
    score = 0; //Resets background multis to a calm state
    osk.setState(osk.isOn, true);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

function onScreenKeyboardClick(event) {
    const button = event.target;
    const key = button.getAttribute("data-key");
    switch (key) {
        case "l": //That's an "L", not a one
            sendKeyPress("ArrowLeft");
            break;
        case "r":
            sendKeyPress("ArrowRight");
            break;
        case "d":
            sendKeyPress("Backspace");
            break;
        case "e":
            sendKeyPress("Enter");
            break;
        case " ":
            sendKeyPress(" ");
            break;
        case "q":
            sendKeyPress("Escape");
            break;
        case "~":
            sendKeyPress("`");
            break;
        default: //Digits
            const digit = parseInt(key);
            if (!isNaN(digit)) sendKeyPress(digit.toString());
            break;
    }
}

function onScreenKeyboardAlphaClick(event) {
    const button = event.target;
    const key = button.getAttribute("data-key");
    switch (key) {
        case "2":
            sendKeyPress("Enter", false);
            break;
        case "3":
            sendKeyPress("Backspace", false);
            break;
        case " ":
            sendKeyPress(" ", false);
            break;
        default: //Letters
            sendKeyPress(key, false);
            break;
    }
}

//This class manages the score animation in the top-left
class ScoreShiftManager {
    constructor(rankElement, scoreElement, highscores, initialScore = 0) {
        this.rankEl = rankElement;       //DOM element for the animation/display, #liveOldScore
        this.scoreEl = scoreElement;     //Static element that just displays the score
        this.highscores = highscores;    //From LocalStorage
        this.queue = [];                 //Queue holding score checkpoints for sequential shifting
        this.isProcessing = false;       //Lock during the 2-second window
        this.lastScore = initialScore;   //Tracks the player's score before the latest update
        this.currentScoreIndex = this.findCurrentScoreIndex(initialScore);

        //Track current display state
        this.currentBeaten = null;
        this.currentGoal = null;
        this.currentNextGoal = null;

        //Initialize the DOM
        this.rankEl.classList.add("primed");
        this.updateDisplayValues(this.calculateRelativePositions(this.lastScore));
        this.updateCurScore();
    }

    findCurrentScoreIndex(score) {
        //Walk from the front of the descending leaderboard until we hit the first score at or below
        //the current score. That gives the exact insertion point and keeps the queue anchored to the
        //next threshold to be crossed, including repeated values like three 9s.
        let index = 0;
        while (index < this.highscores.length && this.highscores[index].score > score)
            index += 1;
        return index;
    }

    /**
     * Call this whenever the player's score changes. 
     * It calculates all high score thresholds crossed and queues shifts accordingly.
     * @param {number} newScore - The player's updated score
     */
    updateScore(newScore) {
        if (newScore <= this.lastScore) {
            this.lastScore = newScore;
            this.currentScoreIndex = this.findCurrentScoreIndex(newScore);
            this.updateCurScore();
            return;
        }

        //Queue every threshold the player crossed. Because the leaderboard is descending, the index
        //moves toward the front of the array as the score increases, which preserves each duplicate
        //threshold separately (for example, each 9 in [16, 9, 9, 9, 6, 3]).
        while (this.currentScoreIndex > 0 && this.highscores[this.currentScoreIndex - 1].score <= newScore) {
            const targetIndex = this.currentScoreIndex - 1;
            this.queue.push({
                targetScore: newScore,
                targetIndex
            });
            this.currentScoreIndex = targetIndex;
        }

        this.lastScore = newScore;
        this.updateCurScore();

        if (!this.isProcessing) this.processQueue();
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const shiftTask = this.queue.shift();

        //TRIGGER SHIFT: Remove "primed" class to start exit/shift animation
        this.rankEl.classList.remove("primed");

        //Calculate relative positions based on the exact threshold crossed so duplicate values
        //can advance sequentially instead of collapsing into a single "same score" result.
        const newPositions = this.calculateRelativePositions(
            shiftTask.targetScore,
            shiftTask.targetIndex
        );

        //WAIT UNTIL SHIFT ANIMATION COMPLETES: Block updates and shifts during this window
        await new Promise(resolve => setTimeout(resolve, 1500));

        //UPDATE VALUES: Update display data after the delay
        this.updateDisplayValues(newPositions);

        //RESET PRIMED: Add "primed" class back for resting/active state
        this.rankEl.classList.add("primed");

        //WAIT A BIT MORE: for screen to redraw the class added back in
        await new Promise(resolve => setTimeout(resolve, 500));

        //CONTINUE QUEUE: Process next shift if any remain
        this.processQueue();
    }

    calculateRelativePositions(score, targetIndex = null) {
        //When we know the exact threshold index being crossed, use it. This preserves the distinct
        //duplicate entries (three 9s all count as separate steps in the queue).
        if (targetIndex != null && targetIndex >= 0 && targetIndex < this.highscores.length) {
            const beaten = this.highscores[targetIndex] ?? null;
            const goal = targetIndex > 0 ? this.highscores[targetIndex - 1] : null;
            const nextGoal = targetIndex > 1 ? this.highscores[targetIndex - 2] : null;
            return { beaten, goal, nextGoal };
        }

        // Fallback for a generic call without a queued target index.
        let beaten = null;
        let goal = null;
        let nextGoal = null;

        if (score > 0) {
            const beatenCandidates = this.highscores
                .filter(entry => entry.score <= score)
                .sort((a, b) => b.score - a.score);
            beaten = beatenCandidates[0] ?? null;
        }

        const higherScores = this.highscores
            .filter(entry => entry.score > score)
            .sort((a, b) => a.score - b.score);

        if (higherScores.length > 0) {
            goal = higherScores[0];
            if (higherScores.length > 1) nextGoal = higherScores[1];
        }

        return { beaten, goal, nextGoal };
    }

    updateCurScore() {
        this.scoreEl.children[0].children[0].children[2].textContent = this.lastScore;
    }

    updateDisplayValues({ beaten, goal, nextGoal }) {
        this.currentBeaten = beaten;
        this.currentGoal = goal;
        this.currentNextGoal = nextGoal;

        const populateDl = function(el, scoreObj) {
            el.children[0].innerHTML = scoreObj === null ? "&nbsp;" : ordinal(scoreObj.rank);
            el.children[1].innerHTML = scoreObj?.initials ?? "&nbsp;";
            el.children[2].innerHTML = scoreObj?.score ?? "&nbsp;";
            el.children[3].innerHTML = scoreObj?.date ?? "&nbsp;";
        };

        this.updateCurScore();
        populateDl(this.rankEl.children[0].children[0], nextGoal);
        populateDl(this.rankEl.children[1].children[0], goal);
        populateDl(this.rankEl.children[2].children[0], beaten);
    }

    showRank() { this.rankEl.style.display = ""; }

    hideRank() { this.rankEl.style.display = "none"; }
}

function putSelectedOperatorInUrl() {
    var refresh = window.location.protocol + "//" + window.location.host + window.location.pathname + "?op=" + selectedOperator;
    window.history.pushState({ path: refresh }, '', refresh);
}