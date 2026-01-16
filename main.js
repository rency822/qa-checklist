const ISSUE_STORAGE_KEY = "editableIssues";
let editableIssues = loadIssues();
let compiledEntries = loadCompiled();
let activeType = "SCENES";
let stage0EditMode = false;

function loadIssues() {
    const saved = localStorage.getItem(ISSUE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...issueData];
}

function loadCompiled() {
    const saved = localStorage.getItem("compiledEntries");
    const data = saved ? JSON.parse(saved) : {};

    return {
        SCENES: data.SCENES || {},
        TRAILER: data.TRAILER || {}
    };
}

function updateStageVisibility() {
    const qa = document.getElementById("qaSection");
    const toggle = document.getElementById("stageToggle");

    const complete = isStage0Complete();

    if (!complete || stage0EditMode) {
        qa.style.display = "none";
        toggle.checked = true;
    } else {
        qa.style.display = "block";
        toggle.checked = false;
    }
}

function loadSceneToQA(code) {
    const data = stage0Scenes[code];
    if (!data) return;

    // 1. Set the Scene Code
    document.getElementById("sceneCode").value = code;
    
    // 2. Set the Date (Convert MM-DD-YYYY back to YYYY-MM-DD for input)
    if (data.date) {
        const [m, d, y] = data.date.split("-");
        document.getElementById("sceneDate").value = `${y}-${m}-${d}`;
    }
    
    // 3. Set the Type based on Trailer checkbox
    setType(data.hasTrailer ? "TRAILER" : "SCENES");

    // 4. Close Intake mode to show QA section
    stage0EditMode = false;
    document.getElementById("stageToggle").checked = false;
    updateStageVisibility();
    
    // 5. Scroll up so you see the QA inputs
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Optional: Clear previous selected issues for the new scene
    selectedIssues = [];
    renderSelected();
    updateGenerateButton();
}

function toggleStageMode() {
    stage0EditMode = document.getElementById("stageToggle").checked;
    updateStageVisibility();
}


let selectedIssues = [];

function setType(type) {
    activeType = type;

    const scenes = document.getElementById("compiledScenesSection");
    const trailers = document.getElementById("compiledTrailersSection");

    scenes.style.display = type === "SCENES" ? "block" : "none";
    trailers.style.display = type === "TRAILER" ? "block" : "none";

    document.getElementById("sceneBtn").disabled = type === "SCENES";
    document.getElementById("trailerBtn").disabled = type === "TRAILER";

    renderCompiledOutput();
}


function updateGenerateButton() {
    const btn = document.getElementById("generateBtn");
    btn.disabled = selectedIssues.length === 0;
}

function filterIssues() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const results = document.getElementById("searchResults");

    results.innerHTML = "";

    if (!query) return;

    editableIssues
    .filter(item => item.label.toLowerCase().includes(query))
    .forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.label;
        li.className = "issue-item";
        li.onclick = () => addIssue(item);
        results.appendChild(li);
    });
}

function addIssue(item) {
    // prevent duplicates
    if (selectedIssues.find(i => i.label === item.label)) return;

    selectedIssues.push({ ...item, link: "" });
    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("searchInput").value = "";

    renderSelected();
    updateGenerateButton();
}

function renderSelected() {
    const list = document.getElementById("selectedList");
    list.innerHTML = "";

    selectedIssues.forEach((item, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            ${item.label}
            ${item.hasInput ? `
                <input type="text"
                       class="link-input"
                       placeholder="Link Code"
                       value="${item.link}"
                       oninput="updateLink(${index}, this.value)">
            ` : ""}
            <span class="remove-btn" onclick="removeIssue(${index})">X</span>
        `;

        list.appendChild(li);
    });
}

function updateLink(index, value) {
    selectedIssues[index].link = value;
}

function removeIssue(index) {
    selectedIssues.splice(index, 1);
    renderSelected();
    updateGenerateButton(); 
}

// date format1
function formatDateMMDDYYYY(dateValue) {
    if (!dateValue) return "No Date";

    const [year, month, day] = dateValue.split("-");
    return `${month}-${day}-${year}`;
}

// generate ouput
function generateOutput() {
    const sceneCode = document.getElementById("sceneCode").value.trim() || "N/A";
    const sceneDateRaw = document.getElementById("sceneDate").value;
    const sceneDate = formatDateMMDDYYYY(sceneDateRaw);

// 🔒 SAFETY INIT
if (!compiledEntries[activeType]) {
    compiledEntries[activeType] = {};
}

    const newIssues = selectedIssues.map(item =>
        `-${item.label}${item.link ? ` (${item.link})` : ""}`
    );

    if (!compiledEntries[activeType][sceneDate]) {
    compiledEntries[activeType][sceneDate] = [];
    }

    // 🔍 find existing scene
    const existingIndex = compiledEntries[activeType][sceneDate].findIndex(
        block => block.startsWith(sceneCode + "\n")
    );

    if (existingIndex !== -1) {
        // update existing scene
        const lines = compiledEntries[activeType][sceneDate][existingIndex].split("\n");
        const existingIssues = new Set(lines.slice(1));

        newIssues.forEach(issue => existingIssues.add(issue));

        compiledEntries[activeType][sceneDate][existingIndex] =
`${sceneCode}
${[...existingIssues].join("\n")}`;
    } else {
        // ➕ new scene
        compiledEntries[activeType][sceneDate].push(
`${sceneCode}
${newIssues.length ? newIssues.join("\n") : "No issues selected."}`
        );
    }

    renderCompiledOutput();
    saveCompiled();

    // show latest update
    document.getElementById("output").textContent =
`${sceneDate}
${compiledEntries[activeType][sceneDate].find(b => b.startsWith(sceneCode))}`;

}

// compile renderer
function renderCompiledOutput() {
    renderByType("SCENES", "compiledScenes");
    renderByType("TRAILER", "compiledTrailers");
}

function renderByType(type, textareaId) {
    const output = [];
    const data = compiledEntries[type] || {};

    Object.keys(data)
        .sort((a, b) => {
            const [am, ad, ay] = a.split("-").map(Number);
            const [bm, bd, by] = b.split("-").map(Number);
            return new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd);
        })
        .forEach(date => {
            output.push(
`${date}
----------------
${data[date].join("\n\n")}
`
            );
            output.push("================");
        });

    document.getElementById(textareaId).value = output.join("\n\n");
}


// issue manager
function renderIssueManager() {
    const list = document.getElementById("issueManager");
    list.innerHTML = "";

    editableIssues.forEach((item, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <input type="text"
                   value="${item.label}"
                   oninput="editIssue(${index}, this.value)">
            <button onclick="deleteIssue(${index})">Delete</button>
        `;

        list.appendChild(li);
    });
}

let issueManagerVisible = false;

function toggleIssueManager() {
    issueManagerVisible = !issueManagerVisible;

    const section = document.getElementById("issueManagerSection");
    const btn = document.getElementById("toggleBtn");

    section.style.display = issueManagerVisible ? "block" : "none";
    btn.textContent = issueManagerVisible ? "Hide" : "Show";

    // 🔑 Render full list when shown
    if (issueManagerVisible) {
        renderIssueManager();
    }
}

// add new Issue
function addNewIssue() {
    const input = document.getElementById("newIssueInput");
    const value = input.value.trim();

    if (!value) {
        alert("Please enter an issue name");
        return;
    }

    if (editableIssues.some(item => item.label === value)) {
        alert("This issue already exists");
        return;
    }

    editableIssues.push({ label: value, hasInput: true });
    input.value = "";

    saveIssues();
    renderIssueManager();
}

// edit issue
function editIssue(index, newLabel) {
    editableIssues[index].label = newLabel;
    saveIssues();
}

// delete issue
function deleteIssue(index) {
    const removed = editableIssues.splice(index, 1)[0];

    selectedIssues = selectedIssues.filter(
        item => item.label !== removed.label
    );

    saveIssues();
    renderIssueManager();
    renderSelected();
    updateGenerateButton();
}

// save function
function saveIssues() {
    localStorage.setItem(
        ISSUE_STORAGE_KEY,
        JSON.stringify(editableIssues)
    );
}

function saveCompiled() {
    localStorage.setItem(
        "compiledEntries",
        JSON.stringify(compiledEntries)
    );
}

// export issues to JSON
function exportIssues() {
    const data = JSON.stringify(editableIssues, null, 2);

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "issues-backup.json";
    a.click();

    URL.revokeObjectURL(url);
}

function importIssues(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
        try {
            const imported = JSON.parse(e.target.result);

            if (!Array.isArray(imported)) {
                alert("Invalid file format");
                return;
            }

            // validate structure
            const valid = imported.every(
                item => typeof item.label === "string"
            );

            if (!valid) {
                alert("Invalid issue data");
                return;
            }

            const replace = confirm(
                "Replace existing issues?\n\nOK = Replace\nCancel = Merge"
            );

            if (replace) {
                editableIssues = imported;
            } else {
                // merge (avoid duplicates)
                const existingLabels =
                    new Set(editableIssues.map(i => i.label));

                imported.forEach(item => {
                    if (!existingLabels.has(item.label)) {
                        editableIssues.push(item);
                    }
                });
            }

            saveIssues();
            renderIssueManager();
            filterIssues();

            alert("Issues imported successfully!");

        } catch (err) {
            alert("Failed to import file");
        }

        // reset input so same file can be reselected
        event.target.value = "";
    };

    reader.readAsText(file);
}

// copy compiled output
function copyCompiled(type) {
    const el = document.getElementById(
        type === "SCENES" ? "compiledScenes" : "compiledTrailers"
    );

    if (!el.value.trim()) return alert("Nothing to copy");

    navigator.clipboard.writeText(el.value);
}


function clearCompiled(type) {
    if (!confirm(`Clear all ${type} compiled output?`)) return;

    compiledEntries[type] = {};
    saveCompiled();
    renderCompiledOutput();
}


function clearInputs() {
    document.getElementById("sceneCode").value = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("output").textContent = "";
    document.getElementById("copyStatus").textContent = "";

    // ⛔ date is NOT touched

    selectedIssues = [];
    renderSelected();
    updateGenerateButton(); 
}

// export all compiled output
function exportAllCompiled() {

  const today = new Date();

const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
});

const title = prompt(
    "Enter export title:",
    `Due for ${formattedDate}`
);

if (!title) return;


    let output = `${title}\n\n`;

    // ---------- SCENES ----------
    output += "*SCENE*\n\n";
    output += buildExportBlock("SCENES");

    output += "\n\n \n\n";

    // ---------- TRAILER ----------
    output += "\n*TRAILER*\n\n";
    output += buildExportBlock("TRAILER");

    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "qa_compiled_export.txt";
    a.click();

    URL.revokeObjectURL(url);
}

function buildExportBlock(type) {
    const data = compiledEntries[type] || {};
    let result = "";

    Object.keys(data)
        .sort((a, b) => {
            const [am, ad, ay] = a.split("-").map(Number);
            const [bm, bd, by] = b.split("-").map(Number);
            return new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd);
        })
        .forEach(date => {
            result +=
`${date}
----------------
${data[date].join("\n\n")}

================

`;
        });

    return result.trimEnd();
}
let autoSaveTimer = null;

function autoSaveEdited(type) {
    clearTimeout(autoSaveTimer);

    autoSaveTimer = setTimeout(() => {
        mergeEditedCompiled(type);
    }, 500); // 0.5s debounce
}

function mergeEditedCompiled(type) {
    const textareaId =
        type === "SCENES" ? "compiledScenes" : "compiledTrailers";

    const el = document.getElementById(textareaId);
    if (!el) return;

    const raw = el.value.trim();
    if (!raw) {
        compiledEntries[type] = {};
        saveCompiled();
        return;
    }

    const lines = raw.split("\n");
    let currentDate = null;
    let currentBlocks = [];

    compiledEntries[type] = {};

    lines.forEach(line => {
        line = line.trim();

        // date header MM-DD-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(line)) {
            if (currentDate && currentBlocks.length) {
                compiledEntries[type][currentDate] = currentBlocks.slice();
            }
            currentDate = line;
            currentBlocks = [];
            return;
        }

        // ignore separators / empty
        if (
            !line ||
            line.startsWith("---") ||
            line.startsWith("===")
        ) return;

        // scene code
        if (!line.startsWith("-")) {
            currentBlocks.push(line);
        } else if (currentBlocks.length) {
            currentBlocks[currentBlocks.length - 1] += "\n" + line;
        }
    });

    if (currentDate && currentBlocks.length) {
        compiledEntries[type][currentDate] = currentBlocks.slice();
    }

    saveCompiled();
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof renderStage0 === "function") {
        renderStage0();
    }
    renderIssueManager();
    renderCompiledOutput();
    updateGenerateButton();
    updateStageVisibility();

    document.getElementById("sceneDate").value =
        new Date().toISOString().split("T")[0];
});
