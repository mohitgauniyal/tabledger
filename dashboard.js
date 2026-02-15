document.addEventListener("DOMContentLoaded", () => {
    init();
});

function init() {

    const snapshotsEl = document.getElementById("snapshots");
    const searchInput = document.getElementById("searchInput");
    const domainFilter = document.getElementById("domainFilter");
    const frequentChipsEl = document.getElementById("frequentChips");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

    let currentQuery = "";
    let currentDomain = "all";
    let expandState = {};

    /* ---------------- HELPERS ---------------- */

    function formatDate(ts) {
        return new Date(ts).toLocaleString();
    }

    function getFallbackFavicon() {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' rx='3' ry='3' fill='%23ddd'/%3E%3C/svg%3E";
    }

    function getDomain(url) {
        try {
            const u = new URL(url);
            return u.hostname.replace(/^www\./, "");
        } catch {
            return "";
        }
    }

    function highlightMatch(text, query) {
        if (!query || !text) return text;
        const lower = text.toLowerCase();
        const index = lower.indexOf(query);
        if (index === -1) return text;

        return (
            text.slice(0, index) +
            `<mark>${text.slice(index, index + query.length)}</mark>` +
            text.slice(index + query.length)
        );
    }

    async function loadSnapshots() {
        const data = await chrome.storage.local.get(["snapshots"]);
        return data.snapshots || [];
    }

    async function saveSnapshots(snapshots) {
        await chrome.storage.local.set({ snapshots });
    }

    async function deleteSnapshot(id) {
        const snapshots = await loadSnapshots();
        const updated = snapshots.filter(s => s.id !== id);
        await saveSnapshots(updated);
        render();
    }

    async function renameSnapshot(id, newName) {
        const name = (newName || "").trim();
        if (!name) return;

        const snapshots = await loadSnapshots();
        const updated = snapshots.map(s =>
            s.id === id ? { ...s, name } : s
        );

        await saveSnapshots(updated);
    }

    async function openSnapshot(snapshot) {
        const urls = snapshot.tabs.map(t => t.url).filter(Boolean);
        if (urls.length) {
            await chrome.windows.create({ url: urls });
        }
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

    /* ---------------- EVENTS ---------------- */

    searchInput.addEventListener("input", (e) => {
        currentQuery = e.target.value.trim().toLowerCase();
        render();
    });

    domainFilter.addEventListener("change", (e) => {
        currentDomain = e.target.value;
        render();
    });

    clearFiltersBtn?.addEventListener("click", () => {
        currentQuery = "";
        currentDomain = "all";
        searchInput.value = "";
        domainFilter.value = "all";
        render();
    });

    /* ---------------- RENDER ---------------- */

    async function render() {

        const allSnapshots = await loadSnapshots();

        /* -------- DOMAIN DROPDOWN BUILD -------- */

        const domainCounts = {};

        allSnapshots.forEach(s => {
            s.tabs.forEach(t => {
                const d = getDomain(t.url);
                if (!d) return;
                domainCounts[d] = (domainCounts[d] || 0) + 1;
            });
        });

        domainFilter.innerHTML = `<option value="all">All domains</option>`;

        Object.keys(domainCounts).sort().forEach(d => {
            const opt = document.createElement("option");
            opt.value = d;
            opt.textContent = d;
            domainFilter.appendChild(opt);
        });

        domainFilter.value = currentDomain;

        /* -------- FREQUENT CHIPS -------- */

        frequentChipsEl.innerHTML = "";

        Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([domain]) => {

                const chip = document.createElement("div");
                chip.className = "chip";
                chip.textContent = domain;

                if (currentDomain === domain) {
                    chip.classList.add("active");
                }

                chip.addEventListener("click", () => {
                    if (currentDomain === domain) {
                        currentDomain = "all";
                    } else {
                        currentDomain = domain;
                    }
                    render();
                });

                frequentChipsEl.appendChild(chip);
            });

        /* -------- FILTER VISUAL STATE -------- */

        if (currentQuery) {
            searchInput.classList.add("active");
        } else {
            searchInput.classList.remove("active");
        }

        if (currentDomain !== "all") {
            domainFilter.classList.add("active");
        } else {
            domainFilter.classList.remove("active");
        }

        if (currentQuery || currentDomain !== "all") {
            clearFiltersBtn?.classList.remove("hidden");
        } else {
            clearFiltersBtn?.classList.add("hidden");
        }

        /* -------- TAB LEVEL FILTERING -------- */

        const snapshots = allSnapshots
            .map(snapshot => {

                const filteredTabs = snapshot.tabs.filter(tab => {

                    const title = (tab.title || "").toLowerCase();
                    const url = (tab.url || "").toLowerCase();
                    const domain = getDomain(tab.url);

                    const queryMatch =
                        !currentQuery ||
                        title.includes(currentQuery) ||
                        url.includes(currentQuery);

                    const domainMatch =
                        currentDomain === "all" ||
                        domain === currentDomain;

                    return queryMatch && domainMatch;
                });

                return { ...snapshot, tabs: filteredTabs };

            })
            .filter(s => s.tabs.length > 0);

        snapshotsEl.innerHTML = "";

        if (snapshots.length === 0) {
            snapshotsEl.innerHTML =
                `<p class="muted">No matching tabs found.</p>`;
            return;
        }

        /* -------- RENDER CARDS -------- */

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

            const displayName = s.name || `Snapshot ${idx + 1}`;

            nameEl.innerHTML = currentQuery
                ? highlightMatch(displayName, currentQuery)
                : displayName;

            nameEl.title = "Click to rename";
            titleRow.appendChild(nameEl);

            const meta = document.createElement("div");
            meta.className = "meta";
            meta.textContent =
                `${formatDate(s.createdAt)} • ${s.tabs.length} tabs`;

            left.appendChild(titleRow);
            left.appendChild(meta);

            /* ----- Rename Snapshot ----- */

            nameEl.addEventListener("click", () => {
                const input = document.createElement("input");
                input.className = "snapshotNameInput";
                input.value = displayName;

                nameEl.replaceWith(input);
                input.focus();
                input.select();

                const saveAndExit = async () => {
                    await renameSnapshot(s.id, input.value);
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

            btnDelete.addEventListener("click", async () => {
                const confirmed = confirm(
                    `Delete "${displayName}"?\n\nThis action cannot be undone.`
                );
                if (!confirmed) return;
                await deleteSnapshot(s.id);
            });

            right.appendChild(btnOpen);
            right.appendChild(btnDelete);

            header.appendChild(left);
            header.appendChild(right);

            /* ----- Tabs ----- */

            const tabsDiv = document.createElement("div");
            tabsDiv.className = "tabs";

            const autoExpanded =
                currentQuery || currentDomain !== "all";

            const isExpanded =
                autoExpanded || expandState[s.id] === true;

            const visibleTabs =
                isExpanded ? s.tabs : s.tabs.slice(0, 10);

            visibleTabs.forEach(tab => {

                const row = document.createElement("div");
                row.className = "tabRow";
                row.title = "Click to copy link";

                const icon = document.createElement("img");
                icon.className = "favicon";
                icon.src = tab.favIconUrl || getFallbackFavicon();
                icon.onerror = () => icon.src = getFallbackFavicon();

                const text = document.createElement("div");
                text.className = "tabText";

                const title = document.createElement("div");
                title.className = "tabTitle";
                title.innerHTML = currentQuery
                    ? highlightMatch(tab.title || tab.url || "", currentQuery)
                    : (tab.title || tab.url || "(No title)");

                const url = document.createElement("div");
                url.className = "tabUrl";
                url.innerHTML = currentQuery
                    ? highlightMatch(tab.url || "", currentQuery)
                    : (tab.url || "");

                text.appendChild(title);
                text.appendChild(url);

                row.appendChild(icon);
                row.appendChild(text);

                row.addEventListener("click", async () => {
                    if (!tab.url) return;
                    await copyToClipboard(tab.url);
                    showToast(hint, "Copied ✅");
                });

                tabsDiv.appendChild(row);
            });

            if (!autoExpanded && !isExpanded && s.tabs.length > 10) {
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

            card.appendChild(header);
            card.appendChild(tabsDiv);
            snapshotsEl.appendChild(card);
        });
    }

    render();
}