<div align="center">

  <img src="icons/icon128.png" alt="Tably Logo" width="96" height="96" />

  # Tably
  ### High-Performance Tab Session Manager for Google Chrome

  <p align="center">
    <strong>Save tab sets with custom names, reclaim system memory by closing them, and restore workflows on demand.</strong>
  </p>

  <p align="center">
    <a href="#features"><img src="https://img.shields.io/badge/Manifest-V3-0071e3?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Manifest V3" /></a>
    <a href="#privacy--permissions"><img src="https://img.shields.io/badge/Privacy-100%25%20Local-30d158?style=for-the-badge&logo=shield&logoColor=white" alt="100% Local" /></a>
    <a href="#installation"><img src="https://img.shields.io/badge/Chrome-Extension-0071e3?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension" /></a>
    <a href="https://github.com/BPstech/Tably"><img src="https://img.shields.io/badge/GitHub-BPstech%2FTably-1d1d1f?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" /></a>
  </p>

  <p align="center">
    <a href="#overview">Overview</a> •
    <a href="#screenshots">Screenshots</a> •
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#shortcuts">Shortcuts</a> •
    <a href="#architecture">Architecture</a>
  </p>

  ---

  <img src="screenshots/dashboard-overview.png" alt="Tably Dashboard Overview" width="100%" />

</div>

<br/>

## Overview

When multitasking, researching, or context-switching between projects, browsers frequently accumulate dozens of open tabs. Users avoid closing them to prevent losing context, but maintaining open tabs introduces major inefficiencies:

* **System Memory Pressure**: Active Chromium tabs consume considerable memory, often 150 MB to 250 MB per tab. A session of 30 tabs can consume 5 GB to 8 GB of RAM.
* **Battery Consumption**: Active background scripts trigger sustained CPU wakeups, reducing laptop battery life.
* **Visual Congestion**: Tab strips compress until page titles and icons become unidentifiable.

**Tably provides a structured, native-grade workflow:**
1. **Name and tag** open windows into categorized sessions.
2. **Close tabs immediately** to release RAM using the **Save & Close** command.
3. **Restore sessions in one click** at any time—either into dedicated windows or directly into **Chrome Tab Groups**.

---

## Screenshots

### 1. Popup Interface
A compact, dark-mode popup interface with real-time memory usage estimates, session naming, system color tags, and single-click stashing actions.

<div align="center">
  <img src="screenshots/popup-interface.png" alt="Tably Popup Interface" width="520" />
</div>

<br/>

### 2. Selective Tab Stashing
Review and selectively exclude specific background tabs before saving a session.

<div align="center">
  <img src="screenshots/popup-expanded-tabs.png" alt="Tably Selective Stash Drawer" width="520" />
</div>

<br/>

### 3. Session Dashboard & Search
A full-screen management interface (`dashboard.html`) showing aggregate metrics, backup tools, and instantaneous multi-attribute search across sessions and tab URLs.

<div align="center">
  <img src="screenshots/dashboard-overview.png" alt="Tably Full Dashboard" width="100%" />
</div>

<br/>

### 4. Search Filtering
Filter through saved collections instantaneously as you type.

<div align="center">
  <img src="screenshots/dashboard-search.png" alt="Tably Dashboard Search" width="100%" />
</div>

---

## Features

| Feature | Description |
| :--- | :--- |
| **Save & Close (Memory Saver)** | Stashes active tabs and closes them immediately, releasing occupied system memory. |
| **Save Only Mode** | Creates a session snapshot while leaving your active tabs open and undisturbed. |
| **Chrome Tab Groups** | Restores sessions directly as native, color-coded Chrome Tab Groups inside your active window. |
| **Session Naming & Color Tags** | Auto-generates clean session titles with support for custom names and system color tags. |
| **Selective Stashing** | Collapsible tab drawer allows granular selection of tabs prior to saving. |
| **Instant Deep Search** | Real-time search across session names, individual page titles, and destination URLs. |
| **Tab Inspection & Management** | Expand saved sessions to review, open individual items, rename, or remove tabs. |
| **Full Management Console** | Dedicated dashboard view with aggregate memory metrics and batch operations. |
| **JSON Backup & Restore** | Export session databases to standard JSON format or import them across workstations. |
| **Offline Privacy** | Fully local architecture without external servers, telemetry, or third-party tracking. |
| **Keyboard Shortcut** | Trigger quick stashes via `Alt + Shift + S` without opening the popup UI. |

---

## Installation

Tably is built on **Chrome Extension Manifest V3** and runs on any Chromium-based browser (Google Chrome, Brave, Microsoft Edge, Arc, Opera, Vivaldi).

### Setup Instructions:

1. **Clone or Download** the repository:
   ```bash
   git clone https://github.com/BPstech/Tably.git
   ```

2. Open Chrome and navigate to the Extensions management page:
   ```text
   chrome://extensions/
   ```

3. Enable **Developer mode** using the toggle switch in the upper-right corner.

4. Click the **Load unpacked** button in the upper-left toolbar.

5. Select the project directory containing `manifest.json`.

6. Pin **Tably** in the browser toolbar for quick access.

---

## Usage

### 1. Saving Tabs
1. Click the **Tably** toolbar icon.
2. Review the memory estimation indicator.
3. Enter a custom session title or retain the suggested name.
4. Choose a color tag to organize the session.
5. *(Optional)* Click the tab count summary to deselect specific tabs.
6. Click **Save & Close Tabs** to free memory, or **Save Only** to preserve current tabs.

### 2. Restoring Sessions
Tably supports multiple restoration modes:
* **Restore All (Default)**: Restores all tabs in a separate window.
* **Open as Tab Group**: Groups tabs into a named, colored Tab Group in the active window.
* **Add to Current Window**: Appends tabs directly to the active window without grouping.
* **Open & Delete Set**: Restores tabs and deletes the session in a single action.

### 3. Managing Collections
* **Inline Renaming**: Click any session title to edit its name inline.
* **Tab Management**: Click the list button on any session card to view and manage specific tabs.
* **Dashboard View**: Click the external link icon in the popup header to open the full management dashboard.

---

## Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Alt + Shift + S` | **Quick Stash Window** (Saves active tabs and frees memory) | Global |
| `Enter` | Save session from popup input | Popup |
| `Escape` | Dismiss open menus and popovers | Popup / Dashboard |

> Shortcuts can be reconfigured at any time via `chrome://extensions/shortcuts`.

---

## Architecture

Tably is engineered with zero runtime build dependencies:

```text
┌────────────────────────────────────────────────────────┐
│                   Chrome Browser                       │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │   Popup UI            │  │  Full Dashboard       │  │
│  │   (popup.html / js)   │  │  (dashboard.html / js)│  │
│  └───────────┬───────────┘  └───────────┬───────────┘  │
│              │                          │              │
│              ▼                          ▼              │
│  ┌──────────────────────────────────────────────────┐  │
│  │             Shared Storage Layer                 │  │
│  │                 (storage.js)                     │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │                             │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │         chrome.storage.local (Offline)           │  │
│  └──────────────────────────────────────────────────┘  │
│                          ▲                             │
│                          │                             │
│  ┌───────────────────────┴──────────────────────────┐  │
│  │       Background Service Worker (MV3)            │  │
│  │               (background.js)                    │  │
│  │   • Keyboard command listener                    │  │
│  │   • Context menu integration                     │  │
│  │   • Extension badge counter                      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

* **Chrome Extensions Manifest V3**: Compliant with current extension platform specifications.
* **Vanilla JavaScript (ES2022)**: Direct DOM operations with zero framework overhead.
* **Typography**: Native Apple San Francisco font stack with offline fallback.
* **CSS Architecture**: Custom properties, flexbox, and grid layouts designed according to Apple Human Interface Guidelines.

---

## Directory Structure

```text
Tably/
├── manifest.json              # Extension manifest (MV3 permissions, shortcuts)
├── background.js              # Service worker (shortcuts, badge updates, context menus)
├── storage.js                 # Persistence layer and data models
├── popup.html                 # Toolbar popup layout
├── popup.css                  # Popup interface styling
├── popup.js                   # Popup controller and event bindings
├── dashboard.html             # Full session management dashboard
├── dashboard.css              # Dashboard layout and card styles
├── dashboard.js               # Dashboard controller and search logic
├── generate_icons.py          # Icon generation script
├── capture_screenshots.py     # Automated screenshot capture utility
├── fonts/                     # Bundled typography assets
│   ├── inter.css
│   ├── inter-variable-latin.woff2
│   └── inter-variable-latin-ext.woff2
├── icons/                     # Extension branding icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── screenshots/               # Interface documentation assets
│   ├── dashboard-overview.png
│   ├── dashboard-search.png
│   ├── popup-interface.png
│   └── popup-expanded-tabs.png
└── README.md                  # Project documentation
```

---

## Privacy & Permissions

Tably operates with an offline-first architecture. No analytics, tracking, or network transmission occur.

### Required Permissions:
* `tabs`: Required to read tab URLs and titles for stashing and restoration.
* `storage`: Required to persist saved sessions in `chrome.storage.local`.
* `tabGroups`: Required to group restored tabs into native Chrome Tab Groups.
* `contextMenus`: Optional context menu shortcuts for window stashing.

---

## Contributing

Contributions and issue reports are welcome:
1. Fork the repository at [https://github.com/BPstech/Tably](https://github.com/BPstech/Tably).
2. Create a feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m 'Add NewFeature'`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.

<div align="center">
  <sub>Tab session manager for Chromium browsers.</sub>
</div>