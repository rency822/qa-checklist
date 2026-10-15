const STAGE0_KEY = "qa_stage0_scenes";
let stage0Scenes = loadStage0();

// Sheet column positions (0-based): A=0, B=1, C=2 ... P=15, R=17
// Used when you paste rows WITHOUT the header row.
const SHEET_COLUMNS = {
    scene: 1,    // B  - SCENES
    date: 2,     // C  - DATE
    upload: 15,  // P  - UPLOAD + SERVER
    trailer: 17  // R  - TRAILER
};

// Header names used to find the columns when you paste WITH the header row
const SHEET_HEADERS = {
    scene: "SCENES",
    date: "DATE",
    upload: "UPLOAD + SERVER",
    trailer: "TRAILER"
};

// Status values that mean "ready for QA"
const SCENE_READY = ["to test"];
const TRAILER_READY = ["to review"];

function loadStage0() {
    const saved = localStorage.getItem(STAGE0_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveStage0() {
    localStorage.setItem("lastActivityTimestamp", new Date().getTime().toString());
    localStorage.setItem(STAGE0_KEY, JSON.stringify(stage0Scenes));
    if (typeof updateWorkflowUI === 'function') updateWorkflowUI();
}

// --- SHEET PARSING ---

function normalizeCell(value) {
    return (value || "").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value) {
    return normalizeCell(value).toUpperCase().replace(/\s*\+\s*/g, " + ");
}

// Accepts 10-30-2026, 1-5-2026, 10/30/2026 -> returns MM-DD-YYYY (or "" if not a date)
function normalizeSheetDate(value) {
    const match = normalizeCell(value).match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (!match) return "";
    return `${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}-${match[3]}`;
}

// If the first pasted row is the header, read the column positions from it
function detectColumns(firstRowCells) {
    const headers = firstRowCells.map(normalizeHeader);
    const found = {};
    for (const key in SHEET_HEADERS) {
        const idx = headers.indexOf(SHEET_HEADERS[key]);
        if (idx !== -1) found[key] = idx;
    }
    // Treat it as a header row only if SCENES and TRAILER are both there
    return (found.scene !== undefined && found.trailer !== undefined)
        ? { ...SHEET_COLUMNS, ...found }
        : null;
}

// --- FORMATTING (bold / underline) FROM PASTED SHEET CELLS ---
// Key = the row's text, value = [true/false per cell] (true = bold or underlined)
let pastedFormatting = {};

function lineKey(line) {
    return line.split("\t").map(normalizeCell).join("\t");
}

function setupSheetPaste() {
    const ta = document.getElementById("stage0Input");
    if (!ta) return;

    ta.addEventListener("paste", e => {
        const html = e.clipboardData && e.clipboardData.getData("text/html");
        if (!html || !/<table/i.test(html)) return; // plain text paste -> default behaviour

        let rows;
        try { rows = readFormattedTable(html); } catch (err) { console.warn(err); return; }
        if (!rows.length) return;

        e.preventDefault();
        const lines = rows.map(r => r.map(c => c.text).join("\t"));
        rows.forEach((r, i) => { pastedFormatting[lineKey(lines[i])] = r.map(c => c.flagged); });
        insertAtCursor(ta, lines.join("\n"));
    });
}

function insertAtCursor(ta, text) {
    const start = ta.selectionStart, end = ta.selectionEnd;
    let before = ta.value.slice(0, start);
    if (before && !before.endsWith("\n")) before += "\n";
    ta.value = before + text + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = before.length + text.length;
}

// Renders the clipboard HTML in a hidden, script-free frame so the browser
// works out each cell's real styling (inline styles, <b>/<u> tags, Excel classes).
function readFormattedTable(html) {
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-same-origin"); // no scripts run
    frame.style.cssText = "position:absolute;left:-10000px;top:0;width:2000px;height:10px;visibility:hidden;";
    document.body.appendChild(frame);

    try {
        const doc = frame.contentDocument;
        const win = frame.contentWindow;
        doc.open(); doc.write(html); doc.close();

        const rows = [];
        doc.querySelectorAll("tr").forEach(tr => {
            const cells = [];
            Array.from(tr.cells).forEach(cell => {
                cells.push({
                    text: normalizeCell(cell.textContent),
                    flagged: isEmphasized(cell, win)
                });
                const span = parseInt(cell.getAttribute("colspan") || "1", 10);
                for (let i = 1; i < span; i++) cells.push({ text: "", flagged: false });
            });
            if (cells.some(c => c.text)) rows.push(cells);
        });
        return rows;
    } finally {
        frame.remove();
    }
}

// True if any text in the cell is bold or underlined
function isEmphasized(cell, win) {
    const nodes = [cell, ...cell.querySelectorAll("*")];
    return nodes.some(n => {
        const hasText = Array.from(n.childNodes).some(c => c.nodeType === 3 && c.textContent.trim());
        if (!hasText) return false;

        const weight = win.getComputedStyle(n).fontWeight;
        if ((parseInt(weight, 10) || (weight === "bold" ? 700 : 400)) >= 600) return true;

        // underline isn't inherited in computed style, so check up to the cell
        for (let el = n; el; el = el.parentElement) {
            const cs = win.getComputedStyle(el);
            if ((cs.textDecorationLine || cs.textDecoration || "").includes("underline")) return true;
            if (el === cell) break;
        }
        return false;
    });
}

function classifyRow(uploadValue, trailerValue, uploadFlagged, trailerFlagged) {
    const upload = normalizeCell(uploadValue).toLowerCase();
    const trailer = normalizeCell(trailerValue).toLowerCase();
    // Bold / underlined status = ignore
    const sceneReady = SCENE_READY.includes(upload) && !uploadFlagged;
    const trailerReady = TRAILER_READY.includes(trailer) && !trailerFlagged;

    if (sceneReady && trailerReady) return { hasTrailer: true, trailerOnly: false };
    if (sceneReady) return { hasTrailer: false, trailerOnly: false };
    if (trailerReady) return { hasTrailer: true, trailerOnly: true };
    return null; // not ready for QA
}

function parseSheetRows(lines, fallbackDate) {
    let rows = lines.map(line => line.split("\t"));
    let cols = SHEET_COLUMNS;

    const headerCols = detectColumns(rows[0]);
    if (headerCols) {
        cols = headerCols;
        rows = rows.slice(1);
    }

    const result = { added: [], skipped: [], missingDate: [], partial: [] };

    rows.forEach(cells => {
        const code = normalizeCell(cells[cols.scene]);
        if (!code) return;

        const date = normalizeSheetDate(cells[cols.date]) || fallbackDate;
        if (!date) { result.missingDate.push(code); return; }

        const flags = pastedFormatting[lineKey(cells.join("\t"))] || [];
        const upFlag = !!flags[cols.upload];
        const trFlag = !!flags[cols.trailer];

        const status = classifyRow(cells[cols.upload], cells[cols.trailer], upFlag, trFlag);
        const fmt = (val, flagged) => (normalizeCell(val) || "blank") + (flagged ? " [bold/underlined]" : "");
        if (!status) {
            result.skipped.push(`${code} (Upload: ${fmt(cells[cols.upload], upFlag)}, Trailer: ${fmt(cells[cols.trailer], trFlag)})`);
            return;
        }
        if ((upFlag && SCENE_READY.includes(normalizeCell(cells[cols.upload]).toLowerCase())) ||
            (trFlag && TRAILER_READY.includes(normalizeCell(cells[cols.trailer]).toLowerCase()))) {
            result.partial.push(`${code} (${upFlag ? "scene" : "trailer"} ignored — bold/underlined)`);
        }

        stage0Scenes[code] = { date, ...status, processed: false };
        result.added.push({ code, ...status });
    });

    return result;
}

// --- ADD BATCH ---

function stage0AddBulk() {
    const dateValue = document.getElementById("bulkStage0Date").value;
    const raw = document.getElementById("stage0Input").value;
    if (!raw.trim()) return;

    const fallbackDate = dateValue ? formatDateMMDDYYYY(dateValue) : "";
    const lines = raw.split(/\r?\n/).filter(l => l.trim());
    const isSheetPaste = lines.some(l => l.includes("\t"));

    if (isSheetPaste) {
        const result = parseSheetRows(lines, fallbackDate);
        showIntakeSummary(result);
    } else {
        // Plain list of codes (old behaviour) - needs the batch date
        if (!fallbackDate) { alert("Please select a date first!"); return; }
        lines.forEach(code => {
            const trimmed = code.trim();
            if (trimmed) {
                stage0Scenes[trimmed] = { date: fallbackDate, hasTrailer: false, trailerOnly: false, processed: false };
            }
        });
        showIntakeSummary(null);
    }

    document.getElementById("stage0Input").value = "";
    pastedFormatting = {};
    saveStage0();
    renderStage0();
}

function showIntakeSummary(result) {
    const box = document.getElementById("intakeSummary");
    if (!box) return;
    if (!result) { box.classList.add("hidden"); box.innerHTML = ""; return; }

    const both = result.added.filter(r => r.hasTrailer && !r.trailerOnly).length;
    const sceneOnly = result.added.filter(r => !r.hasTrailer).length;
    const trailerOnly = result.added.filter(r => r.trailerOnly).length;

    let html = `<strong>Added ${result.added.length}</strong> — `
        + `${both} scene + trailer, ${sceneOnly} scene only, ${trailerOnly} trailer only.`;

    if (result.skipped.length) {
        html += `<details><summary>${result.skipped.length} skipped (not ready for QA)</summary>`
            + `<ul>${result.skipped.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul></details>`;
    }
    if (result.partial.length) {
        html += `<details><summary>${result.partial.length} partly ignored (bold/underlined)</summary>`
            + `<ul>${result.partial.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul></details>`;
    }
    if (result.missingDate.length) {
        html += `<div class="warn">${result.missingDate.length} row(s) had no date — pick a batch date and paste them again: `
            + `${result.missingDate.map(escapeHtml).join(", ")}</div>`;
    }

    box.innerHTML = html;
    box.classList.remove("hidden");
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// --- RENDER ---

function getTypeBadge(item) {
    if (item.trailerOnly) return `<span class="badge badge-trailer-only">Trailer only</span>`;
    if (item.hasTrailer) return `<span class="badge badge-both">Scene + Trailer</span>`;
    return `<span class="badge badge-scene">Scene only</span>`;
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
            const safeCode = escapeHtml(item.code);
            const jsCode = item.code.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

            li.innerHTML = `
                <div>
                    <strong style="font-size: 1.1em;">${safeCode}</strong>
                    ${getTypeBadge(item)}
                </div>

                <div class="stage0-controls">
                    <label class="checkbox-label">
                        <input type="checkbox" ${item.hasTrailer ? 'checked' : ''}
                               onchange="stage0SetTrailer('${jsCode}', this.checked)"
                               style="margin-right: 5px; transform: scale(1.2);">
                        Has Trailer
                    </label>

                    <label class="checkbox-label">
                        <input type="checkbox" ${item.trailerOnly ? 'checked' : ''}
                               onchange="stage0SetTrailerOnly('${jsCode}', this.checked)"
                               style="margin-right: 5px; transform: scale(1.2);">
                        Trailer Only
                    </label>

                    <button onclick="deleteFromIntake('${jsCode}')"
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

document.addEventListener("DOMContentLoaded", setupSheetPaste);

function deleteFromIntake(code) {
    delete stage0Scenes[code];
    saveStage0();
    renderStage0();
}

function stage0SetTrailer(code, checked) {
    stage0Scenes[code].hasTrailer = checked;
    if (!checked) stage0Scenes[code].trailerOnly = false; // can't be trailer-only without a trailer
    saveStage0();
    renderStage0();
}

function stage0SetTrailerOnly(code, checked) {
    stage0Scenes[code].trailerOnly = checked;
    if (checked) stage0Scenes[code].hasTrailer = true;
    saveStage0();
    renderStage0();
}