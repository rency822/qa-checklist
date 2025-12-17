const ISSUE_STORAGE_KEY = "editableIssues";
let editableIssues = loadIssues();

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

function generateOutput() {
    const sceneCode = document.getElementById("sceneCode").value.trim();

    const lines = selectedIssues.map(item =>
        `-${item.label}${item.link ? ` (${item.link})` : ""}`
    );

    const result =
`${sceneCode || "N/A"}
${lines.length ? lines.join("\n") : "No issues selected."}`;

    document.getElementById("output").textContent = result;

    navigator.clipboard.writeText(result).then(() => {
        document.getElementById("copyStatus").textContent =
            "Output copied to clipboard";
    });
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
    document.getElementById("copyStatus").textContent = "";
    selectedIssues = [];
    renderSelected();
}
document.addEventListener("DOMContentLoaded", () => {renderIssueManager();});
