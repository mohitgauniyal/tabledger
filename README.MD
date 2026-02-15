# TabLedger

TabLedger is a lightweight Chrome extension for saving tab snapshots and reopening them later.

It is built for people who regularly work with large numbers of tabs and need a structured way to clean up their workspace without losing context.

TabLedger focuses on clarity, workflow control, and fast retrieval — while keeping everything local and privacy-first.

---

## Install

Chrome Web Store: [Install TabLedger](https://chromewebstore.google.com/detail/iokcjokpeefodkkbemdijpdelbbekegg)

---

## What TabLedger Does

TabLedger allows you to:

- Save selected tabs as structured snapshots
- Reopen saved sessions at any time
- Clean up your workspace without losing active research
- Search and filter through saved tabs efficiently
- Manage snapshots with safe and intentional controls

The extension is designed to feel lightweight, predictable, and fast — both in the popup and the dashboard.

---

## Design Principles

- **Local-first** – All data is stored locally using `chrome.storage.local`
- **Workflow-oriented** – Built around real tab cleanup patterns
- **Minimal friction** – Clear primary actions and safe destructive behavior
- **Progressive refinement** – Continuous UX and interaction improvements

---

## Version History

TabLedger is under active development.

Detailed release notes for each version can be found here:

Releases: [View all releases](https://github.com/mohitgauniyal/tabledger/releases)

### Milestones

- **v0.0.1** – Initial public release (core snapshot system)
- **v0.0.2** – Workflow & control improvements
- **v0.0.3** – Search, filtering, and UX refinement

---

## Running Locally (Developer Mode)

1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder

---

## Permissions

TabLedger uses:

- `tabs` — to read open tabs so snapshots can be created
- `storage` — to store snapshots locally on your device

No external servers are used.

---

## Privacy

All snapshots are stored locally on your device.

No accounts.  
No cloud sync.  
No tracking.
