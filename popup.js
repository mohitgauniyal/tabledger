const listEl = document.getElementById("list");
const errorEl = document.getElementById("error");
const statusEl = document.getElementById("status");

const btnViewSaved = document.getElementById("btnViewSaved");
const btnSelectAll = document.getElementById("btnSelectAll");
const btnSaveSelected = document.getElementById("btnSaveSelected");

let latestWindows = [];
let selectedTabIds = new Set();

function formatShortDate(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: "short", day: "numeric" });
}

function getDomainLabel(url) {
    try {
        const u = new URL(url);
        const host = u.hostname || "";

        // quick friendly mappings
        if (host.includes("mail.google.com")) return "Gmail";
        if (host.includes("medium.com")) return "Medium";
        if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
        if (host.includes("github.com")) return "GitHub";

        // strip common prefixes
        const clean = host.replace(/^www\./, "");

        // take main domain chunk (medium, github, etc.)
        const first = clean.split(".")[0] || "Web";

        // Title-case it
        return first.charAt(0).toUpperCase() + first.slice(1);
    } catch {
        return "Web";
    }
}

function generateSnapshotName(tabs, createdAt) {
    const counts = new Map();

    tabs.forEach((t) => {
        const label = getDomainLabel(t.url);
        counts.set(label, (counts.get(label) || 0) + 1);
    });

    const top = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([label]) => label);

    const datePart = formatShortDate(createdAt);

    if (top.length === 0) return `Snapshot • ${datePart}`;
    if (top.length === 1) return `${top[0]} • ${datePart}`;

    return `${top[0]} + ${top[1]} • ${datePart}`;
}

function getNiceTitle(tab) {
    if (tab.title && tab.title.trim()) return tab.title.trim();

    try {
        const u = new URL(tab.url);
        return u.hostname || "(No title)";
    } catch {
        return tab.url || "(No title)";
    }
}

function getNiceUrl(tab) {
    return tab.url || "";
}

function getFallbackFavicon() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' rx='3' ry='3' fill='%23ddd'/%3E%3C/svg%3E";
}

function flattenTabs(windows) {
    const tabs = [];
    windows.forEach((w) => {
        (w.tabs || []).forEach((t) => tabs.push(t));
    });
    return tabs;
}

function setStatus(msg) {
    statusEl.textContent = msg;
    if (msg) {
        setTimeout(() => {
            statusEl.textContent = "";
        }, 1600);
    }
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

            // checkbox
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "checkbox";
            cb.checked = selectedTabIds.has(tab.id);

            cb.addEventListener("change", () => {
                if (cb.checked) selectedTabIds.add(tab.id);
                else selectedTabIds.delete(tab.id);
            });

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

            row.appendChild(cb);
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
        latestWindows = windows;

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

btnSelectAll.addEventListener("click", () => {
    const allTabs = flattenTabs(latestWindows);
    allTabs.forEach((t) => selectedTabIds.add(t.id));
    renderList(latestWindows);
    setStatus(`Selected ${allTabs.length} tabs ✅`);
});

btnViewSaved.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

btnSaveSelected.addEventListener("click", async () => {
    const allTabs = flattenTabs(latestWindows);
    const selectedTabs = allTabs.filter((t) => selectedTabIds.has(t.id));

    if (selectedTabs.length === 0) {
        setStatus("No tabs selected ⚠️");
        return;
    }

    const createdAt = Date.now();

    const snapshot = {
        id: crypto.randomUUID(),
        createdAt,
        name: generateSnapshotName(selectedTabs, createdAt),
        tabs: selectedTabs.map((t) => ({
            title: t.title,
            url: t.url,
            favIconUrl: t.favIconUrl,
            pinned: t.pinned
        }))
    };

    const data = await chrome.storage.local.get(["snapshots"]);
    const snapshots = data.snapshots || [];
    snapshots.unshift(snapshot);

    await chrome.storage.local.set({ snapshots });

    setStatus(`Saved ✅ (${selectedTabs.length} tabs)`);
    selectedTabIds.clear();
    renderList(latestWindows);
});

refresh();
