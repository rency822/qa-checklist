const HOURS_TO_EXPIRE = 8;

function formatDateMMDDYYYY(dateValue) {
    if (!dateValue) return "";

    const [year, month, day] = dateValue.split("-");
    return `${month}-${day}-${year}`;
}

function checkDataExpiration() {
    const lastSave = localStorage.getItem("lastActivityTimestamp");
    const now = new Date().getTime();

    if (lastSave) {
        const hoursPassed = (now - lastSave) / (1000 * 60 * 60);
        
        if (hoursPassed > HOURS_TO_EXPIRE) {
            const keysToRemove = ["qa_stage0_scenes", "compiledEntries", "lastActivityTimestamp"];

            keysToRemove.forEach(key => localStorage.removeItem(key));

            console.log("Working data expired and cleared. Issue Manager preserved.");
            return true;
        }
    }
    
    localStorage.setItem("lastActivityTimestamp", now.toString());
    return false;
}