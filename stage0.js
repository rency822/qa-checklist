const STAGE0_KEY = "qa_stage0_scenes";

let stage0Scenes = loadStage0();

function loadStage0() {
    const saved = localStorage.getItem(STAGE0_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveStage0() {
    localStorage.setItem(
        STAGE0_KEY,
        JSON.stringify(stage0Scenes)

        
    );
    updateStageVisibility();

}

// New function to handle the bulk addition
// Function to add scenes using the primary date picker
function stage0AddBulk() {
    const dateInput = document.getElementById("bulkStage0Date").value;
    const rawCodes = document.getElementById("stage0Input").value.trim();

    if (!dateInput) {
        alert("Please select a date first!");
        return;
    }
    if (!rawCodes) return;

    const formattedDate = formatDateMMDDYYYY(dateInput); 
    const codes = rawCodes.split("\n");

    codes.forEach(code => {
        const trimmed = code.trim();
        if (trimmed) {
            stage0Scenes[trimmed] = {
                date: formattedDate, // Date is saved here once
                hasTrailer: false
            };
        }
    });

    document.getElementById("stage0Input").value = "";
    saveStage0(); 
    renderStage0();
}

// Updated renderer: No more individual date pickers
function renderStage0() {
    const list = document.getElementById("stage0List");
    list.innerHTML = "";

    // 1. Group the data by date
    const grouped = {};
    Object.entries(stage0Scenes).forEach(([code, data]) => {
        if (!grouped[data.date]) grouped[data.date] = [];
        grouped[data.date].push({ code, ...data });
    });

    // 2. Render each group with a single header
    Object.keys(grouped).forEach(date => {
        const groupSection = document.createElement("div");
        groupSection.style.marginBottom = "15px";

        // Create the Date Header
        const header = document.createElement("div");
        header.style.cssText = "background:#ddd; padding:5px; font-weight:bold; border-radius:3px;";
        header.textContent = `📅 Date: ${date}`;
        groupSection.appendChild(header);

        // Create the list of scenes for this date
        const ul = document.createElement("ul");
        ul.style.listStyle = "none";
        ul.style.padding = "5px 0 0 10px";

        grouped[date].forEach(item => {
            const li = document.createElement("li");
            li.style.marginBottom = "8px";
            li.innerHTML = `
                <strong>${item.code}</strong> 
                <label style="margin-left:15px; font-size:0.9em;">
                    <input type="checkbox" ${item.hasTrailer ? "checked" : ""} 
                           onchange="stage0SetTrailer('${item.code}', this.checked)"> 
                    Has Trailer
                </label>
                <button onclick="deleteFromIntake('${item.code}')" style="margin-left:10px; color:red; border:none; background:none; cursor:pointer;">✕</button>
            `;
            ul.appendChild(li);
        });

        groupSection.appendChild(ul);
        list.appendChild(groupSection);
    });
}

// Simple delete function
function deleteFromIntake(code) {
    if(confirm(`Remove ${code}?`)) {
        delete stage0Scenes[code];
        saveStage0();
        renderStage0();
    }
}
// Added helper to remove items if you make a mistake
function deleteFromIntake(code) {
    if(confirm(`Remove ${code}?`)) {
        delete stage0Scenes[code];
        saveStage0();
        renderStage0();
    }
}

function renderStage0() {
    const list = document.getElementById("stage0List");
    list.innerHTML = "";

    // Grouping logic for the UI
    const grouped = {};
    Object.entries(stage0Scenes).forEach(([code, data]) => {
        const dateKey = data.date || "No Date Assigned";
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push({ code, ...data });
    });

    Object.keys(grouped).forEach(date => {
        const groupContainer = document.createElement("div");
        groupContainer.style.marginBottom = "15px";

        const header = document.createElement("div");
        header.style.cssText = "background:#eee; padding:5px 10px; font-weight:bold; border-radius:3px;";
        header.innerHTML = `📅 Date: ${date}`;
        groupContainer.appendChild(header);

        const ul = document.createElement("ul");
        ul.style.listStyle = "none";
        ul.style.paddingLeft = "10px";

        grouped[date].forEach(item => {
            const li = document.createElement("li");
            li.style.margin = "8px 0";
            
            li.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <strong style="font-family: monospace; min-width: 200px;">${item.code}</strong>
                    
                    <label style="margin-left: 15px; cursor: pointer; font-size: 0.9em; display: flex; align-items: center;">
                        <input type="checkbox" 
                               ${item.hasTrailer ? "checked" : ""} 
                               onchange="stage0SetTrailer('${item.code}', this.checked)"
                               style="margin-right: 4px;">
                        Has Trailer
                    </label>

                    <button onclick="loadSceneToQA('${item.code}')" 
                            style="margin-left: 20px; padding: 2px 10px; cursor: pointer; background: #2b7cff; color: white; border: none; border-radius: 3px;">
                        Start QA
                    </button>

                    <button onclick="deleteFromIntake('${item.code}')" 
                            style="margin-left: 10px; color: red; background: none; border: none; cursor: pointer;">
                        ✕
                    </button>
                </div>
            `;
            ul.appendChild(li);
        });

        groupContainer.appendChild(ul);
        list.appendChild(groupContainer);
    });
}
// Add this if missing to support the ✕ button
function deleteFromIntake(code) {
    if(confirm(`Remove ${code}?`)) {
        delete stage0Scenes[code];
        saveStage0();
        renderStage0();
    }
}

function stage0SetDate(code, value) {
    stage0Scenes[code].date = formatDateMMDDYYYY(value);
    saveStage0();
    updateStageVisibility();    
}

function stage0SetTrailer(code, checked) {
    stage0Scenes[code].hasTrailer = checked;
    saveStage0();

    updateStageVisibility();

}

function isStage0Complete() {
    const scenes = Object.values(stage0Scenes);
    if (scenes.length === 0) return false;

    return scenes.every(scene => scene.date);
}
