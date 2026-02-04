# TabLedger

TabLedger is a lightweight Chrome extension to help you save tab snapshots and reopen them later. It’s built for people who keep too many tabs open and want an easy way to clean up without losing context.

## Features (v0.0.1)

- View all open tabs grouped by windows
- Select tabs and save them as a snapshot
- View saved snapshots in a dashboard
- Reopen saved snapshots anytime
- Delete snapshots when you're done

## Updates (v0.0.2)

### New Features
- Save & Close selected tabs (save a snapshot and instantly clean up)
- Close selected tabs (with confirmation)
- Rename snapshots in the dashboard
- Click-to-copy saved links from snapshots

### Improvements
- Auto snapshot names based on top domains + date (e.g. *Medium + Gmail • Feb 4*)
- Pinned tab safety
  - Select All skips pinned tabs
  - Close actions always confirm if pinned tabs are selected
- UI polish for a cleaner, modern look

## How to run locally (Developer Mode)

1. Clone the repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder

## Permissions

TabLedger uses:

- `tabs`: to read your open tabs so you can save snapshots
- `storage`: to store snapshots locally on your device

## Privacy

All snapshots are stored locally using `chrome.storage.local`.  
No accounts. No cloud sync. No tracking.