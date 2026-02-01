const snapshotsEl = document.getElementById("snapshots");

function formatDate(ts) {
    return new Date(ts).toLocaleString();
}

function getFallbackFavicon() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' rx='3' ry='3' fill='%23ddd'/%3E%3C/svg%3E";
}

async function loadSnapshots() {
    const data = await chrome.storage.local.get(["snapshots"]);
    return data.snapshots || [];
}

async function saveSnapshots(snapshots) {
    await chrome.storage.local.set({ snapshots });
}

async function openSnapshot(snapshot) {
    const urls = snapshot.tabs.map((t) => t.url).filter(Boolean);
    if (urls.length > 0) {
        await chrome.windows.create({ url: urls });
    }
}

async function deleteSnapshot(snapshotId) {
    const snapshots = await loadSnapshots();
    const updated = snapshots.filter((s) => s.id !== snapshotId);
    await saveSnapshots(updated);
    render();
}

async function render() {
    const snapshots = await loadSnapshots();
    snapshotsEl.innerHTML = "";

    if (snapshots.length === 0) {
        snapshotsEl.innerHTML = `<p class="muted">No saved snapshots yet.</p>`;
        return;
    }

    snapshots.forEach((s, idx) => {
        const card = document.createElement("div");
        card.className = "snapshotCard";

        const header = document.createElement("div");
        header.className = "row";

        const left = document.createElement("div");
        left.innerHTML = `
      <div><b>Snapshot ${idx + 1}</b></div>
      <div class="meta">${formatDate(s.createdAt)} • ${s.tabs.length} tabs</div>
    `;

        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.gap = "8px";

        const btnOpen = document.createElement("button");
        btnOpen.textContent = "Open";
        btnOpen.addEventListener("click", () => openSnapshot(s));

        const btnDelete = document.createElement("button");
        btnDelete.textContent = "Delete";
        btnDelete.addEventListener("click", () => deleteSnapshot(s.id));

        right.appendChild(btnOpen);
        right.appendChild(btnDelete);

        header.appendChild(left);
        header.appendChild(right);

        const tabsDiv = document.createElement("div");
        tabsDiv.className = "tabs";

        // Show first 10 tabs as preview
        s.tabs.slice(0, 10).forEach((t) => {
            const row = document.createElement("div");
            row.className = "tabRow";

            const icon = document.createElement("img");
            icon.className = "favicon";
            icon.src = t.favIconUrl || getFallbackFavicon();
            icon.onerror = () => (icon.src = getFallbackFavicon());

            const text = document.createElement("div");
            text.className = "tabText";

            const title = document.createElement("div");
            title.className = "tabTitle";
            title.textContent = t.title || t.url || "(No title)";

            const url = document.createElement("div");
            url.className = "tabUrl";
            url.textContent = t.url || "";

            text.appendChild(title);
            text.appendChild(url);

            row.appendChild(icon);
            row.appendChild(text);

            tabsDiv.appendChild(row);
        });

        if (s.tabs.length > 10) {
            const more = document.createElement("div");
            more.className = "meta";
            more.textContent = `+ ${s.tabs.length - 10} more tabs...`;
            tabsDiv.appendChild(more);
        }

        card.appendChild(header);
        card.appendChild(tabsDiv);
        snapshotsEl.appendChild(card);
    });
}

render();
