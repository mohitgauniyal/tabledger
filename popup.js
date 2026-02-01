async function updateCounts() {
    const windows = await chrome.windows.getAll({ populate: true });

    const winCount = windows.length;
    const tabCount = windows.reduce((acc, w) => acc + (w.tabs?.length || 0), 0);

    document.getElementById("winCount").textContent = winCount;
    document.getElementById("tabCount").textContent = tabCount;
}

updateCounts();
