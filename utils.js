function formatDateMMDDYYYY(dateValue) {
    if (!dateValue) return "";

    const [year, month, day] = dateValue.split("-");
    return `${month}-${day}-${year}`;
}
