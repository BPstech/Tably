/**
 * Tably - Background Service Worker (Manifest V3)
 */

importScripts('storage.js');

// Update badge count
async function updateBadge() {
  try {
    const sessions = await TablyStorage.getSessions();
    const count = sessions.length;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#0071e3' }); // Apple System Blue
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    console.error('Failed to update badge:', err);
  }
}

// Set up Context Menus on installation
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();

  // Create context menu items if permission is available
  if (chrome.contextMenus) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'stash_all_tabs',
        title: 'Tably: Stash all tabs in this window',
        contexts: ['action', 'page']
      });

      chrome.contextMenus.create({
        id: 'open_dashboard',
        title: 'Tably: Open Tab Manager Dashboard',
        contexts: ['action']
      });
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Context menu click handler
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'stash_all_tabs') {
      await stashCurrentWindow(tab ? tab.windowId : undefined);
    } else if (info.menuItemId === 'open_dashboard') {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    }
  });
}

// Keyboard shortcut command handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'stash_current_window') {
    await stashCurrentWindow();
  }
});

// Message listener from popup/dashboard
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'UPDATE_BADGE') {
    updateBadge();
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Stash all tabs in the current window and free memory
 */
async function stashCurrentWindow(targetWindowId) {
  try {
    let windowId = targetWindowId;
    if (!windowId) {
      const currentWin = await chrome.windows.getCurrent();
      windowId = currentWin.id;
    }

    const tabs = await chrome.tabs.query({ windowId });
    if (!tabs || tabs.length === 0) return;

    // Filter out internal chrome extension pages or blank newtabs if only 1 tab
    const validTabs = tabs.filter(t => t.url && !t.url.startsWith('chrome-extension://'));
    if (validTabs.length === 0) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    const sessionName = `Quick Stash • ${dateStr} at ${timeStr}`;

    await TablyStorage.saveSession({
      name: sessionName,
      tabs: validTabs
    });

    // Create a new blank tab first so window doesn't close
    await chrome.tabs.create({ windowId, url: 'chrome://newtab/' });

    // Close the saved tabs
    const tabIdsToClose = validTabs.map(t => t.id).filter(Boolean);
    if (tabIdsToClose.length > 0) {
      await chrome.tabs.remove(tabIdsToClose);
    }

    await updateBadge();
  } catch (err) {
    console.error('Error stashing current window:', err);
  }
}
