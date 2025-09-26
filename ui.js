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
                updateClearButton();
                //Select the commutative one (if not a square)
                const commutativeButton = document.querySelector(`button[data-fact-a="${j}"][data-fact-b="${i}"]`);
                if (commutativeButton && i !== j) commutativeButton.classList.toggle("selected");
            });
            gridContainer.appendChild(button);
        }
    updateClearButton();
    refreshCustomPresetButtons();
});

function preset(set) {
    //For loading hardcoded presets ("Set A")
    const buttons = document.querySelectorAll('.grid button');
    const presetKey = String.fromCharCode(64 + set); // Convert 1 -> 'A', 2 -> 'B', etc.
    const selectedPreset = presets[presetKey];
    if (selectedPreset) {
        for (const f of selectedPreset) {
            const button = document.querySelector(`button[data-fact-a="${f[0]}"][data-fact-b="${f[1]}"]`);
            if (button) button.classList.add('selected');
        }
    }
    updateClearButton();
}

function presetCustom(btn) {
    if (btn.classList.contains("delete")) {
        //Delete this preset
        let presetName = btn.innerText;
        let presetList = JSON.parse(localStorage.getItem("presets"));
        presetList = presetList.filter(p => p.name !== presetName);
        localStorage.setItem("presets", JSON.stringify(presetList));
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
        updateClearButton();
    }
}

function clearSelection() {
    document.querySelectorAll(".grid button").forEach(b => b.classList.remove("selected"));
    updateClearButton();
}

function updateClearButton() {
    let noFactsSeleted = document.querySelectorAll('.grid button.selected').length === 0;
    document.getElementById("btnClear").disabled = noFactsSeleted;
    document.getElementById("btnClear").title = noFactsSeleted 
        ? "No  facts to clear." 
        : "Clear all selected multiplication facts.";
    document.getElementById("btnMakePreset").disabled = noFactsSeleted;
    document.getElementById("btnMakePreset").title = noFactsSeleted 
        ? "Select at least one multiplication fact to create a preset." 
        : "Create a custom preset from the selected multiplication facts.";
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
        ])
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
