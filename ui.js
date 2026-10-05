const Operator = Object.freeze({
    ADDITION: "ADDITION",
    SUBTRACTION: "SUBTRACTION",
    MULTIPLICATION: "MULTIPLICATION",
    DIVISION: "DIVISION"
});

const Format = Object.freeze({
    STACKED: "STACKED",
    INLINE: "INLINE", //E.g., "2 x 3 = _"
    BRACKET: "BRACKET", //Division-only, long-division style, e.g., "3 ) 6" with the quotient on top
    FRACTION: "FRACTION", //Division-only, a number above another with a line between, followed by equals, e.g., "6/3 = _"
    ALGEBRAIC: "ALGEBRAIC" //Division or subtraction, stacked, e.g., "6 = 3 x _" :: TODO, not fully thought-out yet
    //"6 = 4 + _" would also work for subtraction (for "6 - 4" problem)
});

const hardcodedPresets = [
    //ADDITION
    //These sets were constructed with a focus on conceptual understanding and strategies while keeping to four sets of similar sizes
    { name: "Set A", operator: Operator.ADDITION, facts: [ //Basic Concepts: Identity (+0), Successor (+1), and Skip Count (+2) - 57 facts
        [0,0], [1,0], [2,0], [3,0], [4,0], [5,0], [6,0], [7,0], [8,0], [9,0], [10,0], [11,0], [12,0],
        [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8], [0,9], [0,10], [0,11], [0,12],
        [1,1], [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1],
        [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], [1,8], [1,9], [1,10], [1,11], [1,12],
        [2,2], [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2],
        [2,3], [2,4], [2,5], [2,6], [2,7], [2,8], [2,9], [2,10], [2,11], [2,12]]
    },
    { name: "Set B", operator: Operator.ADDITION, facts: [ //Anchors & Relationships: Doubles, Near Doubles (+/- 1), and Friends of 10 - 32 facts
        //Doubles (excluding 0, 1, 2)
        [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [10,10], [11,11], [12,12],
        //Doubles Plus One (excluding pairs involving 0, 1, 2)
        [3,4], [4,3], [4,5], [5,4], [5,6], [6,5], [6,7], [7,6], [7,8], [8,7],
        [8,9], [9,8], [9,10], [10,9], [10,11], [11,10], [11,12], [12,11],
        //Friends of 10 (excluding 5+5 which is already in doubles, and pairs with 1, 2)
        [3,7], [7,3], [4,6], [6,4]]
    },
    { name: "Set C", operator: Operator.ADDITION, facts: [ //Base-10 Strategies: Make a 10 (+8, +9) and Place Value (+10, +11) - 42 facts
        //Make 10 (+9 and +8 facts not covered above)
        [9,3], [3,9], [9,4], [4,9], [9,5], [5,9], [9,6], [6,9], [9,7], [7,9],
        [8,3], [3,8], [8,4], [4,8], [8,5], [5,8], [8,6], [6,8],
        //Place Value Shifts (+10 and +11 facts not covered above)
        [10,3], [3,10], [10,4], [4,10], [10,5], [5,10], [10,6], [6,10], [10,7], [7,10], [10,8], [8,10],
        [11,3], [3,11], [11,4], [4,11], [11,5], [5,11], [11,6], [6,11], [11,7], [7,11], [11,8], [8,11], [11,9], [9,11]]
    },
    { name: "Set D", operator: Operator.ADDITION, facts: [ //Everything Else: Higher bridging & flexible decomposition strategies - 38 facts
        [3,5], [5,3], [3,6], [6,3], [4,7], [7,4], [3,12], [12,3], [4,12], [12,4], [5,7], [7,5], [5,12], [12,5], [6,12], [12,6],
        [7,8], [8,7], [7,12], [12,7], [8,9], [9,8], [8,12], [12,8], [9,12], [12,9], [10,12], [12,10], [11,12], [12,11]]
    },
    
    //SUBTRACTION
    //Format [minuend, subtrahend] (e.g., 6 - 4 = 2 is [6,4])
    { name: "Set A", operator: Operator.SUBTRACTION, facts: [ 
        [2,1], [3,1], [4,2]]
    },
    { name: "Set B", operator: Operator.SUBTRACTION, facts: [
        [4,2], [5,2], [6,3]]
    },
    { name: "Set C", operator: Operator.SUBTRACTION, facts: [
        [6,4], [7,3], [8,2]]
    },
    { name: "Set D", operator: Operator.SUBTRACTION, facts: [
        [8,4], [9,3], [10,2]]
    },
    { name: "Set E", operator: Operator.SUBTRACTION, facts: [
        [10,5], [11,4], [12,3]]
    },

    //MULTIPLICATION
    //From "Simply Good and Beautiful Math 3" curriculum. Set E is "everything else"
    { name: "Set A", operator: Operator.MULTIPLICATION, facts: [ 
        [3,3], [6,6], [5,3], [8,4], [8,8], [3,4], [5,5], [9,9], [6,4], [3,5], [4,8], [4,3], [4,6]]
    },
    { name: "Set B", operator: Operator.MULTIPLICATION, facts: [
        [4,4], [4,5], [7,3], [7,4], [8,5], [8,7], [9,3], [9,4], [9,5], [5,4], [3,7], [4,7], [5,8], [7,8], [3,9], [4,9], [5,9]]
    },
    { name: "Set C", operator: Operator.MULTIPLICATION, facts: [
        [5,6], [5,7], [6,3], [6,8], [7,6], [7,7], [7,9], [8,3], [9,6], [9,8], [6,5], [7,5], [3,6], [8,6], [6,7], [9,7], [3,8], [6,9], [8,9]]
    },
    { name: "Set D", operator: Operator.MULTIPLICATION, facts: [
        [12,3], [12,4], [12,5], [12,6], [12,7], [12,8], [12,9], [12,11], [12,12], [3,12], [4,12], [5,12], [6,12], [7,12], [8,12], [9,12], [11,12]]
    },
    { name: "Set E", operator: Operator.MULTIPLICATION, facts: [
        [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], [1,8], [1,9], [1,10], [1,11], [1,12], 
        [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1], 
        [2,2], [2,3], [2,4], [2,5], [2,6], [2,7], [2,8], [2,9], [2,10], [2,11], [2,12], 
        [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2], 
        [3,10], [4,10], [5,10], [6,10], [7,10], [8,10], [9,10], [10,10], [11,10], [12,10], 
        [10,3], [10,4], [10,5], [10,6], [10,7], [10,8], [10,9], [10,11], [10,12], 
        [11,3], [11,4], [11,5], [11,6], [11,7], [11,8], [11,9], [11,11], 
        [3,11], [4,11], [5,11], [6,11], [7,11], [8,11], [9,11], 
        [0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8], [0,9], [0,10], [0,11], [0,12], 
        [1,0], [2,0], [3,0], [4,0], [5,0], [6,0], [7,0], [8,0], [9,0], [10,0], [11,0], [12,0]]
    },

    //DIVISION
    //Transformed from the multiplication sets above. Format [dividend, divisor] (e.g., 6 / 3 = 2 is [6,3])
    { name: "Set A", operator: Operator.DIVISION, facts: [ 
        [9,3], [36,6], [15,3], [32,4], [64,8], [12,4], [25,5], [81,9], [24,4], [15,5], [32,8], [12,3], [24,6]]
    },
    { name: "Set B", operator: Operator.DIVISION, facts: [
        [16,4], [20,5], [21,3], [28,4], [40,5], [56,7], [27,3], [36,4], [45,5], [20,4], [21,7], [28,7], [40,8], [56,8], [27,9], [36,9], [45,9]]
    },
    { name: "Set C", operator: Operator.DIVISION, facts: [
        [30,6], [35,7], [18,3], [48,8], [42,6], [49,7], [63,9], [24,3], [54,6], [72,8], [30,5], [35,5], [18,6], [48,6], [42,7], [63,7], [24,8], [54,9], [72,9]]
    },
    { name: "Set D", operator: Operator.DIVISION, facts: [
        [36,3], [48,4], [60,5], [72,6], [84,7], [96,8], [108,9], [132,11], [144,12], [36,12], [48,12], [60,12], [72,12], [84,12], [96,12], [108,12], [132,12]]
    },
    { name: "Set E", operator: Operator.DIVISION, facts: [
        [1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [10,10], [11,11], [12,12], 
        [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1], 
        [4,2], [6,3], [8,4], [10,5], [12,6], [14,7], [16,8], [18,9], [20,10], [22,11], [24,12], 
        [6,2], [8,2], [10,2], [12,2], [14,2], [16,2], [18,2], [20,2], [22,2], [24,2], 
        [30,10], [40,10], [50,10], [60,10], [70,10], [80,10], [90,10], [100,10], [110,10], [120,10], 
        [30,3], [40,4], [50,5], [60,6], [70,7], [80,8], [90,9], [110,11], [120,12], 
        [33,3], [44,4], [55,5], [66,6], [77,7], [88,8], [99,9], [121,11], 
        [33,11], [44,11], [55,11], [66,11], [77,11], [88,11], [99,11], 
        [0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8], [0,9], [0,10], [0,11], [0,12], 
        [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0]]
    }
];

let selectedOperator = Operator.MULTIPLICATION;
let selectedOperatorRandom = false;
let selectedFormat = "";
let selectedFormatRandom = false;
let selectedProblems = [];
let selectedSetName = "";
const defaultInitials = "\u2013\u2013\u2013"; //EN DASH x3
let menuLoopInterval = null;

window.addEventListener("load", function() {
    if (window.location.protocol === "file:")
        setTimeout(() => console.clear(), 1000); //Helps with debugging; don't care about all the GET 200s
});

window.addEventListener("keydown", function(e) {
    //Global listener for consistency
    if (e.key === "F11") {
        toggleFullscreen();
        e.preventDefault(); //Don't undo toggle
    }
});

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

    funnyMessage(); //For mobile notice
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
    selectedOperator = Operator[operator];
    document.getElementById("titleSelectOperator").style.display = "none";
    updateFormatOptionVisibility();
    document.getElementById("gameTitle").style.display = "block";
    generateFactsGrid();
    document.getElementById("opDisplay").textContent = operator.toLowerCase();

    //Draw the background for game
    const bgSymbol = function() {
        switch (selectedOperator) {
            case Operator.ADDITION: return "+";
            case Operator.SUBTRACTION: return "-";
            case Operator.MULTIPLICATION: return "&#215;";
            case Operator.DIVISION: return "&#247";
            default: return "?";
        }
    };

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

    //Add new score    
    setEntry.scores.push(entry);

    //Sort and trim
    setEntry.scores.sort((a, b) => b.score - a.score);
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

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

function enableOnScreenKeyboard() {
    var osk = document.getElementById("inputTable");
    if (osk.style.display === "none") {
        osk.style.display = "";
        setTimeout(() => {
            osk.classList.remove("hidden");
        }, 200);
    } else {
        osk.style.display = "none";
    }
}

function toggleOnScreenKeyboard() {
    const keyboard = document.getElementById("inputTable");
    keyboard.classList.toggle("hidden");
}

function onScreenKeyboardClick(event) {
    const button = event.target;
    const key = button.getAttribute("data-key");
    switch (key) {
        case "l":
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
        case "x": //Show-hide
            toggleOnScreenKeyboard();
            break;
        case " ":
            sendKeyPress(" ");
            break;
        case "q":
            sendKeyPress("Escape");
            break;
        default: //Digits
            const digit = parseInt(key);
            if (!isNaN(digit)) sendKeyPress(digit.toString());
            break;
    }
}

function funnyMessage() {
    //Moved text here so it's not indexed by search engines
    document.querySelector("#mobileNotice p.small.tiny").innerHTML = 
        "Best viewed in Netscape Navigator 4.x<br>"
        + "on a monitor that supports 800x600 with 256 colors.<br>"
        + "Sign my <u>guestbook</u>. This page viewed <b>17</b> times.<br>"
        + "Hosted by <u>GeoCities</u>.<br>"
        + "&copy; 1997</b>";
}