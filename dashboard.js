document.addEventListener("DOMContentLoaded", () => {
    init();
});

function init() {

    const snapshotsEl = document.getElementById("snapshots");
    const searchInput = document.getElementById("searchInput");

    let currentQuery = "";
    let expandState = {}; // manual expand/collapse
    let matchingIds = new Set(); // search matches

    // 🔎 Highlight helper
    function highlightMatch(text, query) {
        if (!query || !text) return text;

        const lower = text.toLowerCase();
        const index = lower.indexOf(query);
        if (index === -1) return text;

        const before = text.slice(0, index);
        const match = text.slice(index, index + query.length);
        const after = text.slice(index + query.length);

        return `${before}<mark>${match}</mark>${after}`;
    }

    searchInput?.addEventListener("input", (e) => {
        currentQuery = e.target.value.trim().toLowerCase();
        render();
    });

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
        } catch {
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
        let snapshots = await loadSnapshots();
        matchingIds.clear();

        // 🔎 SEARCH FILTER + MATCH TRACKING
        if (currentQuery) {
            snapshots = snapshots.filter((s) => {
                const nameMatch =
                    (s.name || "").toLowerCase().includes(currentQuery);

                const tabMatch = s.tabs.some((t) => {
                    return (
                        (t.title || "").toLowerCase().includes(currentQuery) ||
                        (t.url || "").toLowerCase().includes(currentQuery)
                    );
                });

                const matched = nameMatch || tabMatch;

                if (matched) matchingIds.add(s.id);

                return matched;
            });
        }

        snapshotsEl.innerHTML = "";

        if (snapshots.length === 0) {
            snapshotsEl.innerHTML = currentQuery
                ? `<p class="muted">No snapshots match your search.</p>`
                : `<p class="muted">No saved snapshots yet.</p>`;
            return;
        }

        snapshots.forEach((s, idx) => {
            const card = document.createElement("div");
            card.className = "snapshotCard";

            const header = document.createElement("div");
            header.className = "row";

            const left = document.createElement("div");

            const titleRow = document.createElement("div");
            titleRow.className = "snapshotTitleRow";

            const nameEl = document.createElement("div");
            nameEl.className = "snapshotName";
            nameEl.title = "Click to rename";

            const displayName = s.name || `Snapshot ${idx + 1}`;

            if (currentQuery) {
                nameEl.innerHTML = highlightMatch(displayName, currentQuery);
            } else {
                nameEl.textContent = displayName;
            }

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

            // Rename inline
            nameEl.addEventListener("click", () => {
                const input = document.createElement("input");
                input.className = "snapshotNameInput";
                input.value = displayName;
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

            // 📂 TABS
            const tabsDiv = document.createElement("div");
            tabsDiv.className = "tabs";

            const isExpanded = currentQuery
                ? matchingIds.has(s.id) // auto-expand on search
                : expandState[s.id] === true;

            const visibleTabs = isExpanded ? s.tabs : s.tabs.slice(0, 10);

            visibleTabs.forEach((t) => {
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

                const url = document.createElement("div");
                url.className = "tabUrl";

                const tabTitle = t.title || t.url || "(No title)";
                const tabUrl = t.url || "";

                if (currentQuery) {
                    title.innerHTML = highlightMatch(tabTitle, currentQuery);
                    url.innerHTML = highlightMatch(tabUrl, currentQuery);
                } else {
                    title.textContent = tabTitle;
                    url.textContent = tabUrl;
                }

                text.appendChild(title);
                text.appendChild(url);

                row.appendChild(icon);
                row.appendChild(text);

                row.addEventListener("click", async () => {
                    if (!t.url) return;
                    await copyToClipboard(t.url);
                    showToast(hint, "Copied ✅");
                });

                tabsDiv.appendChild(row);
            });

            // Expand / collapse controls
            if (!currentQuery && !isExpanded && s.tabs.length > 10) {
                const more = document.createElement("div");
                more.className = "meta";
                more.style.cursor = "pointer";
                more.textContent = `+ ${s.tabs.length - 10} more tabs...`;

                more.addEventListener("click", () => {
                    expandState[s.id] = true;
                    render();
                });

                tabsDiv.appendChild(more);
            }

            if (!currentQuery && isExpanded && s.tabs.length > 10) {
                const collapse = document.createElement("div");
                collapse.className = "meta";
                collapse.style.cursor = "pointer";
                collapse.textContent = "Show less";

                collapse.addEventListener("click", () => {
                    expandState[s.id] = false;
                    render();
                });

                tabsDiv.appendChild(collapse);
            }

            card.appendChild(header);
            card.appendChild(tabsDiv);
            snapshotsEl.appendChild(card);
        });
    }

    render();
}