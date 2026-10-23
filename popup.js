/**
 * Tably - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const openTabsCountEl = document.getElementById('openTabsCount');
  const sessionNameInput = document.getElementById('sessionNameInput');
  const colorPickerRow = document.getElementById('colorPickerRow');
  const tabSelectToggle = document.getElementById('tabSelectToggle');
  const currentTabsList = document.getElementById('currentTabsList');
  const selectAllTabsCheckbox = document.getElementById('selectAllTabsCheckbox');
  const selectedCountText = document.getElementById('selectedCountText');
  const tabsScrollArea = document.getElementById('tabsScrollArea');
  const saveAndCloseBtn = document.getElementById('saveAndCloseBtn');
  const saveOnlyBtn = document.getElementById('saveOnlyBtn');
  const searchInput = document.getElementById('searchInput');
  const savedCountBadge = document.getElementById('savedCountBadge');
  const sessionsListEl = document.getElementById('sessionsList');
  const emptyStateEl = document.getElementById('emptyState');
  const openDashboardBtn = document.getElementById('openDashboardBtn');
  const toastEl = document.getElementById('toast');

  // State
  let currentWindowTabs = [];
  let selectedTabIds = new Set();
  let selectedColor = PRESET_COLORS[0];
  let savedSessions = [];
  let activeRestoreMenu = null;

  // Initialize
  initColorPicker();
  await loadCurrentWindowTabs();
  await loadSavedSessions();
  setupEventListeners();

  /**
   * Render color picker dots
   */
  function initColorPicker() {
    colorPickerRow.innerHTML = '';
    PRESET_COLORS.forEach((color, idx) => {
      const dot = document.createElement('div');
      dot.className = `color-dot ${idx === 0 ? 'active' : ''}`;
      dot.style.backgroundColor = color;
      dot.dataset.color = color;
      dot.title = `Color tag: ${color}`;
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        selectedColor = color;
      });
      colorPickerRow.appendChild(dot);
    });
  }

  /**
   * Query tabs in the current active window
   */
  async function loadCurrentWindowTabs() {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
      
      // Filter out internal extension popups or blank special tabs if any
      currentWindowTabs = tabs.filter(t => t.url && !t.url.startsWith('chrome-extension://'));
      selectedTabIds = new Set(currentWindowTabs.map(t => t.id));

      const tabCount = currentWindowTabs.length;
      const memEst = TablyStorage.estimateMemorySaved(tabCount);
      openTabsCountEl.textContent = `${tabCount} tabs (~${memEst} RAM)`;

      // Smart placeholder / pre-fill
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const activeTab = currentWindowTabs.find(t => t.active);
      if (activeTab && activeTab.title && !activeTab.title.startsWith('http') && !activeTab.title.startsWith('New Tab')) {
        const cleanTitle = activeTab.title.replace(/[^\w\s-]/gi, '').trim().slice(0, 30);
        sessionNameInput.placeholder = `${cleanTitle} & ${tabCount - 1} more tabs`;
      } else {
        sessionNameInput.placeholder = `Work Session • ${timeStr}`;
      }

      renderCurrentTabsList();
      updateSelectedCountDisplay();
    } catch (err) {
      console.error('Error querying tabs:', err);
      openTabsCountEl.textContent = 'Tabs ready';
    }
  }

  /**
   * Render the collapsible current tabs list
   */
  function renderCurrentTabsList() {
    tabsScrollArea.innerHTML = '';
    currentWindowTabs.forEach(tab => {
      const row = document.createElement('label');
      row.className = 'tab-item-row';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedTabIds.has(tab.id);
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selectedTabIds.add(tab.id);
        } else {
          selectedTabIds.delete(tab.id);
        }
        updateSelectedCountDisplay();
      });

      const fav = document.createElement('img');
      fav.className = 'tab-favicon';
      fav.src = tab.favIconUrl || TablyStorage.getFaviconFallback(tab.url);
      fav.onerror = () => { fav.style.display = 'none'; };

      const title = document.createElement('span');
      title.className = 'tab-title-text';
      title.textContent = tab.title || tab.url;
      title.title = tab.url;

      row.appendChild(cb);
      row.appendChild(fav);
      row.appendChild(title);
      tabsScrollArea.appendChild(row);
    });
  }

  /**
   * Update selected count UI text
   */
  function updateSelectedCountDisplay() {
    const total = currentWindowTabs.length;
    const selected = selectedTabIds.size;
    selectedCountText.textContent = `${selected}/${total} selected`;
    selectAllTabsCheckbox.checked = (selected === total && total > 0);

    const summaryEl = document.getElementById('tabSelectSummary');
    if (selected === total) {
      summaryEl.textContent = `Includes all ${total} tabs`;
    } else {
      summaryEl.textContent = `Selected ${selected} of ${total} tabs`;
    }
  }

  /**
   * Load and render saved sessions from storage
   */
  async function loadSavedSessions() {
    savedSessions = await TablyStorage.getSessions();
    renderSavedSessions();
  }

  /**
   * Render saved sessions list with search filtering
   */
  function renderSavedSessions() {
    const query = (searchInput.value || '').trim().toLowerCase();
    sessionsListEl.innerHTML = '';

    const filtered = savedSessions.filter(session => {
      if (!query) return true;
      if (session.name.toLowerCase().includes(query)) return true;
      return session.tabs.some(t => 
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.url && t.url.toLowerCase().includes(query))
      );
    });

    savedCountBadge.textContent = savedSessions.length.toString();

    if (savedSessions.length === 0) {
      emptyStateEl.classList.remove('hidden');
      sessionsListEl.classList.add('hidden');
      return;
    }

    emptyStateEl.classList.add('hidden');
    sessionsListEl.classList.remove('hidden');

    if (filtered.length === 0) {
      sessionsListEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px;">
          No tab sets match "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
      return;
    }

    filtered.forEach(session => {
      const card = createSessionCard(session);
      sessionsListEl.appendChild(card);
    });
  }

  /**
   * Create an individual Session Card element
   */
  function createSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.dataset.sessionId = session.id;

    // Top Row
    const topRow = document.createElement('div');
    topRow.className = 'session-card-top';

    const nameGroup = document.createElement('div');
    nameGroup.className = 'session-name-group';

    const indicator = document.createElement('div');
    indicator.className = 'session-indicator';
    indicator.style.backgroundColor = session.color || '#0071e3';

    const titleEl = document.createElement('span');
    titleEl.className = 'session-title';
    titleEl.textContent = session.name;
    titleEl.title = 'Click to rename';
    titleEl.addEventListener('click', () => handleInlineRename(session, titleEl));

    nameGroup.appendChild(indicator);
    nameGroup.appendChild(titleEl);

    const meta = document.createElement('div');
    meta.className = 'session-meta';

    const tabsCount = document.createElement('span');
    tabsCount.className = 'session-tabs-count';
    tabsCount.textContent = `${session.tabs.length} tabs`;

    const timeAgo = document.createElement('span');
    timeAgo.textContent = TablyStorage.formatTimeAgo(session.createdAt);

    meta.appendChild(tabsCount);
    meta.appendChild(timeAgo);

    topRow.appendChild(nameGroup);
    topRow.appendChild(meta);

    // Favicons Preview Strip
    const favStrip = document.createElement('div');
    favStrip.className = 'session-favicons-preview';
    const previewTabs = session.tabs.slice(0, 7);
    previewTabs.forEach(t => {
      const img = document.createElement('img');
      img.className = 'preview-fav';
      img.src = t.favIconUrl || TablyStorage.getFaviconFallback(t.url);
      img.title = t.title;
      img.onerror = () => { img.style.display = 'none'; };
      favStrip.appendChild(img);
    });

    if (session.tabs.length > 7) {
      const more = document.createElement('span');
      more.className = 'more-tabs-badge';
      more.textContent = `+${session.tabs.length - 7}`;
      favStrip.appendChild(more);
    }

    // Actions Row
    const actionsRow = document.createElement('div');
    actionsRow.className = 'session-actions';

    // Restore Button Group
    const restoreGroup = document.createElement('div');
    restoreGroup.className = 'restore-btn-group';

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn-restore';
    restoreBtn.title = 'Open all tabs in a new window';
    restoreBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Restore All</span>
    `;
    restoreBtn.addEventListener('click', () => restoreSession(session, 'new_window'));

    const dropdownTrigger = document.createElement('button');
    dropdownTrigger.className = 'btn-restore-dropdown-trigger';
    dropdownTrigger.title = 'More restore options';
    dropdownTrigger.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleRestoreMenu(card, session);
    });

    restoreGroup.appendChild(restoreBtn);
    restoreGroup.appendChild(dropdownTrigger);

    // Tools
    const tools = document.createElement('div');
    tools.className = 'session-tools';

    // Toggle expand tabs button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'tool-btn';
    expandBtn.title = 'View individual tabs';
    expandBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
    `;
    expandBtn.addEventListener('click', () => toggleExpandedTabs(card, session));

    // Edit Name button
    const editBtn = document.createElement('button');
    editBtn.className = 'tool-btn';
    editBtn.title = 'Rename this set';
    editBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', () => handleInlineRename(session, titleEl));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tool-btn delete';
    deleteBtn.title = 'Delete this saved set';
    deleteBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    deleteBtn.addEventListener('click', () => handleDeleteSession(session));

    tools.appendChild(expandBtn);
    tools.appendChild(editBtn);
    tools.appendChild(deleteBtn);

    actionsRow.appendChild(restoreGroup);
    actionsRow.appendChild(tools);

    card.appendChild(topRow);
    card.appendChild(favStrip);
    card.appendChild(actionsRow);

    return card;
  }

  /**
   * Toggle expanded view of individual tabs in a session
   */
  function toggleExpandedTabs(card, session) {
    let existing = card.querySelector('.session-expanded-tabs');
    if (existing) {
      existing.remove();
      return;
    }

    const container = document.createElement('div');
    container.className = 'session-expanded-tabs';

    session.tabs.forEach((tab, tabIdx) => {
      const tabRow = document.createElement('div');
      tabRow.className = 'expanded-tab-item';

      const left = document.createElement('div');
      left.className = 'expanded-tab-left';
      left.title = tab.url;

      const fav = document.createElement('img');
      fav.className = 'tab-favicon';
      fav.src = tab.favIconUrl || TablyStorage.getFaviconFallback(tab.url);
      fav.onerror = () => { fav.style.display = 'none'; };

      const title = document.createElement('span');
      title.className = 'expanded-tab-title';
      title.textContent = tab.title || tab.url;

      left.appendChild(fav);
      left.appendChild(title);
      left.addEventListener('click', () => {
        chrome.tabs.create({ url: tab.url, active: true });
        showToast(`Opening "${tab.title.slice(0, 20)}..."`);
      });

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-tab-btn';
      removeBtn.title = 'Remove this tab from set';
      removeBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await TablyStorage.removeTabFromSession(session.id, tabIdx);
        showToast('Tab removed');
        await loadSavedSessions();
      });

      tabRow.appendChild(left);
      tabRow.appendChild(removeBtn);
      container.appendChild(tabRow);
    });

    card.appendChild(container);
  }

  /**
   * Toggle Restore dropdown options
   */
  function toggleRestoreMenu(card, session) {
    if (activeRestoreMenu) {
      activeRestoreMenu.remove();
      activeRestoreMenu = null;
      return;
    }

    const menu = document.createElement('div');
    menu.className = 'restore-menu';

    const optNewWin = document.createElement('button');
    optNewWin.className = 'menu-item';
    optNewWin.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      </svg>
      <span>Open in New Window</span>
    `;
    optNewWin.addEventListener('click', () => {
      menu.remove();
      restoreSession(session, 'new_window');
    });

    const optCurWin = document.createElement('button');
    optCurWin.className = 'menu-item';
    optCurWin.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Add to Current Window</span>
    `;
    optCurWin.addEventListener('click', () => {
      menu.remove();
      restoreSession(session, 'current_window');
    });

    const optGroup = document.createElement('button');
    optGroup.className = 'menu-item';
    optGroup.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      <span>Open as Tab Group</span>
    `;
    optGroup.addEventListener('click', () => {
      menu.remove();
      restoreSession(session, 'tab_group');
    });

    const optConsume = document.createElement('button');
    optConsume.className = 'menu-item';
    optConsume.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Open & Delete Set</span>
    `;
    optConsume.addEventListener('click', async () => {
      menu.remove();
      await restoreSession(session, 'new_window');
      await TablyStorage.deleteSession(session.id);
      await loadSavedSessions();
    });

    menu.appendChild(optNewWin);
    menu.appendChild(optCurWin);
    menu.appendChild(optGroup);
    menu.appendChild(optConsume);

    card.appendChild(menu);
    activeRestoreMenu = menu;

    // Close when clicking outside
    const closeListener = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        activeRestoreMenu = null;
        document.removeEventListener('click', closeListener);
      }
    };
    setTimeout(() => document.addEventListener('click', closeListener), 10);
  }

  /**
   * Restore tabs according to chosen mode
   */
  async function restoreSession(session, mode) {
    if (!session.tabs || session.tabs.length === 0) {
      showToast('No tabs in this set!');
      return;
    }

    try {
      const urls = session.tabs.map(t => t.url);

      if (mode === 'new_window') {
        const win = await chrome.windows.create({ url: urls });
        showToast(`Restored ${urls.length} tabs in new window!`);
      } else if (mode === 'tab_group') {
        // Create tabs in current window and group them
        const createdTabIds = [];
        for (const tabInfo of session.tabs) {
          const t = await chrome.tabs.create({ url: tabInfo.url, active: false });
          createdTabIds.push(t.id);
        }

        if (chrome.tabs.group && createdTabIds.length > 0) {
          const groupId = await chrome.tabs.group({ tabIds: createdTabIds });
          // Map session hex color to standard chrome group color if possible
          const groupColor = mapToChromeGroupColor(session.color);
          await chrome.tabGroups.update(groupId, {
            title: session.name,
            color: groupColor
          });
        }
        showToast(`Restored as group "${session.name}"!`);
      } else {
        // current_window
        for (const tabInfo of session.tabs) {
          await chrome.tabs.create({ url: tabInfo.url, active: false });
        }
        showToast(`Opened ${urls.length} tabs in this window!`);
      }
    } catch (err) {
      console.error('Failed to restore tabs:', err);
      showToast('Error restoring tabs');
    }
  }

  /**
   * Map hex color to Chrome TabGroup supported colors:
   * 'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'
   */
  function mapToChromeGroupColor(hex) {
    switch (hex) {
      case '#0071e3': return 'blue';
      case '#30d158': return 'green';
      case '#ff9f0a': return 'yellow';
      case '#ff453a': return 'red';
      case '#bf5af2': return 'purple';
      case '#5e5ce6': return 'purple';
      case '#64d2ff': return 'cyan';
      case '#8e8e93': return 'grey';
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
   * Inline renaming for a session
   */
  function handleInlineRename(session, titleElement) {
    const currentName = session.name;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'session-name-input';
    input.style.padding = '2px 6px';
    input.style.fontSize = '12px';

    const commitRename = async () => {
      const newName = input.value.trim() || currentName;
      if (newName !== currentName) {
        await TablyStorage.updateSession(session.id, { name: newName });
        showToast('Set renamed');
        await loadSavedSessions();
      } else {
        titleElement.textContent = currentName;
      }
    };

    input.addEventListener('blur', commitRename);
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
   * Delete session handler
   */
  async function handleDeleteSession(session) {
    if (confirm(`Delete tab set "${session.name}"?`)) {
      await TablyStorage.deleteSession(session.id);
      showToast('Tab set deleted');
      await loadSavedSessions();
    }
  }

  /**
   * Save tabs action (with close option)
   */
  async function handleSaveTabs(shouldClose) {
    const tabsToSave = currentWindowTabs.filter(t => selectedTabIds.has(t.id));
    if (tabsToSave.length === 0) {
      showToast('Please select at least 1 tab to save!');
      return;
    }

    const rawName = sessionNameInput.value.trim();
    const sessionName = rawName || sessionNameInput.placeholder || 'Saved Tabs';

    saveAndCloseBtn.disabled = true;
    saveOnlyBtn.disabled = true;

    try {
      await TablyStorage.saveSession({
        name: sessionName,
        tabs: tabsToSave,
        color: selectedColor
      });

      const tabCount = tabsToSave.length;
      const memSaved = TablyStorage.estimateMemorySaved(tabCount);

      if (shouldClose) {
        // If closing all tabs in this window, create a new blank tab first so Chrome window remains open
        const allTabIdsInWindow = currentWindowTabs.map(t => t.id);
        const closingAll = (tabsToSave.length >= allTabIdsInWindow.length);

        if (closingAll) {
          await chrome.tabs.create({ url: 'chrome://newtab/' });
        }

        const idsToClose = tabsToSave.map(t => t.id).filter(Boolean);
        await chrome.tabs.remove(idsToClose);

        showToast(`Saved & closed ${tabCount} tabs! (~${memSaved} freed)`);
      } else {
        showToast(`Saved ${tabCount} tabs to "${sessionName}"!`);
      }

      sessionNameInput.value = '';
      await loadCurrentWindowTabs();
      await loadSavedSessions();
    } catch (err) {
      console.error('Failed to save session:', err);
      showToast('Error saving tabs');
    } finally {
      saveAndCloseBtn.disabled = false;
      saveOnlyBtn.disabled = false;
    }
  }

  /**
   * Setup UI Event Listeners
   */
  function setupEventListeners() {
    // Expand/Collapse tab picker list
    tabSelectToggle.addEventListener('click', () => {
      const isCollapsed = currentTabsList.classList.contains('collapsed');
      if (isCollapsed) {
        currentTabsList.classList.remove('collapsed');
        tabSelectToggle.classList.add('expanded');
      } else {
        currentTabsList.classList.add('collapsed');
        tabSelectToggle.classList.remove('expanded');
      }
    });

    // Select all checkbox
    selectAllTabsCheckbox.addEventListener('change', () => {
      const checked = selectAllTabsCheckbox.checked;
      if (checked) {
        selectedTabIds = new Set(currentWindowTabs.map(t => t.id));
      } else {
        selectedTabIds.clear();
      }
      renderCurrentTabsList();
      updateSelectedCountDisplay();
    });

    // Save & Close button (frees memory)
    saveAndCloseBtn.addEventListener('click', () => handleSaveTabs(true));

    // Save Only button
    saveOnlyBtn.addEventListener('click', () => handleSaveTabs(false));

    // Search input
    searchInput.addEventListener('input', () => {
      renderSavedSessions();
    });

    // Dashboard button
    openDashboardBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    });

    // Enter key in session name input triggers Save & Close
    sessionNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSaveTabs(true);
      }
    });
  }

  /**
   * Toast helper
   */
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');

    toastTimer = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2800);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
