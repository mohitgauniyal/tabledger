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

async function renameSnapshot(snapshotId, newName) {
    const name = (newName || "").trim();
    if (!name) return;

    const snapshots = await loadSnapshots();
    const updated = snapshots.map((s) => {
        if (s.id !== snapshotId) return s;
        return { ...s, name };
    });

    await saveSnapshots(updated);
}

async function copyToClipboard(text) {
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error("Copy failed:", err);
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
    }
}

function showToast(el, msg) {
    const old = el.textContent;
    el.textContent = msg;
    setTimeout(() => {
        el.textContent = old;
    }, 900);
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

        // LEFT side
        const left = document.createElement("div");

        const titleRow = document.createElement("div");
        titleRow.className = "snapshotTitleRow";

        const nameEl = document.createElement("div");
        nameEl.className = "snapshotName";
        nameEl.textContent = s.name || `Snapshot ${idx + 1}`;
        nameEl.title = "Click to rename";

        const hint = document.createElement("div");
        hint.className = "copyHint";
        hint.textContent = "Click link to copy";

        titleRow.appendChild(nameEl);
        titleRow.appendChild(hint);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${formatDate(s.createdAt)} • ${s.tabs.length} tabs`;

        left.appendChild(titleRow);
        left.appendChild(meta);

        // Inline rename behavior
        nameEl.addEventListener("click", () => {
            const input = document.createElement("input");
            input.className = "snapshotNameInput";
            input.value = s.name || `Snapshot ${idx + 1}`;
            nameEl.replaceWith(input);
            input.focus();
            input.select();

            const saveAndExit = async () => {
                const newName = input.value.trim();
                await renameSnapshot(s.id, newName);
                render();
            };

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") saveAndExit();
                if (e.key === "Escape") render();
            });

            input.addEventListener("blur", saveAndExit);
        });

        // RIGHT side buttons
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

        // TABS preview
        const tabsDiv = document.createElement("div");
        tabsDiv.className = "tabs";

        s.tabs.slice(0, 10).forEach((t) => {
            const row = document.createElement("div");
            row.className = "tabRow";
            row.title = "Click to copy link";

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

            // ✅ click-to-copy
            row.addEventListener("click", async () => {
                if (!t.url) return;
                await copyToClipboard(t.url);
                showToast(hint, "Copied ✅");
            });

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
