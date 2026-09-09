/**
 * SF DataForge - Storage Service
 * Handles Templates, Generation History, and Configuration Persistence
 */

const STORAGE_KEYS = {
  TEMPLATES: 'sf_dataforge_templates',
  HISTORY: 'sf_dataforge_history',
  SETTINGS: 'sf_dataforge_settings'
};

class StorageService {
  /**
   * Safe getter for chrome.storage or fallback to localStorage
   */
  static async get(key, defaultValue = null) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] !== undefined ? result[key] : defaultValue);
        });
      });
    } else {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    }
  }

  /**
   * Safe setter for chrome.storage or fallback to localStorage
   */
  static async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve(true));
      });
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Storage set failed', e);
        return false;
      }
    }
  }

  // --- TEMPLATES ---

  static async getTemplates() {
    return await this.get(STORAGE_KEYS.TEMPLATES, []);
  }

  static async saveTemplate(template) {
    const templates = await this.getTemplates();
    const newTemplate = {
      id: template.id || 'tpl_' + Date.now(),
      name: template.name || 'Untitled Template',
      objectName: template.objectName,
      objectLabel: template.objectLabel,
      fieldConfigs: template.fieldConfigs, // map of fieldApiName -> generator config
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const index = templates.findIndex(t => t.id === newTemplate.id);
    if (index >= 0) {
      templates[index] = newTemplate;
    } else {
      templates.unshift(newTemplate);
    }

    await this.set(STORAGE_KEYS.TEMPLATES, templates);
    return newTemplate;
  }

  static async deleteTemplate(templateId) {
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    await this.set(STORAGE_KEYS.TEMPLATES, filtered);
    return true;
  }

  // --- HISTORY ---

  static async getHistory() {
    return await this.get(STORAGE_KEYS.HISTORY, []);
  }

  static async logGeneration(historyEntry) {
    const history = await this.getHistory();
    const entry = {
      id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      objectName: historyEntry.objectName,
      objectLabel: historyEntry.objectLabel,
      recordCount: historyEntry.recordCount,
      successCount: historyEntry.successCount || 0,
      failureCount: historyEntry.failureCount || 0,
      status: historyEntry.status || 'success', // 'success', 'partial', 'failed'
      records: historyEntry.records || [], // generated records or created IDs
      createdIds: historyEntry.createdIds || [],
      errors: historyEntry.errors || [],
      instanceUrl: historyEntry.instanceUrl || ''
    };

    // Keep the most recent 100 entries to prevent storage bloat
    const updated = [entry, ...history].slice(0, 100);
    await this.set(STORAGE_KEYS.HISTORY, updated);
    return entry;
  }

  static async clearHistory() {
    await this.set(STORAGE_KEYS.HISTORY, []);
    return true;
  }

  // --- SETTINGS ---

  static async getSettings() {
    return await this.get(STORAGE_KEYS.SETTINGS, {
      apiVersion: 'v60.0',
      instanceUrl: '',
      manualSessionId: '',
      useMockMode: false
    });
  }

  static async saveSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageService;
}
