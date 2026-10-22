/**
 * Tably Storage & Utilities Module
 * Handles persistence, tab data shaping, and session management.
 */

const STORAGE_KEYS = {
  SESSIONS: 'tably_sessions',
  SETTINGS: 'tably_settings',
  STATS: 'tably_stats',
  LEGACY_SESSIONS: 'tab_vault_sessions',
  LEGACY_SETTINGS: 'tab_vault_settings',
  LEGACY_STATS: 'tab_vault_stats'
};

const DEFAULT_SETTINGS = {
  defaultRestoreMode: 'new_window', // 'new_window' | 'current_window' | 'tab_group'
  closeTabsAfterSave: true,
  autoPinSavedTabs: false,
  theme: 'dark'
};

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444'  // Rose
];

const TablyStorage = {
  /**
   * Retrieve all saved tab sessions
   * @returns {Promise<Array>}
   */
  async getSessions() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.SESSIONS, STORAGE_KEYS.LEGACY_SESSIONS], (result) => {
        let sessions = result[STORAGE_KEYS.SESSIONS];
        if (!sessions && result[STORAGE_KEYS.LEGACY_SESSIONS]) {
          sessions = result[STORAGE_KEYS.LEGACY_SESSIONS];
          // Migrate smoothly
          chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions });
        }
        resolve(sessions || []);
      });
    });
  },

  /**
   * Save a new tab session
   * @param {Object} sessionData
   * @returns {Promise<Object>} The created session
   */
  async saveSession({ name, tabs, color }) {
    const sessions = await this.getSessions();
    const newSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: (name && name.trim()) ? name.trim() : `Session - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      color: color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      createdAt: Date.now(),
      tabs: tabs.map(tab => ({
        id: tab.id,
        title: tab.title || 'Untitled Tab',
        url: tab.url || 'about:blank',
        favIconUrl: tab.favIconUrl || this.getFaviconFallback(tab.url),
        pinned: Boolean(tab.pinned),
        groupId: tab.groupId || -1
      }))
    };

    sessions.unshift(newSession); // Add newest to top
    await new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions }, resolve);
    });

    await this.updateTotalStats(tabs.length);
    this.broadcastUpdate();
    return newSession;
  },

  /**
   * Update an existing session's name, color, or tabs
   * @param {string} sessionId
   * @param {Object} updates
   * @returns {Promise<Array>}
   */
  async updateSession(sessionId, updates) {
    const sessions = await this.getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      await new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions }, resolve);
      });
      this.broadcastUpdate();
    }
    return sessions;
  },

  /**
   * Delete a session
   * @param {string} sessionId
   * @returns {Promise<Array>}
   */
  async deleteSession(sessionId) {
    let sessions = await this.getSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    await new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions }, resolve);
    });
    this.broadcastUpdate();
    return sessions;
  },

  /**
   * Remove a single tab from a session
   * @param {string} sessionId
   * @param {number} tabIndex
   */
  async removeTabFromSession(sessionId, tabIndex) {
    const sessions = await this.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.tabs) {
      session.tabs.splice(tabIndex, 1);
      // If no tabs remain, we can either keep empty or delete; let's keep or remove if requested
      await new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions }, resolve);
      });
      this.broadcastUpdate();
    }
    return sessions;
  },

  /**
   * Get user settings
   * @returns {Promise<Object>}
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.LEGACY_SETTINGS], (result) => {
        const saved = result[STORAGE_KEYS.SETTINGS] || result[STORAGE_KEYS.LEGACY_SETTINGS] || {};
        resolve({ ...DEFAULT_SETTINGS, ...saved });
      });
    });
  },

  /**
   * Save user settings
   * @param {Object} settings
   */
  async saveSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated }, resolve);
    });
    return updated;
  },

  /**
   * Get overall stats (total saved tabs, lifetime saved)
   */
  async getStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.STATS, STORAGE_KEYS.LEGACY_STATS], (result) => {
        resolve(result[STORAGE_KEYS.STATS] || result[STORAGE_KEYS.LEGACY_STATS] || { lifetimeTabsSaved: 0 });
      });
    });
  },

  /**
   * Update stats counter
   */
  async updateTotalStats(addedTabsCount) {
    const stats = await this.getStats();
    stats.lifetimeTabsSaved = (stats.lifetimeTabsSaved || 0) + addedTabsCount;
    await new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats }, resolve);
    });
  },

  /**
   * Broadcast badge/storage update to background script
   */
  broadcastUpdate() {
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'UPDATE_BADGE' }, () => {
          // Ignore errors if no listener is open
          if (chrome.runtime.lastError) {}
        });
      }
    } catch (e) {}
  },

  /**
   * Memory estimation: Average Chrome tab consumes approx 150-200MB RAM.
   * @param {number} tabCount
   * @returns {string} e.g. "1.2 GB" or "450 MB"
   */
  estimateMemorySaved(tabCount) {
    const avgMbPerTab = 180;
    const totalMb = tabCount * avgMbPerTab;
    if (totalMb >= 1000) {
      return `${(totalMb / 1024).toFixed(1)} GB`;
    }
    return `${totalMb} MB`;
  },

  /**
   * Fallback favicon helper
   */
  getFaviconFallback(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
    } catch {
      return '';
    }
  },

  /**
   * Human-friendly time formatting
   */
  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const elapsed = Date.now() - timestamp;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 45) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  },

  /**
   * Export all sessions as JSON string
   */
  async exportJSON() {
    const sessions = await this.getSessions();
    const settings = await this.getSettings();
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessions,
      settings
    }, null, 2);
  },

  /**
   * Import sessions from JSON string
   */
  async importJSON(jsonString, mode = 'merge') {
    const data = JSON.parse(jsonString);
    if (!data.sessions || !Array.isArray(data.sessions)) {
      throw new Error('Invalid format: Missing sessions array');
    }

    let existing = await this.getSessions();
    if (mode === 'replace') {
      existing = data.sessions;
    } else {
      // Merge unique by id or append
      const existingIds = new Set(existing.map(s => s.id));
      for (const s of data.sessions) {
        if (!existingIds.has(s.id)) {
          existing.push(s);
        } else {
          // Re-generate ID if conflict
          s.id = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          existing.push(s);
        }
      }
    }

    await new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: existing }, resolve);
    });
    this.broadcastUpdate();
    return existing;
  }
};

// Alias for backward compatibility
const TabVaultStorage = TablyStorage;

// Export for service worker if in module context, or window context
if (typeof self !== 'undefined') {
  self.TablyStorage = TablyStorage;
  self.TabVaultStorage = TablyStorage;
  self.PRESET_COLORS = PRESET_COLORS;
}
