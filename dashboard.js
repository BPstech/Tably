/**
 * TabVault - Full Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const dashGrid = document.getElementById('dashGrid');
  const dashEmptyState = document.getElementById('dashEmptyState');
  const dashSearchInput = document.getElementById('dashSearchInput');
  const statSetsCount = document.getElementById('statSetsCount');
  const statTabsCount = document.getElementById('statTabsCount');
  const statRamSaved = document.getElementById('statRamSaved');
  const sidebarStashBtn = document.getElementById('sidebarStashBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const importJsonInput = document.getElementById('importJsonInput');
  const restoreAllSetsBtn = document.getElementById('restoreAllSetsBtn');
  const clearAllSetsBtn = document.getElementById('clearAllSetsBtn');
  const toastEl = document.getElementById('toast');

  let sessions = [];

  // Initial Load
  await loadDashboardData();
  setupEventListeners();

  /**
   * Load sessions and update stats
   */
  async function loadDashboardData() {
    sessions = await TabVaultStorage.getSessions();
    updateStats();
    renderGrid();
  }

  /**
   * Update stats widget
   */
  function updateStats() {
    const totalSets = sessions.length;
    const totalTabs = sessions.reduce((sum, s) => sum + (s.tabs ? s.tabs.length : 0), 0);
    const ramEst = TabVaultStorage.estimateMemorySaved(totalTabs);

    statSetsCount.textContent = totalSets.toString();
    statTabsCount.textContent = totalTabs.toString();
    statRamSaved.textContent = totalTabs > 0 ? ramEst : '0 MB';
  }

  /**
   * Render grid of saved sets
   */
  function renderGrid() {
    dashGrid.innerHTML = '';
    const query = (dashSearchInput.value || '').trim().toLowerCase();

    const filtered = sessions.filter(session => {
      if (!query) return true;
      if (session.name.toLowerCase().includes(query)) return true;
      return session.tabs.some(t =>
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.url && t.url.toLowerCase().includes(query))
      );
    });

    if (sessions.length === 0) {
      dashEmptyState.classList.remove('hidden');
      dashGrid.classList.add('hidden');
      return;
    }

    dashEmptyState.classList.add('hidden');
    dashGrid.classList.remove('hidden');

    if (filtered.length === 0) {
      dashGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          No saved collections match your search term.
        </div>
      `;
      return;
    }

    filtered.forEach(session => {
      const card = createDashboardCard(session);
      dashGrid.appendChild(card);
    });
  }

  /**
   * Create an individual Dashboard Card
   */
  function createDashboardCard(session) {
    const card = document.createElement('div');
    card.className = 'dash-card';

    // Header
    const header = document.createElement('div');
    header.className = 'dash-card-header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'dash-card-title-group';

    const indicator = document.createElement('div');
    indicator.className = 'dash-indicator';
    indicator.style.backgroundColor = session.color || '#6366f1';

    const title = document.createElement('h3');
    title.className = 'dash-card-title';
    title.textContent = session.name;
    title.title = 'Click to rename';
    title.addEventListener('click', () => handleRename(session, title));

    titleGroup.appendChild(indicator);
    titleGroup.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'dash-card-meta';

    const countBadge = document.createElement('span');
    countBadge.className = 'tabs-badge';
    countBadge.textContent = `${session.tabs.length} tabs`;

    const timeAgo = document.createElement('span');
    timeAgo.textContent = TabVaultStorage.formatTimeAgo(session.createdAt);

    meta.appendChild(countBadge);
    meta.appendChild(timeAgo);

    header.appendChild(titleGroup);
    header.appendChild(meta);

    // Scrollable Tab List
    const tabsList = document.createElement('div');
    tabsList.className = 'dash-tabs-scroll';

    session.tabs.forEach((tab, index) => {
      const item = document.createElement('div');
      item.className = 'dash-tab-item';

      const left = document.createElement('div');
      left.className = 'dash-tab-left';
      left.title = tab.url;

      const fav = document.createElement('img');
      fav.className = 'tab-favicon';
      fav.src = tab.favIconUrl || TabVaultStorage.getFaviconFallback(tab.url);
      fav.onerror = () => { fav.style.display = 'none'; };

      const tabTitle = document.createElement('span');
      tabTitle.className = 'tab-title-text';
      tabTitle.textContent = tab.title || tab.url;

      left.appendChild(fav);
      left.appendChild(tabTitle);
      left.addEventListener('click', () => {
        chrome.tabs.create({ url: tab.url, active: true });
        showToast(`Opening "${tab.title.slice(0, 25)}..."`);
      });

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-icon-btn';
      removeBtn.title = 'Remove this tab';
      removeBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await TabVaultStorage.removeTabFromSession(session.id, index);
        await loadDashboardData();
        showToast('Tab removed');
      });

      item.appendChild(left);
      item.appendChild(removeBtn);
      tabsList.appendChild(item);
    });

    // Footer Actions
    const footer = document.createElement('div');
    footer.className = 'dash-card-footer';

    const leftBtns = document.createElement('div');
    leftBtns.className = 'footer-left-buttons';

    const restoreWinBtn = document.createElement('button');
    restoreWinBtn.className = 'btn btn-primary btn-sm';
    restoreWinBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Restore All</span>
    `;
    restoreWinBtn.addEventListener('click', () => restoreInWindow(session));

    const restoreGroupBtn = document.createElement('button');
    restoreGroupBtn.className = 'btn btn-secondary btn-sm';
    restoreGroupBtn.title = 'Restore as a colored Tab Group in active window';
    restoreGroupBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      <span>Group</span>
    `;
    restoreGroupBtn.addEventListener('click', () => restoreAsGroup(session));

    leftBtns.appendChild(restoreWinBtn);
    leftBtns.appendChild(restoreGroupBtn);

    const rightTools = document.createElement('div');
    rightTools.className = 'footer-left-buttons';

    const editBtn = document.createElement('button');
    editBtn.className = 'card-tool-btn';
    editBtn.title = 'Rename collection';
    editBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', () => handleRename(session, title));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-tool-btn delete';
    deleteBtn.title = 'Delete collection';
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Delete collection "${session.name}"?`)) {
        await TabVaultStorage.deleteSession(session.id);
        await loadDashboardData();
        showToast('Collection deleted');
      }
    });

    rightTools.appendChild(editBtn);
    rightTools.appendChild(deleteBtn);

    footer.appendChild(leftBtns);
    footer.appendChild(rightTools);

    card.appendChild(header);
    card.appendChild(tabsList);
    card.appendChild(footer);

    return card;
  }

  /**
   * Restore tabs in a new window
   */
  async function restoreInWindow(session) {
    if (!session.tabs || session.tabs.length === 0) return;
    const urls = session.tabs.map(t => t.url);
    await chrome.windows.create({ url: urls });
    showToast(`Restored ${urls.length} tabs in new window!`);
  }

  /**
   * Restore tabs as a Chrome tab group
   */
  async function restoreAsGroup(session) {
    if (!session.tabs || session.tabs.length === 0) return;
    try {
      const createdIds = [];
      for (const t of session.tabs) {
        const created = await chrome.tabs.create({ url: t.url, active: false });
        createdIds.push(created.id);
      }

      if (chrome.tabs.group && createdIds.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds: createdIds });
        const color = mapColor(session.color);
        await chrome.tabGroups.update(groupId, {
          title: session.name,
          color: color
        });
      }
      showToast(`Grouped ${session.tabs.length} tabs as "${session.name}"!`);
    } catch (e) {
      console.error(e);
      showToast('Error grouping tabs');
    }
  }

  function mapColor(hex) {
    switch (hex) {
      case '#6366f1': return 'blue';
      case '#3b82f6': return 'cyan';
      case '#06b6d4': return 'cyan';
      case '#10b981': return 'green';
      case '#f59e0b': return 'yellow';
      case '#ec4899': return 'pink';
      case '#8b5cf6': return 'purple';
      case '#ef4444': return 'red';
      default: return 'blue';
    }
  }

  /**
   * Inline Rename
   */
  function handleRename(session, titleElement) {
    const currentName = session.name;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.style.background = 'var(--bg-input)';
    input.style.border = '1px solid var(--border-focus)';
    input.style.color = '#fff';
    input.style.padding = '2px 6px';
    input.style.borderRadius = '4px';
    input.style.fontSize = '14px';

    const save = async () => {
      const newName = input.value.trim() || currentName;
      if (newName !== currentName) {
        await TabVaultStorage.updateSession(session.id, { name: newName });
        await loadDashboardData();
        showToast('Renamed collection');
      } else {
        titleElement.textContent = currentName;
      }
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') {
        input.value = currentName;
        input.blur();
      }
    });

    titleElement.replaceWith(input);
    input.focus();
    input.select();
  }

  /**
   * Setup UI Event Listeners
   */
  function setupEventListeners() {
    dashSearchInput.addEventListener('input', () => {
      renderGrid();
    });

    // Stash current window from dashboard
    sidebarStashBtn.addEventListener('click', async () => {
      try {
        const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
        // Target a window other than dashboard or current
        const currentWin = await chrome.windows.getCurrent();
        const tabs = await chrome.tabs.query({ windowId: currentWin.id });
        
        // Exclude dashboard tab itself
        const validTabs = tabs.filter(t => !t.url.includes('dashboard.html') && !t.url.startsWith('chrome-extension://'));

        if (validTabs.length === 0) {
          showToast('No other tabs in this window to stash!');
          return;
        }

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const name = `Workspace Stash • ${timeStr}`;

        await TabVaultStorage.saveSession({
          name,
          tabs: validTabs
        });

        const idsToClose = validTabs.map(t => t.id);
        await chrome.tabs.remove(idsToClose);

        await loadDashboardData();
        showToast(`Stashed ${validTabs.length} tabs and freed RAM!`);
      } catch (e) {
        console.error(e);
        showToast('Error stashing tabs');
      }
    });

    // Export Backup
    exportJsonBtn.addEventListener('click', async () => {
      try {
        const jsonStr = await TabVaultStorage.exportJSON();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `tabvault_backup_${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup downloaded successfully!');
      } catch (e) {
        console.error(e);
        showToast('Error exporting backup');
      }
    });

    // Import Backup
    importJsonInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        await TabVaultStorage.importJSON(text, 'merge');
        await loadDashboardData();
        showToast('Tab collections imported successfully!');
      } catch (err) {
        alert('Failed to import backup: ' + err.message);
      } finally {
        importJsonInput.value = '';
      }
    });

    // Restore All Sets
    restoreAllSetsBtn.addEventListener('click', async () => {
      if (sessions.length === 0) {
        showToast('No saved sets to restore!');
        return;
      }
      if (confirm(`Open all ${sessions.length} saved collections? This will open multiple windows.`)) {
        for (const s of sessions) {
          await restoreInWindow(s);
        }
      }
    });

    // Clear All Sets
    clearAllSetsBtn.addEventListener('click', async () => {
      if (sessions.length === 0) return;
      if (confirm('Are you sure you want to delete ALL saved tab sets? This cannot be undone unless you have a backup.')) {
        await TabVaultStorage.saveSettings({}); // keep settings
        await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: [] });
        await loadDashboardData();
        TabVaultStorage.broadcastUpdate();
        showToast('All collections cleared');
      }
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2800);
  }
});
