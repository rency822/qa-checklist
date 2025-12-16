function renderCheckboxes() {
    const container = document.getElementById("checkboxContainer");

    checkboxData.forEach(item => {
        const label = document.createElement("label");

        label.innerHTML = `
            <input type="checkbox" class="check-item" onchange="toggleInput(this)">
            ${item.label}
            ${item.hasInput ? `
                <input type="text"
                       class="extra-input"
                       placeholder="Link Code"
                       style="display:none;">
            ` : ""}
        `;

        container.appendChild(label);
        container.appendChild(document.createElement("br"));
    });
}

function toggleInput(checkbox) {
    const extraInput = checkbox.parentElement.querySelector(".extra-input");
    if (extraInput) {
        extraInput.style.display = checkbox.checked ? "inline-block" : "none";
        if (!checkbox.checked) extraInput.value = "";
    }
}

function generateOutput() {
    const sceneCode = document.getElementById("sceneCode").value.trim();
    const outputLines = [];

    document.querySelectorAll(".check-item").forEach(checkbox => {
        if (checkbox.checked) {
            let text = checkbox.parentElement.textContent.trim();

            const input = checkbox.parentElement.querySelector(".extra-input");
            if (input && input.value.trim()) {
                text += ` (${input.value.trim()})`;
            }

            outputLines.push(`-${text}`);
        }
    });

const result =`${sceneCode || "N/A"}
${outputLines.length ? outputLines.join("\n") : "No checklist items selected."}`;

  const outputEl = document.getElementById("output");
    outputEl.textContent = result;

    // ✅ AUTO COPY TO CLIPBOARD
    navigator.clipboard.writeText(result).then(() => {
        document.getElementById("copyStatus").textContent =
            "Output copied to clipboard";
    }).catch(() => {
        document.getElementById("copyStatus").textContent =
            "❌ Failed to copy";
    });
}
document.addEventListener("DOMContentLoaded", renderCheckboxes);

function clearAll() {
    // Clear scene code
    document.getElementById("sceneCode").value = "";

    // Clear checkboxes and inputs
    document.querySelectorAll(".check-item").forEach(checkbox => {
        checkbox.checked = false;

        const input = checkbox.parentElement.querySelector(".extra-input");
        if (input) {
            input.value = "";
            input.style.display = "none";
        }
    });

    // Clear output
    document.getElementById("output").textContent = "";

    // Clear copy status
    const status = document.getElementById("copyStatus");
    if (status) status.textContent = "";
}
