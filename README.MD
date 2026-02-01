# TabLedger

TabLedger is a lightweight Chrome extension to help you save tab snapshots and reopen them later.
It’s built for people who keep too many tabs open and want an easy way to clean up without losing context.

## Features
- View all open tabs grouped by windows
- Select tabs and save them as a snapshot
- View saved snapshots in a dashboard
- Reopen saved snapshots anytime
- Delete snapshots when you're done

## How to run locally (Developer Mode)
1. Clone the repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder

## Permissions
TabLedger uses:
- **tabs**: to read your open tabs so you can save snapshots
- **storage**: to store snapshots locally on your device

## Privacy
All snapshots are stored locally using `chrome.storage.local`.
No accounts. No cloud sync. No tracking.

## Versions Up Next
- Save + Close selected tabs
- Rename snapshots
- Search and filter snapshots
- Export / Import snapshots
