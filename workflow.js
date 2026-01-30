let currentStage = 0; 

function updateWorkflowUI() {
    const sections = document.querySelectorAll('.workflow-section');
    
    // Use the 'hidden' class to toggle visibility
    if(currentStage === 0) sections[0].classList.remove('hidden'); else sections[0].classList.add('hidden');
    if(currentStage === 1 || currentStage === 2) sections[1].classList.remove('hidden'); else sections[1].classList.add('hidden');
    if(currentStage === 3) sections[2].classList.remove('hidden'); else sections[2].classList.add('hidden');

    document.querySelectorAll('.step').forEach((s, idx) => {
        s.classList.toggle('active', idx === currentStage);
    });

    if (currentStage === 1 || currentStage === 2) {
        activeType = (currentStage === 1) ? "SCENES" : "TRAILER";
        const qaHeader = document.getElementById("qaHeader");
        if(qaHeader) qaHeader.textContent = `QA Mode: ${activeType}`;
        
        updateCompiledVisibility(); 
        renderQueue(); 
    }

    if (currentStage === 3) {
        updateCompiledVisibility();
        renderCompiledOutput();
    }
}

function updateCompiledVisibility() {
    const scenesBox = document.getElementById("compiledScenesSection");
    const trailersBox = document.getElementById("compiledTrailersSection");
    const qaSection = document.getElementById("qaSection");
    const exportSection = document.getElementById("exportSection");
    const exportActions = document.getElementById("exportActions");

    if (!scenesBox || !trailersBox) return;

    if (currentStage === 1) { 
        scenesBox.classList.remove("hidden");
        trailersBox.classList.add("hidden");
        const qaRightCol = qaSection.querySelector('.col-2');
        if (qaRightCol) qaRightCol.appendChild(scenesBox);
    } 
    else if (currentStage === 2) { 
        scenesBox.classList.add("hidden");
        trailersBox.classList.remove("hidden");
        const qaRightCol = qaSection.querySelector('.col-2');
        if (qaRightCol) qaRightCol.appendChild(trailersBox);
    } 
    else if (currentStage === 3) { 
        scenesBox.classList.remove("hidden");
        trailersBox.classList.remove("hidden");
        
        if (exportSection && exportActions) {
            exportSection.insertBefore(scenesBox, exportActions);
            exportSection.insertBefore(trailersBox, exportActions);
        } else if (exportSection) {
            exportSection.appendChild(scenesBox);
            exportSection.appendChild(trailersBox);
        }
    }
}

function nextStage() {
    if (currentStage === 0 && typeof stage0Scenes !== 'undefined' && Object.keys(stage0Scenes).length === 0) {
        alert("Add some scenes first!");
        return;
    }
    if (currentStage < 3) {
        currentStage++;
        updateWorkflowUI();
    }
}

function renderQueue() {
    const list = document.getElementById("queueList");
    if (!list) return;
    list.innerHTML = "";
    
    if (typeof stage0Scenes === 'undefined') return;

    Object.entries(stage0Scenes).forEach(([code, data]) => {
        
        if (currentStage === 1 && data.isTrailerOnly) return;

        if (currentStage === 2 && !data.hasTrailer && !data.isTrailerOnly) return;

        const btn = document.createElement("button");
        btn.className = "queue-item";
        
        const tag = data.isTrailerOnly ? '<span style="color:#FFA500; font-size:0.8em; float:right;">(Trailer Only)</span>' : '';
        
        btn.innerHTML = `<strong>${code}</strong> ${tag}<br><small>${data.date}</small>`;
        btn.onclick = () => selectForQA(code, data);
        list.appendChild(btn);
    });
}

function selectForQA(code, data) {
    if (typeof activeType !== 'undefined') syncManualEdits(activeType);

    const activeDisplay = document.getElementById("activeCodeDisplay");
    if (activeDisplay) {
        activeDisplay.textContent = code;
        activeDisplay.classList.remove("text-success"); // Clean CSS toggle
    }

    const codeInput = document.getElementById("sceneCode");
    const dateInput = document.getElementById("sceneDate");

    if (codeInput) codeInput.value = code;
    
    if (dateInput && data.date) {
        const parts = data.date.split("-");
        if (parts.length === 3) {
            document.getElementById("sceneDate").value = `${parts[2]}-${parts[0]}-${parts[1]}`;
        }
    }
    
    if (typeof selectedIssues !== 'undefined') {
        selectedIssues = [];
        if (typeof renderSelected === 'function') renderSelected();
        if (typeof updateGenerateButton === 'function') updateGenerateButton();
    }
    
    if (typeof renderCompiledOutput === 'function') renderCompiledOutput();
}

function restartWorkflow() {
    if(confirm("Clear all data and restart?")) {
        localStorage.clear();
        location.reload();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateWorkflowUI();
    if (typeof renderStage0 === 'function') renderStage0();
});