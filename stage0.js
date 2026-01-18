const STAGE0_KEY = "qa_stage0_scenes";
let stage0Scenes = loadStage0();

function loadStage0() {
    const saved = localStorage.getItem(STAGE0_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveStage0() {
    localStorage.setItem("lastActivityTimestamp", new Date().getTime().toString());
    localStorage.setItem(STAGE0_KEY, JSON.stringify(stage0Scenes));
    if (typeof updateWorkflowUI === 'function') updateWorkflowUI();
}

function stage0AddBulk() {
    const dateInput = document.getElementById("bulkStage0Date").value;
    const rawCodes = document.getElementById("stage0Input").value.trim();

    if (!dateInput) { alert("Please select a date first!"); return; }
    if (!rawCodes) return;

    const formattedDate = formatDateMMDDYYYY(dateInput); 
    const codes = rawCodes.split("\n");

    codes.forEach(code => {
        const trimmed = code.trim();
        if (trimmed) {
            stage0Scenes[trimmed] = {
                date: formattedDate,
                hasTrailer: false,
                processed: false 
            };
        }
    });

    document.getElementById("stage0Input").value = "";
    saveStage0(); 
    renderStage0();
}

function renderStage0() {
    const container = document.getElementById("stage0List");
    if (!container) return;
    container.innerHTML = "";

    const grouped = {};
    Object.entries(stage0Scenes).forEach(([code, data]) => {
        if (!grouped[data.date]) grouped[data.date] = [];
        grouped[data.date].push({ code, ...data });
    });

    Object.keys(grouped).forEach(date => {
        const div = document.createElement("div");
        div.className = "stage0-group";
        div.innerHTML = `<h4>📅 ${date}</h4>`;
        
        const ul = document.createElement("ul");
        ul.style.listStyle = "none";
        ul.style.padding = "0"; 

        grouped[date].forEach(item => {
            const li = document.createElement("li");
            li.className = "stage0-item";

            li.innerHTML = `
                <strong style="font-size: 1.1em;">${item.code}</strong>

                <div class="stage0-controls">
                    <label class="checkbox-label">
                        <input type="checkbox" ${item.hasTrailer ? 'checked' : ''} 
                               onchange="stage0SetTrailer('${item.code}', this.checked)"
                               style="margin-right: 5px; transform: scale(1.2);">
                        Has Trailer
                    </label>

                    <button onclick="deleteFromIntake('${item.code}')" 
                            title="Remove Scene"
                            class="btn-danger">
                        ✕
                    </button>
                </div>
            `;
            ul.appendChild(li);
        });
        div.appendChild(ul);
        container.appendChild(div);
    });
}

function deleteFromIntake(code) {
    delete stage0Scenes[code];
    saveStage0();
    renderStage0();
}
function stage0SetTrailer(code, checked) {
    stage0Scenes[code].hasTrailer = checked;
    saveStage0();
}