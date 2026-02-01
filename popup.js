const listEl = document.getElementById("list");
const errorEl = document.getElementById("error");

function getNiceTitle(tab) {
    // Prefer title if present
    if (tab.title && tab.title.trim()) return tab.title.trim();

    // Fallback to hostname if possible
    try {
        const u = new URL(tab.url);
        return u.hostname || "(No title)";
    } catch (e) {
        // For chrome://, about:blank, etc.
        return tab.url || "(No title)";
    }
}

function getNiceUrl(tab) {
    return tab.url || "";
}

function getFallbackFavicon() {
    // tiny gray rounded square svg
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' rx='3' ry='3' fill='%23ddd'/%3E%3C/svg%3E";
}

function renderList(windows) {
    listEl.innerHTML = "";

    windows.forEach((w, index) => {
        const windowTitle = document.createElement("div");
        windowTitle.className = "windowTitle";
        windowTitle.textContent = `Window ${index + 1} (${w.tabs?.length || 0} tabs)`;
        listEl.appendChild(windowTitle);

        (w.tabs || []).forEach((tab) => {
            const row = document.createElement("div");
            row.className = "tabRow";

            // favicon
            const icon = document.createElement("img");
            icon.className = "favicon";
            icon.alt = "";

            icon.src = tab.favIconUrl || getFallbackFavicon();
            icon.onerror = () => {
                icon.src = getFallbackFavicon();
            };

            // text container
            const textWrap = document.createElement("div");
            textWrap.className = "tabText";

            const title = document.createElement("div");
            title.className = "tabTitle";
            title.textContent = getNiceTitle(tab);

            const url = document.createElement("div");
            url.className = "tabUrl";
            url.textContent = getNiceUrl(tab);

            textWrap.appendChild(title);
            textWrap.appendChild(url);

            row.appendChild(icon);
            row.appendChild(textWrap);

            listEl.appendChild(row);
        });
    });
}

async function refresh() {
    try {
        errorEl.textContent = "";

        const windows = await chrome.windows.getAll({ populate: true });

        const winCount = windows.length;
        const tabCount = windows.reduce((acc, w) => acc + (w.tabs?.length || 0), 0);

        document.getElementById("winCount").textContent = winCount;
        document.getElementById("tabCount").textContent = tabCount;

        renderList(windows);
    } catch (err) {
        console.error(err);
        errorEl.textContent = "Could not load tabs. Please reload extension.";
    }
}

refresh();
