const ISSUE_STORAGE_KEY = "editableIssues";
let editableIssues = loadIssues();
let compiledEntries = {}; // grouped by date

function loadIssues() {
    const saved = localStorage.getItem(ISSUE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...issueData];
}
let selectedIssues = [];

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

    const newIssues = selectedIssues.map(item =>
        `-${item.label}${item.link ? ` (${item.link})` : ""}`
    );

    if (!compiledEntries[sceneDate]) {
        compiledEntries[sceneDate] = [];
    }

    // 🔍 find existing scene
    const existingIndex = compiledEntries[sceneDate].findIndex(
        block => block.startsWith(sceneCode + "\n")
    );

    if (existingIndex !== -1) {
        // update existing scene
        const lines = compiledEntries[sceneDate][existingIndex].split("\n");
        const existingIssues = new Set(lines.slice(1));

        newIssues.forEach(issue => existingIssues.add(issue));

        compiledEntries[sceneDate][existingIndex] =
`${sceneCode}
${[...existingIssues].join("\n")}`;
    } else {
        // ➕ new scene
        compiledEntries[sceneDate].push(
`${sceneCode}
${newIssues.length ? newIssues.join("\n") : "No issues selected."}`
        );
    }

    renderCompiledOutput();

    // show latest update
    document.getElementById("output").textContent =
`${sceneDate}
${compiledEntries[sceneDate].find(b => b.startsWith(sceneCode))}`;

    // auto-copy compiled
    navigator.clipboard.writeText(
        document.getElementById("compiledOutput").textContent
    ).then(() => {
        document.getElementById("copyStatus").textContent =
            "Compiled output updated & copied";
    });
}

// compile renderer
function renderCompiledOutput() {
    const output = [];

Object.keys(compiledEntries)
.sort((a, b) => {
    const [am, ad, ay] = a.split("-").map(Number);
    const [bm, bd, by] = b.split("-").map(Number);
    return new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd);
})
.forEach(date => {
        output.push(
`${date}
----------------
${compiledEntries[date].join("\n\n")}
`);
        output.push("================");
    });

    document.getElementById("compiledOutput").textContent =
        output.join("\n\n");
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
    if (!value) return;

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
}

// save function
function saveIssues() {
    localStorage.setItem(
        ISSUE_STORAGE_KEY,
        JSON.stringify(editableIssues)
    );
}

function clearAll() {
    document.getElementById("sceneCode").value = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("output").textContent = "";
    document.getElementById("compiledOutput").textContent = "";
    document.getElementById("copyStatus").textContent = "";

    document.getElementById("sceneDate").value =
        new Date().toISOString().split("T")[0];

    selectedIssues = [];
    compiledEntries = {};

    renderSelected();
}
document.addEventListener("DOMContentLoaded", () => {
    renderIssueManager();
    renderCompiledOutput();

    document.getElementById("sceneDate").value =
        new Date().toISOString().split("T")[0];
});
