let selectedIssues = [];

function filterIssues() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const results = document.getElementById("searchResults");

    results.innerHTML = "";

    if (!query) return;

    issueData
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

function clearAll() {
    document.getElementById("sceneCode").value = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("output").textContent = "";
    document.getElementById("copyStatus").textContent = "";
    selectedIssues = [];
    renderSelected();
}
