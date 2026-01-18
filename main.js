const ISSUE_STORAGE_KEY = "editableIssues";
let editableIssues = loadIssues();
let compiledEntries = loadCompiled();
let activeType = "SCENES";
let selectedIssues = []; 

// --- INITIALIZATION ---

function loadIssues() {
    const saved = localStorage.getItem(ISSUE_STORAGE_KEY);
    // Uses issueData from checkboxData.js if local storage is empty
    return saved ? JSON.parse(saved) : (typeof issueData !== 'undefined' ? [...issueData] : []);
}

function loadCompiled() {
    const saved = localStorage.getItem("compiledEntries");
    const data = saved ? JSON.parse(saved) : {};
    return {
        SCENES: data.SCENES || {},
        TRAILER: data.TRAILER || {}
    };
}

// --- QA LOGIC & STATE MANAGEMENT ---

function selectForQA(code, data) {
    const activeDisplay = document.getElementById("activeCodeDisplay");
    if (activeDisplay) {
        activeDisplay.textContent = code;
        activeDisplay.style.color = ""; 
    }

    const codeInput = document.getElementById("sceneCode");
    const dateInput = document.getElementById("sceneDate");
    
    if (codeInput) codeInput.value = code;
    
    if (dateInput && data.date && data.date.includes("-")) {
        const [m, d, y] = data.date.split("-");
        dateInput.value = `${y}-${m}-${d}`;
    }
    
    selectedIssues = [];
    renderSelected();
    updateGenerateButton();
    renderCompiledOutput();
}

function updateGenerateButton() {
    const btn = document.getElementById("generateBtn");
    if (btn) btn.disabled = !selectedIssues || selectedIssues.length === 0;
}

// --- ISSUE SELECTION UI ---

function filterIssues() {
    const queryEl = document.getElementById("searchInput");
    const results = document.getElementById("searchResults");
    if (!queryEl || !results) return;

    const query = queryEl.value.toLowerCase();
    results.innerHTML = "";
    if (!query) return;

    editableIssues
        .filter(item => item.label.toLowerCase().includes(query))
        .forEach(item => {
            const li = document.createElement("li");
            li.textContent = item.label;
            li.style.cursor = "pointer";
            li.onclick = () => addIssue(item);
            results.appendChild(li);
        });
}

function addIssue(item) {
    if (selectedIssues.find(i => i.label === item.label)) return;
    selectedIssues.push({ ...item, link: "" });
    
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
    const results = document.getElementById("searchResults");
    if (results) results.innerHTML = "";

    renderSelected();
    updateGenerateButton();
}

function renderSelected() {
    const list = document.getElementById("selectedList");
    if (!list) return;
    list.innerHTML = "";

    selectedIssues.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "selected-item";
        li.innerHTML = `
            ${item.label}
            ${item.hasInput ? `
                <input type="text" placeholder="Link Code" value="${item.link || ''}" 
                       oninput="updateLink(${index}, this.value)">
            ` : ""}
            <span class="btn-link" onclick="removeIssue(${index})">✕</span>
        `;
        list.appendChild(li);
    });
}

function updateLink(index, value) { selectedIssues[index].link = value; }
function removeIssue(index) { 
    selectedIssues.splice(index, 1); 
    renderSelected(); 
    updateGenerateButton(); 
}

// --- GENERATION & PERSISTENCE ---

function generateOutput() {
    const codeInput = document.getElementById("sceneCode");
    const dateInput = document.getElementById("sceneDate");
    
    if (!codeInput || !dateInput || !codeInput.value) {
        alert("Select a scene from the queue first!");
        return;
    }

    const sceneCode = codeInput.value.trim();
    const sceneDate = typeof formatDateMMDDYYYY === 'function' ? formatDateMMDDYYYY(dateInput.value) : dateInput.value;

    if (!compiledEntries[activeType]) compiledEntries[activeType] = {};
    if (!compiledEntries[activeType][sceneDate]) compiledEntries[activeType][sceneDate] = [];

    const newIssuesList = selectedIssues.map(item => `-${item.label}${item.link ? ` (${item.link})` : ""}`);
    const finalBlock = `${sceneCode}\n${newIssuesList.length ? newIssuesList.join("\n") : "-GOOD"}`;

    const existingIndex = compiledEntries[activeType][sceneDate].findIndex(
        block => block.startsWith(sceneCode + "\n") || block === sceneCode
    );

    if (existingIndex !== -1) {
        const lines = compiledEntries[activeType][sceneDate][existingIndex].split("\n");
        const existingIssues = new Set(lines.slice(1));
        newIssuesList.forEach(issue => existingIssues.add(issue));
        compiledEntries[activeType][sceneDate][existingIndex] = `${sceneCode}\n${[...existingIssues].join("\n")}`;
    } else {
        compiledEntries[activeType][sceneDate].push(finalBlock);
    }

    selectedIssues = []; 
    renderSelected();
    updateGenerateButton(); 
    
    const activeDisplay = document.getElementById("activeCodeDisplay");
    if (activeDisplay) activeDisplay.classList.add("text-success");

    saveCompiled();
    renderCompiledOutput();
}

function saveCompiled() { 
    localStorage.setItem("lastActivityTimestamp", new Date().getTime().toString());
    localStorage.setItem("compiledEntries", JSON.stringify(compiledEntries)); }

// --- ISSUE MANAGER (RESTORED SECTION) ---

function toggleIssueManager() {
    const section = document.getElementById("issueManagerSection");
    const btn = document.getElementById("toggleBtn");
    if (!section) return;

    if (section.classList.contains("hidden")) {
        section.classList.remove("hidden");
        btn.textContent = "Hide Manager";
        renderIssueManager();
    } else {
        section.classList.add("hidden");
        btn.textContent = "Show Manager";
    }
}

function renderIssueManager() {
    const container = document.getElementById("issueManager");
    if (!container) return;
    container.innerHTML = "";

    editableIssues.forEach((issue, index) => {
        const li = document.createElement("li");
        li.className = "manager-item"; 
        li.innerHTML = `
            <span>${issue.label}</span>
            <button onclick="deleteDatabaseIssue(${index})" class="btn-link">Delete</button>
        `;
        container.appendChild(li);
    });
}

function addNewIssue() {
    const input = document.getElementById("newIssueInput");
    if (!input || !input.value.trim()) return;

    const label = input.value.trim();
    if (editableIssues.some(i => i.label.toLowerCase() === label.toLowerCase())) {
        alert("Issue already exists!");
        return;
    }

    editableIssues.push({ label, hasInput: label.toLowerCase().includes("link") });
    localStorage.setItem(ISSUE_STORAGE_KEY, JSON.stringify(editableIssues));
    input.value = "";
    renderIssueManager();
}

function deleteDatabaseIssue(index) {
    if (confirm("Delete this issue from the database?")) {
        editableIssues.splice(index, 1);
        localStorage.setItem(ISSUE_STORAGE_KEY, JSON.stringify(editableIssues));
        renderIssueManager();
    }
}

function exportIssues() {
    const blob = new Blob([JSON.stringify(editableIssues, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "qa_issues_backup.json";
    a.click();
}

function importIssues(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                editableIssues = imported;
                localStorage.setItem(ISSUE_STORAGE_KEY, JSON.stringify(editableIssues));
                renderIssueManager();
                alert("Import successful!");
            }
        } catch (err) { alert("Invalid file format."); }
    };
    reader.readAsText(file);
}

// --- RENDERING TEXT AREAS ---

function renderCompiledOutput() {
    const stage = (typeof currentStage !== 'undefined') ? currentStage : 1;
    if (stage === 1 || stage === 2) {
        renderByType(activeType);
    } else {
        renderByType("SCENES");
        renderByType("TRAILER");
    }
}

function renderByType(type) {
    const textareaId = type === "SCENES" ? "compiledScenes" : "compiledTrailers";
    const el = document.getElementById(textareaId);
    
    if (!el) return; 

    const data = compiledEntries[type];

    // UPDATED: Explicitly sort by Year, then Month, then Day (Ascending)
    const sortedDates = Object.keys(data).sort((a, b) => {
        const [am, ad, ay] = a.split("-").map(Number);
        const [bm, bd, by] = b.split("-").map(Number);
        
        if (ay !== by) return ay - by; // Lower year first
        if (am !== bm) return am - bm; // Lower month first
        return ad - bd;               // Lower day first
    });

    let fullText = "";
    sortedDates.forEach(date => {
        fullText += date + "\n" + "---" + "\n";
        data[date].forEach(block => {
            fullText += block + "\n\n";
        });
        fullText += "===\n\n";
    });

    el.value = fullText.trim();
}

// --- UTILS & EXPORT ---

function clearInputs() {
    const activeDisplay = document.getElementById("activeCodeDisplay");
    if (activeDisplay) {
        activeDisplay.textContent = "None";
        activeDisplay.classList.remove("text-success");
    }
    if (document.getElementById("sceneCode")) document.getElementById("sceneCode").value = "";
    if (document.getElementById("searchInput")) document.getElementById("searchInput").value = "";
    if (document.getElementById("searchResults")) document.getElementById("searchResults").innerHTML = "";
    
    selectedIssues = [];
    renderSelected();
    updateGenerateButton(); 
}

function exportAllCompiled() {
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const title = prompt("Enter export title:", `Due for ${today}`);
    if (!title) return;

    let output = `${title}\n\n*SCENE*\n\n${buildExportBlock("SCENES")}\n\n\n\n*TRAILER*\n\n${buildExportBlock("TRAILER")}`;
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `QA_Report_${today.replace(/ /g, '_')}.txt`;
    a.click();
}

function buildExportBlock(type) {
    const data = compiledEntries[type] || {};
    let result = "";

    // Explicitly sort by Year, then Month, then Day (Ascending)
    Object.keys(data)
        .sort((a, b) => {
            const [am, ad, ay] = a.split("-").map(Number);
            const [bm, bd, by] = b.split("-").map(Number);
            
            if (ay !== by) return ay - by; // Lower year first
            if (am !== bm) return am - bm; // Lower month first
            return ad - bd;               // Lower day first
        })
        .forEach(date => {
            result += `${date}\n----------------\n${data[date].join("\n\n")}\n\n================\n\n`;
        });

    return result.trimEnd();
}

// Function to sync manual edits from the Textarea back to LocalStorage
function syncManualEdits(type) {
    const textareaId = type === "SCENES" ? "compiledScenes" : "compiledTrailers";
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

    // Temporary storage to rebuild the object
    const updatedData = {};

    lines.forEach(line => {
        line = line.trim();

        // Detect Date Headers (MM-DD-YYYY)
        if (/^\d{2}-\d{2}-\d{4}$/.test(line)) {
            if (currentDate && currentBlocks.length) {
                updatedData[currentDate] = [...currentBlocks];
            }
            currentDate = line;
            currentBlocks = [];
            return;
        }

        // Ignore separators
        if (!line || line.startsWith("---") || line.startsWith("===")) return;

        // Detect Scene Code vs Issues
        if (!line.startsWith("-")) {
            currentBlocks.push(line);
        } else if (currentBlocks.length > 0) {
            // Append the issue to the last scene code block
            currentBlocks[currentBlocks.length - 1] += "\n" + line;
        }
    });

    // Push the final group
    if (currentDate && currentBlocks.length) {
        updatedData[currentDate] = [...currentBlocks];
    }

    // Update global state and save
    compiledEntries[type] = updatedData;
    saveCompiled();
}

document.addEventListener("DOMContentLoaded", () => {
    const wasCleared = checkDataExpiration();
    if (wasCleared) {
        if (typeof stage0Scenes !== 'undefined') stage0Scenes = {};
        compiledEntries = { SCENES: {}, TRAILER: {} };
    }
    renderCompiledOutput();
    updateGenerateButton();
    const dateInput = document.getElementById("sceneDate");
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split("T")[0];
    }
});