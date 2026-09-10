/**
 * SF DataForge - Main Application Controller
 */

// Application State
const state = {
  activeTab: 'tab-generator',
  sfService: null,
  connection: null,
  sobjects: [],
  selectedObject: null,
  objectDescribe: null,
  fieldConfigs: {}, // fieldName -> { enabled, mode, pattern, fixedValue, picklistValue, min, max, referenceId }
  currentFilter: 'all', // 'all', 'required', 'selected'
  searchQuery: '',
  generatedPreviewRecords: [],
  lastBatchResult: null,

  // Data Cleaner (Deleter) State
  deleterSObject: '',
  deleterFilterPreset: 'all',
  deleterSearchQuery: '',
  deleterRecords: [],
  deleterFilteredRecords: [],
  deleterSelectedIds: new Set(),
  deleterTotalCount: 0,
  deleterPrimaryField: 'Name',
  pendingDeleteIds: []
};

// DOM Elements
const DOM = {};

document.addEventListener('DOMContentLoaded', async () => {
  cacheDOMElements();
  await initTheme();
  bindNavigationEvents();
  bindGeneratorEvents();
  bindDeleterEvents();
  bindFilterEvents();
  bindModalEvents();
  bindSettingsEvents();
  bindQuickActionEvents();
  bindAlertBannerEvents();
  bindGuardEvents();

  // Listen for active tab switching to re-check Salesforce tab status
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(() => {
      initializeConnection();
    });
  }

  // Initialize Salesforce Service
  state.sfService = new SalesforceService();
  await initializeConnection();
});

function cacheDOMElements() {
  DOM.connectionStatusPill = document.getElementById('connectionStatusPill');
  DOM.statusDot = document.getElementById('statusDot');
  DOM.statusText = document.getElementById('statusText');
  DOM.btnThemeToggle = document.getElementById('btnThemeToggle');
  DOM.themeToggleIcon = document.getElementById('themeToggleIcon');
  DOM.btnOpenSidePanel = document.getElementById('btnOpenSidePanel');
  DOM.btnOpenFullTab = document.getElementById('btnOpenFullTab');

  // Salesforce Exclusive Guard View
  DOM.notSalesforceView = document.getElementById('notSalesforceView');
  DOM.guardCurrentTabUrl = document.getElementById('guardCurrentTabUrl');
  DOM.guardDetectedBox = document.getElementById('guardDetectedBox');
  DOM.guardDetectedTitle = document.getElementById('guardDetectedTitle');
  DOM.guardDetectedUrl = document.getElementById('guardDetectedUrl');
  DOM.btnSwitchToSfTab = document.getElementById('btnSwitchToSfTab');
  DOM.btnOpenSalesforceLogin = document.getElementById('btnOpenSalesforceLogin');
  DOM.btnGuardTryDemo = document.getElementById('btnGuardTryDemo');

  // Session Alert Banner
  DOM.sessionAlertBanner = document.getElementById('sessionAlertBanner');
  DOM.sessionAlertMessage = document.getElementById('sessionAlertMessage');
  DOM.btnBannerRefresh = document.getElementById('btnBannerRefresh');
  DOM.btnBannerPasteToken = document.getElementById('btnBannerPasteToken');
  DOM.btnBannerDemo = document.getElementById('btnBannerDemo');

  // Quick Token Modal
  DOM.quickTokenModal = document.getElementById('quickTokenModal');
  DOM.quickInstanceUrl = document.getElementById('quickInstanceUrl');
  DOM.quickSessionToken = document.getElementById('quickSessionToken');
  DOM.btnCloseQuickToken = document.getElementById('btnCloseQuickToken');
  DOM.btnCancelQuickToken = document.getElementById('btnCancelQuickToken');
  DOM.btnSaveQuickToken = document.getElementById('btnSaveQuickToken');

  // Picklist Values Modal
  DOM.picklistValuesModal = document.getElementById('picklistValuesModal');
  DOM.picklistModalTitle = document.getElementById('picklistModalTitle');
  DOM.picklistModalSubtitle = document.getElementById('picklistModalSubtitle');
  DOM.btnClosePicklistModal = document.getElementById('btnClosePicklistModal');
  DOM.btnDonePicklistModal = document.getElementById('btnDonePicklistModal');
  DOM.btnSelectRandomPicklist = document.getElementById('btnSelectRandomPicklist');
  DOM.picklistSearchInput = document.getElementById('picklistSearchInput');
  DOM.picklistModalTableBody = document.getElementById('picklistModalTableBody');

  // Tabs
  DOM.navTabs = document.querySelectorAll('.nav-tab');
  DOM.tabPanels = document.querySelectorAll('.tab-panel');

  // Generator
  DOM.sobjectSelect = document.getElementById('sobjectSelect');
  DOM.objectTypeBadge = document.getElementById('objectTypeBadge');
  DOM.recordCountInput = document.getElementById('recordCountInput');
  DOM.btnCountDec = document.getElementById('btnCountDec');
  DOM.btnCountInc = document.getElementById('btnCountInc');
  DOM.destinationSelect = document.getElementById('destinationSelect');

  // Fields Table & Toolbar
  DOM.fieldSearchInput = document.getElementById('fieldSearchInput');
  DOM.btnClearSearch = document.getElementById('btnClearSearch');
  DOM.btnFilterAll = document.getElementById('btnFilterAll');
  DOM.btnFilterRequired = document.getElementById('btnFilterRequired');
  DOM.btnFilterSelected = document.getElementById('btnFilterSelected');
  DOM.totalFieldsCount = document.getElementById('totalFieldsCount');
  DOM.reqFieldsCount = document.getElementById('reqFieldsCount');
  DOM.selectedFieldsCount = document.getElementById('selectedFieldsCount');
  DOM.btnSelectAllRequired = document.getElementById('btnSelectAllRequired');
  DOM.btnSelectAll = document.getElementById('btnSelectAll');
  DOM.btnDeselectAll = document.getElementById('btnDeselectAll');
  DOM.selectAllCheckbox = document.getElementById('selectAllCheckbox');
  DOM.fieldsLoading = document.getElementById('fieldsLoading');
  DOM.fieldsEmpty = document.getElementById('fieldsEmpty');
  DOM.fieldsTable = document.getElementById('fieldsTable');
  DOM.fieldsTableBody = document.getElementById('fieldsTableBody');

  // Footer
  DOM.footerSelectedSummary = document.getElementById('footerSelectedSummary');
  DOM.footerRecordsSummary = document.getElementById('footerRecordsSummary');
  DOM.btnPreviewData = document.getElementById('btnPreviewData');
  DOM.btnOpenSaveTemplateModal = document.getElementById('btnOpenSaveTemplateModal');
  DOM.btnGenerate = document.getElementById('btnGenerate');
  DOM.btnGenerateText = document.getElementById('btnGenerateText');

  // Modals
  DOM.previewModal = document.getElementById('previewModal');
  DOM.previewSubtitle = document.getElementById('previewSubtitle');
  DOM.previewTableWrapper = document.getElementById('previewTableWrapper');
  DOM.btnClosePreview = document.getElementById('btnClosePreview');
  DOM.btnExportPreviewCsv = document.getElementById('btnExportPreviewCsv');
  DOM.btnExportPreviewJson = document.getElementById('btnExportPreviewJson');
  DOM.btnConfirmInsert = document.getElementById('btnConfirmInsert');

  DOM.saveTemplateModal = document.getElementById('saveTemplateModal');
  DOM.templateNameInput = document.getElementById('templateNameInput');
  DOM.templateSummaryNote = document.getElementById('templateSummaryNote');
  DOM.btnCloseSaveTemplate = document.getElementById('btnCloseSaveTemplate');
  DOM.btnCancelSaveTemplate = document.getElementById('btnCancelSaveTemplate');
  DOM.btnConfirmSaveTemplate = document.getElementById('btnConfirmSaveTemplate');

  DOM.progressModal = document.getElementById('progressModal');
  DOM.progressTitle = document.getElementById('progressTitle');
  DOM.progressBarFill = document.getElementById('progressBarFill');
  DOM.progressStatusText = document.getElementById('progressStatusText');
  DOM.resultsSummarySection = document.getElementById('resultsSummarySection');
  DOM.statSuccessCount = document.getElementById('statSuccessCount');
  DOM.statFailedBadge = document.getElementById('statFailedBadge');
  DOM.statFailedCount = document.getElementById('statFailedCount');
  DOM.createdIdsList = document.getElementById('createdIdsList');
  DOM.btnDownloadBatchCsv = document.getElementById('btnDownloadBatchCsv');
  DOM.btnCloseProgress = document.getElementById('btnCloseProgress');

  // Templates Tab
  DOM.templatesList = document.getElementById('templatesList');
  DOM.templatesEmpty = document.getElementById('templatesEmpty');

  // History Tab
  DOM.historyList = document.getElementById('historyList');
  DOM.historyEmpty = document.getElementById('historyEmpty');
  DOM.btnClearHistory = document.getElementById('btnClearHistory');

  // Settings Tab
  DOM.authModeAuto = document.getElementById('authModeAuto');
  DOM.authModeDemo = document.getElementById('authModeDemo');
  DOM.authModeManual = document.getElementById('authModeManual');
  DOM.manualAuthSection = document.getElementById('manualAuthSection');
  DOM.settingInstanceUrl = document.getElementById('settingInstanceUrl');
  DOM.settingSessionId = document.getElementById('settingSessionId');
  DOM.settingApiVersion = document.getElementById('settingApiVersion');
  DOM.btnSaveSettings = document.getElementById('btnSaveSettings');
  DOM.btnRefreshSession = document.getElementById('btnRefreshSession');
  DOM.btnResetStorage = document.getElementById('btnResetStorage');

  // Data Cleaner (Deleter) Tab
  DOM.deleterSObjectSelect = document.getElementById('deleterSObjectSelect');
  DOM.deleterObjectTypeBadge = document.getElementById('deleterObjectTypeBadge');
  DOM.deleterTotalCard = document.getElementById('deleterTotalCard');
  DOM.deleterTotalCount = document.getElementById('deleterTotalCount');
  DOM.deleterFetchLimit = document.getElementById('deleterFetchLimit');
  DOM.btnRefreshDeleterRecords = document.getElementById('btnRefreshDeleterRecords');
  DOM.btnFilterPresetAll = document.getElementById('btnFilterPresetAll');
  DOM.btnFilterPresetToday = document.getElementById('btnFilterPresetToday');
  DOM.btnFilterPresetWeek = document.getElementById('btnFilterPresetWeek');
  DOM.btnFilterPresetTool = document.getElementById('btnFilterPresetTool');
  DOM.deleterSearchInput = document.getElementById('deleterSearchInput');
  DOM.btnClearDeleterSearch = document.getElementById('btnClearDeleterSearch');
  DOM.deleterTableStats = document.getElementById('deleterTableStats');
  DOM.deleterSelectedBadge = document.getElementById('deleterSelectedBadge');
  DOM.btnSelectAllDeleter = document.getElementById('btnSelectAllDeleter');
  DOM.btnDeselectAllDeleter = document.getElementById('btnDeselectAllDeleter');
  DOM.deleterLoading = document.getElementById('deleterLoading');
  DOM.deleterEmpty = document.getElementById('deleterEmpty');
  DOM.deleterTable = document.getElementById('deleterTable');
  DOM.deleterSelectAllCheckbox = document.getElementById('deleterSelectAllCheckbox');
  DOM.deleterThName = document.getElementById('deleterThName');
  DOM.deleterTableBody = document.getElementById('deleterTableBody');
  DOM.footerDeleterSelectedCount = document.getElementById('footerDeleterSelectedCount');
  DOM.footerDeleterWarning = document.getElementById('footerDeleterWarning');
  DOM.btnExecuteDeleteSelected = document.getElementById('btnExecuteDeleteSelected');
  DOM.btnDeleteSelectedText = document.getElementById('btnDeleteSelectedText');

  // Delete Confirmation Modal
  DOM.deleteConfirmModal = document.getElementById('deleteConfirmModal');
  DOM.btnCloseDeleteConfirm = document.getElementById('btnCloseDeleteConfirm');
  DOM.deleteConfirmCount = document.getElementById('deleteConfirmCount');
  DOM.deleteConfirmObject = document.getElementById('deleteConfirmObject');
  DOM.btnCancelDelete = document.getElementById('btnCancelDelete');
  DOM.btnConfirmDeleteExecute = document.getElementById('btnConfirmDeleteExecute');

  // Toast
  DOM.toastContainer = document.getElementById('toastContainer');
}

// ===================================================
// INITIALIZATION & CONNECTION
// ===================================================
async function initializeConnection() {
  updateConnectionStatus('connecting', 'Connecting...');
  hideSessionAlert();

  try {
    state.connection = await state.sfService.initConnection();

    // Strict Salesforce Guard Check
    if (state.connection.notOnSalesforce) {
      showNotSalesforceGuard(state.connection);
      updateConnectionStatus('offline', 'Not on Salesforce');
      return;
    }

    hideNotSalesforceGuard();

    if (state.connection.isMock) {
      updateConnectionStatus('demo', state.connection.orgName);
      showToast('Running in Demo Mode (Offline). Switch modes in Settings or navigate to a Salesforce tab.', 'info');
    } else if (state.connection.connected) {
      updateConnectionStatus('online', state.connection.orgName);
      showToast(`Connected to Salesforce: ${state.connection.orgName}`, 'success');
      hideSessionAlert();
    } else if (state.connection.sessionExpired) {
      updateConnectionStatus('offline', 'Session Expired');
      showSessionAlert(state.connection.reason || 'Salesforce session expired or restricted by IP policy.');
      showToast('Salesforce session expired or invalid. Please refresh tab or enter token.', 'error');
    }

    await loadSObjects();
  } catch (err) {
    console.error('Connection initialization error:', err);
    updateConnectionStatus('offline', 'Disconnected');
    showSessionAlert(err.message);
    showToast('Failed to connect to Salesforce: ' + err.message, 'error');
  }
}

function showNotSalesforceGuard(conn) {
  if (!DOM.notSalesforceView) return;
  DOM.notSalesforceView.style.display = 'flex';

  if (DOM.guardCurrentTabUrl) {
    let displayUrl = conn.currentTabUrl || 'Non-Salesforce Tab';
    try {
      if (conn.currentTabUrl) {
        const u = new URL(conn.currentTabUrl);
        displayUrl = `${u.protocol}//${u.hostname}${u.pathname}`;
      }
    } catch (e) {}
    DOM.guardCurrentTabUrl.textContent = displayUrl;
  }

  if (conn.hasOtherSfTab && conn.otherSfTab) {
    DOM.guardDetectedBox.style.display = 'flex';
    DOM.guardDetectedTitle.textContent = conn.otherSfTab.title || 'Open Salesforce Org';
    DOM.guardDetectedUrl.textContent = conn.otherSfTab.url;
    DOM.btnSwitchToSfTab.onclick = async () => {
      await chrome.runtime.sendMessage({
        action: 'SWITCH_TO_TAB',
        payload: { tabId: conn.otherSfTab.id }
      });
      setTimeout(() => initializeConnection(), 400);
    };
  } else {
    DOM.guardDetectedBox.style.display = 'none';
  }
}

function hideNotSalesforceGuard() {
  if (DOM.notSalesforceView) {
    DOM.notSalesforceView.style.display = 'none';
  }
}

function bindGuardEvents() {
  if (DOM.btnOpenSalesforceLogin) {
    DOM.btnOpenSalesforceLogin.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'OPEN_URL',
        payload: { url: 'https://login.salesforce.com' }
      });
    });
  }

  if (DOM.btnGuardTryDemo) {
    DOM.btnGuardTryDemo.addEventListener('click', async () => {
      hideNotSalesforceGuard();
      state.sfService.enableMockMode();
      updateConnectionStatus('demo', 'Demo Salesforce Sandbox (Offline)');
      showToast('Switched to Demo Mode (Offline).', 'info');
      await loadSObjects();
    });
  }
}

function updateConnectionStatus(status, text) {
  DOM.statusDot.className = 'status-indicator-dot ' + status;
  DOM.statusText.textContent = text || status;
  DOM.connectionStatusPill.title = `Salesforce: ${text} (${status})`;
}

function showSessionAlert(message) {
  if (DOM.sessionAlertBanner) {
    DOM.sessionAlertMessage.textContent = message || 'Salesforce session expired or restricted by IP.';
    DOM.sessionAlertBanner.style.display = 'flex';
  }
}

function hideSessionAlert() {
  if (DOM.sessionAlertBanner) {
    DOM.sessionAlertBanner.style.display = 'none';
  }
}

async function loadSObjects() {
  try {
    DOM.sobjectSelect.innerHTML = '<option value="" disabled selected>Loading SObjects...</option>';
    const objects = await state.sfService.getSObjectsList();
    state.sobjects = objects;

    DOM.sobjectSelect.innerHTML = '';
    
    // Group Standard vs Custom
    const standardGroup = document.createElement('optgroup');
    standardGroup.label = 'Standard Objects';
    const customGroup = document.createElement('optgroup');
    customGroup.label = 'Custom Objects';

    for (const obj of objects) {
      const option = document.createElement('option');
      option.value = obj.name;
      option.textContent = `${obj.label} (${obj.name})`;
      if (obj.custom) {
        customGroup.appendChild(option);
      } else {
        standardGroup.appendChild(option);
      }
    }

    if (standardGroup.children.length > 0) DOM.sobjectSelect.appendChild(standardGroup);
    if (customGroup.children.length > 0) DOM.sobjectSelect.appendChild(customGroup);

    // Also populate Data Cleaner object dropdown
    populateDeleterSObjects(objects);

    // Default to Account or first object
    const defaultObj = objects.find(o => o.name === 'Account') || objects[0];
    if (defaultObj) {
      DOM.sobjectSelect.value = defaultObj.name;
      await onSelectSObject(defaultObj.name);
    }
  } catch (err) {
    console.error('Error loading SObjects:', err);
    if (err.message.includes('401') || err.message.includes('Session expired')) {
      showSessionAlert(err.message);
    }
    showToast('Failed to load SObjects: ' + err.message, 'error');
  }
}

async function onSelectSObject(sObjectName) {
  state.selectedObject = sObjectName;
  const objMeta = state.sobjects.find(o => o.name === sObjectName);
  if (objMeta) {
    DOM.objectTypeBadge.textContent = objMeta.custom ? 'Custom Object' : 'Standard Object';
  }

  DOM.fieldsLoading.style.display = 'flex';
  DOM.fieldsTable.style.display = 'none';
  DOM.fieldsEmpty.style.display = 'none';

  try {
    const describe = await state.sfService.describeSObject(sObjectName);
    state.objectDescribe = describe;
    state.fieldConfigs = {};

    // Initialize default configs for createable fields
    let reqCount = 0;
    for (const field of describe.fields) {
      const isReq = field.required;
      if (isReq) reqCount++;
      const isPicklist = field.type === 'picklist' || field.type === 'multipicklist';

      let defaultMin = 0;
      let defaultMax = 1000;
      const fnLower = field.name.toLowerCase();
      const flLower = (field.label || '').toLowerCase();
      if (fnLower.includes('revenue') || flLower.includes('revenue')) {
        defaultMin = 500000;
        defaultMax = 25000000;
      } else if (fnLower.includes('salary') || flLower.includes('salary') || fnLower.includes('compensation')) {
        defaultMin = 65000;
        defaultMax = 220000;
      } else if (fnLower.includes('amount') || flLower.includes('amount') || fnLower.includes('budget') || flLower.includes('budget')) {
        defaultMin = 15000;
        defaultMax = 500000;
      } else if (fnLower.includes('employee') || flLower.includes('employee') || fnLower.includes('headcount')) {
        defaultMin = 15;
        defaultMax = 3500;
      } else if (field.type === 'percent' || fnLower.includes('discount') || flLower.includes('discount')) {
        defaultMin = 5;
        defaultMax = 30;
      } else if (field.type === 'percent') {
        defaultMin = 10;
        defaultMax = 95;
      }

      const isAddress = (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.isAddressField)
        ? GeneratorEngine.isAddressField(field.name, field.label)
        : (fnLower.includes('state') || fnLower.includes('country') || fnLower.includes('street') || fnLower.includes('city') || fnLower.includes('zip') || fnLower.includes('postal'));

      state.fieldConfigs[field.name] = {
        enabled: isReq, // Auto-enable required fields
        mode: (isPicklist && !isAddress) ? GeneratorEngine.MODES.PICKLIST : GeneratorEngine.MODES.REALISTIC,
        pattern: getDefaultPattern(field),
        fixedValue: '',
        picklistValue: '__RANDOM__',
        min: defaultMin,
        max: defaultMax,
        referenceId: ''
      };
    }

    DOM.totalFieldsCount.textContent = describe.fields.length;
    DOM.reqFieldsCount.textContent = reqCount;

    // Ensure if any State/StateCode is required, matching Country is enabled too
    ensureAddressFieldDependencies();

    renderFieldsTable();
    updateFooterSummary();
  } catch (err) {
    console.error('Describe error:', err);
    if (err.message.includes('401') || err.message.includes('Session expired')) {
      showSessionAlert(err.message);
    }
    showToast(`Failed to load fields for ${sObjectName}: ${err.message}`, 'error');
  } finally {
    DOM.fieldsLoading.style.display = 'none';
  }
}

function autoEnableDependentCountry(fieldName) {
  const pairs = {
    'MailingStateCode': 'MailingCountryCode',
    'MailingState': 'MailingCountry',
    'BillingStateCode': 'BillingCountryCode',
    'BillingState': 'BillingCountry',
    'ShippingStateCode': 'ShippingCountryCode',
    'ShippingState': 'ShippingCountry',
    'OtherStateCode': 'OtherCountryCode',
    'OtherState': 'OtherCountry',
    'StateCode': 'CountryCode',
    'State': 'Country'
  };

  let targetCountry = pairs[fieldName];
  if (!targetCountry) {
    const customMatch = fieldName.match(/^([a-z0-9_]+)__(statecode|state)__s$/i);
    if (customMatch) {
      const prefix = customMatch[1];
      const isCode = customMatch[2].toLowerCase() === 'statecode';
      targetCountry = isCode ? `${prefix}__CountryCode__s` : `${prefix}__Country__s`;
    }
  }

  if (targetCountry && state.fieldConfigs[targetCountry] && !state.fieldConfigs[targetCountry].enabled) {
    state.fieldConfigs[targetCountry].enabled = true;
    showToast(`Auto-enabled ${targetCountry} (required by Salesforce when ${fieldName} is selected)`, 'info');
    renderFieldsTable();
  }
}

function ensureAddressFieldDependencies() {
  const pairs = {
    'MailingStateCode': 'MailingCountryCode',
    'MailingState': 'MailingCountry',
    'BillingStateCode': 'BillingCountryCode',
    'BillingState': 'BillingCountry',
    'ShippingStateCode': 'ShippingCountryCode',
    'ShippingState': 'ShippingCountry',
    'OtherStateCode': 'OtherCountryCode',
    'OtherState': 'OtherCountry',
    'StateCode': 'CountryCode',
    'State': 'Country'
  };

  for (const [stateField, countryField] of Object.entries(pairs)) {
    if (state.fieldConfigs[stateField] && state.fieldConfigs[stateField].enabled) {
      if (state.fieldConfigs[countryField] && !state.fieldConfigs[countryField].enabled) {
        state.fieldConfigs[countryField].enabled = true;
      }
    }
  }

  for (const fieldName of Object.keys(state.fieldConfigs)) {
    const customMatch = fieldName.match(/^([a-z0-9_]+)__(statecode|state)__s$/i);
    if (customMatch && state.fieldConfigs[fieldName].enabled) {
      const prefix = customMatch[1];
      const isCode = customMatch[2].toLowerCase() === 'statecode';
      const targetCountry = isCode ? `${prefix}__CountryCode__s` : `${prefix}__Country__s`;
      if (state.fieldConfigs[targetCountry] && !state.fieldConfigs[targetCountry].enabled) {
        state.fieldConfigs[targetCountry].enabled = true;
      }
    }
  }
}

function getDefaultPattern(field) {
  const name = field.name.toLowerCase();
  const clean = (field.label || field.name).replace(/[^a-zA-Z0-9]/g, '');
  if (name === 'name') return `${clean}-{{batch}}-{{random:4}}`;
  if (name.includes('code') || name.includes('number') || name.includes('serial')) return `ID-{{batch}}-{{random:5}}`;
  return `${clean}-{{batch}}-{{random:3}}`;
}

// ===================================================
// FIELD TABLE RENDERING
// ===================================================
function renderFieldsTable() {
  if (!state.objectDescribe || !state.objectDescribe.fields) return;

  const fields = state.objectDescribe.fields;
  DOM.fieldsTableBody.innerHTML = '';

  let visibleCount = 0;
  const query = state.searchQuery.toLowerCase();

  for (const field of fields) {
    const config = state.fieldConfigs[field.name];
    if (!config) continue;

    // Filter Logic
    if (state.currentFilter === 'required' && !field.required) continue;
    if (state.currentFilter === 'selected' && !config.enabled) continue;

    if (query) {
      const labelMatch = (field.label || '').toLowerCase().includes(query);
      const nameMatch = field.name.toLowerCase().includes(query);
      const typeMatch = field.type.toLowerCase().includes(query);
      if (!labelMatch && !nameMatch && !typeMatch) continue;
    }

    visibleCount++;
    const tr = document.createElement('tr');
    if (config.enabled) tr.classList.add('row-selected');

    // 1. Checkbox
    const tdCheck = document.createElement('td');
    tdCheck.className = 'col-check';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = config.enabled;
    chk.addEventListener('change', (e) => {
      config.enabled = e.target.checked;
      tr.classList.toggle('row-selected', config.enabled);
      if (config.enabled) {
        autoEnableDependentCountry(field.name);
      }
      updateFooterSummary();
    });
    tdCheck.appendChild(chk);

    // 2. Field Info
    const tdField = document.createElement('td');
    tdField.className = 'col-field';
    tdField.innerHTML = `
      <div class="field-title-group">
        <span class="field-label-text">
          ${escapeHtml(field.label)}
          ${field.required ? '<span class="required-badge" title="Required Field">*</span>' : ''}
        </span>
        <span class="field-api-name">${escapeHtml(field.name)}</span>
      </div>
    `;

    // 3. Type Badge & Value Count
    const tdType = document.createElement('td');
    tdType.className = 'col-type';
    const isPicklist = field.type === 'picklist' || field.type === 'multipicklist';
    const pvList = field.picklistValues || [];
    if (isPicklist) {
      tdType.innerHTML = `
        <span class="type-badge type-${field.type.toLowerCase()}">${escapeHtml(field.type)}</span>
        <button type="button" class="pv-count-badge" title="Click to view all ${pvList.length} values">👁️ ${pvList.length} values</button>
      `;
      tdType.querySelector('.pv-count-badge').addEventListener('click', () => {
        openPicklistModal(field, config, tdValue.querySelector('select'), tdValue.querySelector('.picklist-quick-preview'));
      });
    } else {
      tdType.innerHTML = `<span class="type-badge type-${field.type.toLowerCase()}">${escapeHtml(field.type)}</span>`;
    }

    // 4. Generation Rule (Mode)
    const tdMode = document.createElement('td');
    tdMode.className = 'col-mode';
    const modeSelect = document.createElement('select');
    modeSelect.className = 'form-control table-input';
    
    const modes = [
      { value: GeneratorEngine.MODES.REALISTIC, label: '✨ Realistic (Smart)' },
      { value: GeneratorEngine.MODES.PATTERN, label: '📝 Pattern / Formula' },
      { value: GeneratorEngine.MODES.FIXED, label: '📌 Fixed Value' }
    ];

    if (field.type === 'picklist' || field.type === 'multipicklist') {
      modes.push({ value: GeneratorEngine.MODES.PICKLIST, label: '🎯 Picklist Option' });
    }
    if (!field.required) {
      modes.push({ value: GeneratorEngine.MODES.EMPTY, label: '∅ Leave Null' });
    }

    for (const m of modes) {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = m.label;
      if (config.mode === m.value) opt.selected = true;
      modeSelect.appendChild(opt);
    }

    modeSelect.addEventListener('change', (e) => {
      config.mode = e.target.value;
      renderConfigInput(tdValue, field, config);
    });
    tdMode.appendChild(modeSelect);

    // 5. Value / Pattern Config Input
    const tdValue = document.createElement('td');
    tdValue.className = 'col-value';
    renderConfigInput(tdValue, field, config);

    tr.appendChild(tdCheck);
    tr.appendChild(tdField);
    tr.appendChild(tdType);
    tr.appendChild(tdMode);
    tr.appendChild(tdValue);

    DOM.fieldsTableBody.appendChild(tr);
  }

  if (visibleCount === 0) {
    DOM.fieldsTable.style.display = 'none';
    DOM.fieldsEmpty.style.display = 'flex';
  } else {
    DOM.fieldsTable.style.display = 'table';
    DOM.fieldsEmpty.style.display = 'none';
  }
}

function renderConfigInput(container, field, config) {
  container.innerHTML = '';

  // Mode: Pattern
  if (config.mode === GeneratorEngine.MODES.PATTERN) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control table-input';
    input.value = config.pattern || '';
    input.placeholder = 'e.g. Acme-{{seq:100}}-{{random:3}}';
    input.title = 'Available tags: {{index}}, {{seq:START}}, {{random:N}}, {{timestamp}}, {{date}}, {{uuid}}';
    input.addEventListener('input', (e) => { config.pattern = e.target.value; });
    container.appendChild(input);
    return;
  }

  // Mode: Fixed
  if (config.mode === GeneratorEngine.MODES.FIXED) {
    if (field.type === 'boolean') {
      const select = document.createElement('select');
      select.className = 'form-control table-input';
      select.innerHTML = '<option value="true">true</option><option value="false">false</option>';
      select.value = String(config.fixedValue || 'true');
      select.addEventListener('change', (e) => { config.fixedValue = e.target.value === 'true'; });
      container.appendChild(select);
      return;
    }

    const input = document.createElement('input');
    input.type = ['int', 'double', 'currency', 'percent'].includes(field.type) ? 'number' : 'text';
    input.className = 'form-control table-input';
    input.value = config.fixedValue !== undefined ? config.fixedValue : '';
    input.placeholder = 'Enter static value...';
    input.addEventListener('input', (e) => { config.fixedValue = e.target.value; });
    container.appendChild(input);
    return;
  }

  // Mode: Picklist Choice or Picklist Type
  const isPicklistField = field.type === 'picklist' || field.type === 'multipicklist';
  const isAddressField = (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.isAddressField)
    ? GeneratorEngine.isAddressField(field.name, field.label)
    : false;

  // Address fields in REALISTIC mode shouldn't be forced into picklist dropdown
  if (config.mode === GeneratorEngine.MODES.PICKLIST || (isPicklistField && !isAddressField && config.mode !== GeneratorEngine.MODES.FIXED && config.mode !== GeneratorEngine.MODES.EMPTY && config.mode !== GeneratorEngine.MODES.PATTERN)) {
    const group = document.createElement('div');
    group.className = 'picklist-control-group';

    let values = field.picklistValues || [];
    const fnLower = (field.name || '').toLowerCase();
    const flLower = (field.label || '').toLowerCase();
    const isStateField = fnLower.includes('state') || flLower.includes('state');

    // If it's a State field (like MailingStateCode), filter to valid US states so user doesn't pick invalid states like TA
    if (isStateField && typeof GeneratorEngine !== 'undefined' && GeneratorEngine.US_STATE_CODES) {
      const usVals = values.filter(pv => GeneratorEngine.US_STATE_CODES.has((pv.value || '').toUpperCase()));
      if (usVals.length > 0) {
        values = usVals;
      }
    }

    const select = document.createElement('select');
    select.className = 'form-control table-input';
    
    const randomOpt = document.createElement('option');
    randomOpt.value = '__RANDOM__';
    randomOpt.textContent = isStateField
      ? `🎲 Random US State (${values.length} valid states)`
      : `🎲 Random (from ${values.length} values)`;
    if (!config.picklistValue || config.picklistValue === '__RANDOM__') randomOpt.selected = true;
    select.appendChild(randomOpt);

    for (const pv of values) {
      const opt = document.createElement('option');
      opt.value = pv.value;
      opt.textContent = `${pv.label || pv.value}${pv.defaultValue ? ' ★ (Default)' : ''}`;
      if (config.picklistValue === pv.value) opt.selected = true;
      select.appendChild(opt);
    }

    select.addEventListener('change', (e) => {
      config.picklistValue = e.target.value;
      updatePillsActiveState(preview, config.picklistValue);
    });
    group.appendChild(select);

    // Quick Preview Pills below dropdown so user can see available values right away
    const preview = document.createElement('div');
    preview.className = 'picklist-quick-preview';

    // Show first 3 values as pills
    values.slice(0, 3).forEach(pv => {
      const pill = document.createElement('span');
      pill.className = 'pv-pill' + (config.picklistValue === pv.value ? ' active' : '');
      pill.textContent = pv.label || pv.value;
      pill.title = `Click to select: ${pv.label || pv.value}`;
      pill.addEventListener('click', () => {
        config.picklistValue = pv.value;
        select.value = pv.value;
        updatePillsActiveState(preview, pv.value);
        showToast(`Selected "${pv.label || pv.value}" for ${field.label}`, 'info');
      });
      preview.appendChild(pill);
    });

    // View all button
    const viewAllBtn = document.createElement('button');
    viewAllBtn.type = 'button';
    viewAllBtn.className = 'pv-view-all-btn';
    viewAllBtn.textContent = values.length > 3 ? `+${values.length - 3} more...` : `👁️ View All (${values.length})`;
    viewAllBtn.title = 'View all picklist values in detail';
    viewAllBtn.addEventListener('click', () => {
      openPicklistModal(field, config, select, preview);
    });
    preview.appendChild(viewAllBtn);

    group.appendChild(preview);
    container.appendChild(group);
    return;
  }

  // Mode: Empty
  if (config.mode === GeneratorEngine.MODES.EMPTY) {
    const span = document.createElement('span');
    span.className = 'text-muted text-sm';
    span.textContent = '(Will omit or pass null)';
    container.appendChild(span);
    return;
  }

  // Mode: Realistic (Default)
  if (['int', 'double', 'currency', 'percent'].includes(field.type)) {
    const wrap = document.createElement('div');
    wrap.className = 'numeric-input-group';

    const rangeDiv = document.createElement('div');
    rangeDiv.className = 'range-inputs';
    rangeDiv.innerHTML = `
      <input type="number" class="form-control range-input" placeholder="Min" value="${config.min !== undefined ? config.min : 0}" title="Minimum value">
      <span class="divider">-</span>
      <input type="number" class="form-control range-input" placeholder="Max" value="${config.max !== undefined ? config.max : 1000}" title="Maximum value">
    `;
    const inputs = rangeDiv.querySelectorAll('input');
    inputs[0].addEventListener('input', (e) => { config.min = Number(e.target.value); });
    inputs[1].addEventListener('input', (e) => { config.max = Number(e.target.value); });
    wrap.appendChild(rangeDiv);

    if (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.getSemanticLabelHint) {
      const hint = GeneratorEngine.getSemanticLabelHint(field);
      const hintBadge = document.createElement('div');
      hintBadge.className = `smart-hint-badge ${hint.category}-hint`;
      hintBadge.innerHTML = `<span class="hint-icon">${hint.icon}</span> <span class="hint-text">${escapeHtml(hint.label)}</span>`;
      wrap.appendChild(hintBadge);
    }

    container.appendChild(wrap);
    return;
  }

  if (field.type === 'reference') {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control table-input';
    input.placeholder = `Parent ID (${field.referenceTo.join('/') || 'Id'})...`;
    input.value = config.referenceId || '';
    input.addEventListener('input', (e) => { config.referenceId = e.target.value; });
    container.appendChild(input);
    return;
  }

  // Realistic Smart Hint Badge for non-numeric fields
  if (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.getSemanticLabelHint) {
    const hint = GeneratorEngine.getSemanticLabelHint(field);
    const hintBadge = document.createElement('div');
    hintBadge.className = `smart-hint-badge ${hint.category}-hint`;
    hintBadge.innerHTML = `<span class="hint-icon">${hint.icon}</span> <span class="hint-text">${escapeHtml(hint.label)}</span>`;
    hintBadge.title = `Smart Field Recognition: SF DataForge detected "${field.label}" (${field.type}) and will generate context-aware data.`;
    container.appendChild(hintBadge);
    return;
  }

  // Generic realistic hint fallback
  const hint = document.createElement('span');
  hint.className = 'text-muted text-sm';
  hint.textContent = `Auto ${field.type.toLowerCase()} generator`;
  container.appendChild(hint);
}

function updateFooterSummary() {
  const selectedCount = Object.values(state.fieldConfigs).filter(c => c && c.enabled).length;
  const recordCount = parseInt(DOM.recordCountInput.value, 10) || 1;

  DOM.selectedFieldsCount.textContent = selectedCount;
  DOM.footerSelectedSummary.textContent = `${selectedCount} fields selected`;
  DOM.footerRecordsSummary.textContent = `${recordCount} record${recordCount > 1 ? 's' : ''}`;
}

// ===================================================
// EVENT BINDINGS
// ===================================================
function bindNavigationEvents() {
  DOM.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  DOM.connectionStatusPill.addEventListener('click', () => {
    switchTab('tab-settings');
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  DOM.navTabs.forEach(t => {
    const isTarget = t.getAttribute('data-tab') === tabId;
    t.classList.toggle('active', isTarget);
    t.setAttribute('aria-selected', isTarget);
  });

  DOM.tabPanels.forEach(panel => {
    const isTarget = panel.id === tabId;
    panel.style.display = isTarget ? 'flex' : 'none';
  });

  if (tabId === 'tab-templates') {
    renderTemplatesView();
  } else if (tabId === 'tab-history') {
    renderHistoryView();
  } else if (tabId === 'tab-deleter') {
    onSwitchToDeleterTab();
  }
}

function bindGeneratorEvents() {
  // SObject select
  DOM.sobjectSelect.addEventListener('change', (e) => {
    onSelectSObject(e.target.value);
  });

  // Count stepper
  DOM.btnCountDec.addEventListener('click', () => {
    let val = parseInt(DOM.recordCountInput.value, 10) || 1;
    if (val > 1) {
      DOM.recordCountInput.value = val - 1;
      updateFooterSummary();
    }
  });

  DOM.btnCountInc.addEventListener('click', () => {
    let val = parseInt(DOM.recordCountInput.value, 10) || 1;
    if (val < 200) {
      DOM.recordCountInput.value = val + 1;
      updateFooterSummary();
    }
  });

  DOM.recordCountInput.addEventListener('input', () => {
    let val = parseInt(DOM.recordCountInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 200) val = 200;
    DOM.recordCountInput.value = val;
    updateFooterSummary();
  });

  DOM.destinationSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'salesforce') {
      DOM.btnGenerateText.textContent = 'Generate & Insert';
    } else if (val === 'csv') {
      DOM.btnGenerateText.textContent = 'Generate & Export CSV';
    } else {
      DOM.btnGenerateText.textContent = 'Generate & Export JSON';
    }
  });

  // Action buttons
  DOM.btnPreviewData.addEventListener('click', onOpenPreview);
  DOM.btnGenerate.addEventListener('click', onExecuteGeneration);
}

function bindFilterEvents() {
  DOM.fieldSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    DOM.btnClearSearch.style.display = state.searchQuery ? 'block' : 'none';
    renderFieldsTable();
  });

  DOM.btnClearSearch.addEventListener('click', () => {
    DOM.fieldSearchInput.value = '';
    state.searchQuery = '';
    DOM.btnClearSearch.style.display = 'none';
    renderFieldsTable();
  });

  DOM.btnFilterAll.addEventListener('click', () => setFilter('all', DOM.btnFilterAll));
  DOM.btnFilterRequired.addEventListener('click', () => setFilter('required', DOM.btnFilterRequired));
  DOM.btnFilterSelected.addEventListener('click', () => setFilter('selected', DOM.btnFilterSelected));

  DOM.btnSelectAllRequired.addEventListener('click', () => {
    if (!state.objectDescribe) return;
    for (const field of state.objectDescribe.fields) {
      if (state.fieldConfigs[field.name]) {
        state.fieldConfigs[field.name].enabled = field.required;
      }
    }
    ensureAddressFieldDependencies();
    renderFieldsTable();
    updateFooterSummary();
  });

  DOM.btnSelectAll.addEventListener('click', () => {
    for (const config of Object.values(state.fieldConfigs)) {
      config.enabled = true;
    }
    renderFieldsTable();
    updateFooterSummary();
  });

  DOM.btnDeselectAll.addEventListener('click', () => {
    for (const config of Object.values(state.fieldConfigs)) {
      config.enabled = false;
    }
    renderFieldsTable();
    updateFooterSummary();
  });

  DOM.selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const checkboxes = DOM.fieldsTableBody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(c => {
      c.checked = isChecked;
      c.dispatchEvent(new Event('change'));
    });
  });
}

function setFilter(filterType, targetBtn) {
  state.currentFilter = filterType;
  [DOM.btnFilterAll, DOM.btnFilterRequired, DOM.btnFilterSelected].forEach(b => b.classList.remove('active'));
  targetBtn.classList.add('active');
  renderFieldsTable();
}

function bindQuickActionEvents() {
  if (DOM.btnThemeToggle) {
    DOM.btnThemeToggle.addEventListener('click', toggleTheme);
  }

  DOM.btnOpenSidePanel.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
    } else {
      showToast('Side Panel is available inside Google Chrome browser.', 'info');
    }
  });

  DOM.btnOpenFullTab.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'OPEN_FULL_TAB' });
    } else {
      window.open(window.location.href, '_blank');
    }
  });
}

// ===================================================
// THEME MANAGEMENT (Simple & Clean Light / Dark)
// ===================================================

async function initTheme() {
  try {
    const savedTheme = await StorageService.getTheme();
    applyTheme(savedTheme || 'light');
  } catch (err) {
    applyTheme('light');
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (DOM.themeToggleIcon) {
      // Sun icon when in dark mode (click to switch to light)
      DOM.themeToggleIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    }
    if (DOM.btnThemeToggle) {
      DOM.btnThemeToggle.title = 'Switch to Clean Light Theme';
    }
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (DOM.themeToggleIcon) {
      // Moon icon when in light mode (click to switch to dark)
      DOM.themeToggleIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
    if (DOM.btnThemeToggle) {
      DOM.btnThemeToggle.title = 'Switch to Dark Theme';
    }
  }
}

async function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  await StorageService.setTheme(newTheme);
  showToast(newTheme === 'dark' ? 'Dark theme enabled' : 'Clean & Simple theme enabled', 'info');
}

function bindAlertBannerEvents() {
  if (DOM.btnBannerRefresh) {
    DOM.btnBannerRefresh.addEventListener('click', async () => {
      showToast('Scanning open tabs for Salesforce...', 'info');
      await initializeConnection();
    });
  }

  if (DOM.btnBannerPasteToken) {
    DOM.btnBannerPasteToken.addEventListener('click', () => {
      openQuickTokenModal();
    });
  }

  if (DOM.btnBannerDemo) {
    DOM.btnBannerDemo.addEventListener('click', async () => {
      await StorageService.saveSettings({ useMockMode: true });
      showToast('Switched to Demo Mock Mode.', 'info');
      await initializeConnection();
    });
  }
}

function openQuickTokenModal() {
  DOM.quickInstanceUrl.value = state.sfService.instanceUrl || '';
  DOM.quickSessionToken.value = '';
  DOM.quickTokenModal.style.display = 'flex';
}

// ===================================================
// DATA PREVIEW & EXECUTION
// ===================================================
function onOpenPreview() {
  const selectedFields = Object.entries(state.fieldConfigs).filter(([_, c]) => c && c.enabled);
  if (selectedFields.length === 0) {
    showToast('Please select at least one field to generate data.', 'warning');
    return;
  }

  const count = parseInt(DOM.recordCountInput.value, 10) || 5;
  const records = GeneratorEngine.generateRecords(
    state.selectedObject,
    state.objectDescribe,
    state.fieldConfigs,
    count
  );

  state.generatedPreviewRecords = records;
  DOM.previewSubtitle.textContent = `Previewing ${count} generated record${count > 1 ? 's' : ''} for ${state.selectedObject}`;
  renderPreviewTable(records);
  DOM.previewModal.style.display = 'flex';
}

function renderPreviewTable(records) {
  if (!records || records.length === 0) {
    DOM.previewTableWrapper.innerHTML = '<p class="text-muted p-3 text-center">No records generated.</p>';
    return;
  }

  const keys = Object.keys(records[0]);
  let html = '<table class="preview-table"><thead><tr>';
  html += '<th>#</th>';
  for (const k of keys) {
    html += `<th>${escapeHtml(k)}</th>`;
  }
  html += '</tr></thead><tbody>';

  records.forEach((rec, idx) => {
    html += `<tr><td><strong>${idx + 1}</strong></td>`;
    for (const k of keys) {
      const val = rec[k];
      const displayVal = val === null || val === undefined ? '<span class="text-muted">null</span>' : escapeHtml(String(val));
      html += `<td>${displayVal}</td>`;
    }
    html += '</tr>';
  });

  html += '</tbody></table>';
  DOM.previewTableWrapper.innerHTML = html;
}

async function onExecuteGeneration() {
  const destination = DOM.destinationSelect.value;
  const selectedFields = Object.entries(state.fieldConfigs).filter(([_, c]) => c && c.enabled);

  if (selectedFields.length === 0) {
    showToast('Please select at least one field to generate data.', 'warning');
    return;
  }

  const count = parseInt(DOM.recordCountInput.value, 10) || 5;
  const records = GeneratorEngine.generateRecords(
    state.selectedObject,
    state.objectDescribe,
    state.fieldConfigs,
    count
  );

  if (destination === 'csv') {
    exportToCsv(records, `${state.selectedObject}_test_data.csv`);
    showToast(`Exported ${count} records to CSV!`, 'success');
    return;
  }

  if (destination === 'json') {
    exportToJson(records, `${state.selectedObject}_test_data.json`);
    showToast(`Exported ${count} records to JSON!`, 'success');
    return;
  }

  // Insert to Salesforce Org
  await executeSalesforceInsert(records);
}

async function executeSalesforceInsert(records) {
  DOM.progressModal.style.display = 'flex';
  if (DOM.progressTitle) DOM.progressTitle.textContent = `Inserting Records into ${state.selectedObject || 'Salesforce'}...`;
  DOM.progressBarFill.style.width = '10%';
  DOM.progressStatusText.textContent = `Connecting & preparing batch for ${state.selectedObject}...`;
  DOM.resultsSummarySection.style.display = 'none';
  DOM.btnCloseProgress.style.display = 'none';
  DOM.btnDownloadBatchCsv.style.display = 'none';

  try {
    DOM.progressBarFill.style.width = '50%';
    DOM.progressStatusText.textContent = `Inserting ${records.length} records into Salesforce...`;

    const result = await state.sfService.insertRecords(state.selectedObject, records);
    state.lastBatchResult = result;

    DOM.progressBarFill.style.width = '100%';
    DOM.progressStatusText.textContent = `Completed! ${result.successCount} of ${result.total} records inserted.`;

    DOM.statSuccessCount.textContent = result.successCount;
    if (result.failureCount > 0) {
      DOM.statFailedBadge.style.display = 'flex';
      DOM.statFailedCount.textContent = result.failureCount;
    } else {
      DOM.statFailedBadge.style.display = 'none';
    }

    // List created record IDs with clickable links to Salesforce
    DOM.createdIdsList.innerHTML = '';
    const instanceUrl = state.sfService.instanceUrl || 'https://login.salesforce.com';

    result.results.forEach((item, index) => {
      const li = document.createElement('li');
      if (item.success) {
        const link = `${instanceUrl}/${item.id}`;
        li.innerHTML = `
          <span>Record #${index + 1}: <a href="${safeUrl(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.id)}</a></span>
          <button type="button" class="text-link-btn btn-copy-rec-id" title="Copy Record ID" data-id="${escapeHtml(item.id)}">Copy</button>
        `;
        const copyBtn = li.querySelector('.btn-copy-rec-id');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(item.id);
            showToast(`Copied ${item.id} to clipboard`, 'info');
          });
        }
      } else {
        li.innerHTML = `<span class="text-danger">Record #${index + 1}: ${escapeHtml(item.errorMessage)}</span>`;
      }
      DOM.createdIdsList.appendChild(li);
    });

    DOM.resultsSummarySection.style.display = 'flex';
    DOM.btnCloseProgress.style.display = 'inline-flex';
    DOM.btnDownloadBatchCsv.style.display = 'inline-flex';

    // Log to History
    await StorageService.logGeneration({
      objectName: state.selectedObject,
      objectLabel: (state.objectDescribe && state.objectDescribe.label) || state.selectedObject,
      recordCount: records.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      status: result.failureCount === 0 ? 'success' : (result.successCount > 0 ? 'partial' : 'failed'),
      records,
      createdIds: result.results.filter(r => r.success).map(r => r.id),
      errors: result.results.filter(r => !r.success).map(r => r.errorMessage),
      instanceUrl
    });

    if (result.successCount > 0) {
      showToast(`Successfully inserted ${result.successCount} records into Salesforce!`, 'success');
    } else {
      showToast('Insertion failed: all records failed validation.', 'error');
    }
  } catch (err) {
    console.error('Insert error:', err);
    DOM.progressBarFill.style.width = '100%';
    DOM.progressStatusText.textContent = `Error: ${err.message}`;
    DOM.btnCloseProgress.style.display = 'inline-flex';
    
    if (err.message.includes('401') || err.message.includes('Session expired')) {
      showSessionAlert('Salesforce session expired or restricted by IP policy.');
      showToast('Session expired or restricted. Click "Enter Token" on the banner to connect.', 'error');
    } else {
      showToast('Insertion failed: ' + err.message, 'error');
    }
  }
}

// ===================================================
// TEMPLATES & HISTORY
// ===================================================
async function renderTemplatesView() {
  const templates = await StorageService.getTemplates();
  DOM.templatesList.innerHTML = '';

  if (templates.length === 0) {
    DOM.templatesEmpty.style.display = 'flex';
    DOM.templatesList.style.display = 'none';
    return;
  }

  DOM.templatesEmpty.style.display = 'none';
  DOM.templatesList.style.display = 'grid';

  templates.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'template-card';
    const fieldCount = Object.keys(tpl.fieldConfigs || {}).length;
    const dateStr = new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString();

    card.innerHTML = `
      <div class="template-header">
        <h4 class="template-title">${escapeHtml(tpl.name)}</h4>
        <span class="template-badge">${escapeHtml(tpl.objectName)}</span>
      </div>
      <p class="template-meta">${fieldCount} configured fields • ${dateStr}</p>
      <div class="template-actions">
        <button class="btn btn-primary btn-sm flex-1 btn-apply-template">Apply</button>
        <button class="btn btn-ghost-danger btn-sm btn-delete-template">Delete</button>
      </div>
    `;

    card.querySelector('.btn-apply-template').addEventListener('click', async () => {
      await applyTemplate(tpl);
    });

    card.querySelector('.btn-delete-template').addEventListener('click', async () => {
      await StorageService.deleteTemplate(tpl.id);
      showToast(`Deleted template "${tpl.name}"`, 'info');
      renderTemplatesView();
    });

    DOM.templatesList.appendChild(card);
  });
}

async function applyTemplate(tpl) {
  DOM.sobjectSelect.value = tpl.objectName;
  await onSelectSObject(tpl.objectName);

  for (const [fieldName, config] of Object.entries(tpl.fieldConfigs || {})) {
    if (state.fieldConfigs[fieldName]) {
      state.fieldConfigs[fieldName] = { ...state.fieldConfigs[fieldName], ...config };
    }
  }

  renderFieldsTable();
  updateFooterSummary();
  switchTab('tab-generator');
  showToast(`Applied preset "${tpl.name}"!`, 'success');
}

async function renderHistoryView() {
  const history = await StorageService.getHistory();
  DOM.historyList.innerHTML = '';

  if (history.length === 0) {
    DOM.historyEmpty.style.display = 'flex';
    DOM.historyList.style.display = 'none';
    return;
  }

  DOM.historyEmpty.style.display = 'none';
  DOM.historyList.style.display = 'flex';

  history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-card';
    const dateStr = new Date(item.timestamp).toLocaleString();
    const isSuccess = item.status === 'success';

    let idsHtml = '';
    (item.createdIds || []).slice(0, 8).forEach(id => {
      const link = `${item.instanceUrl || 'https://login.salesforce.com'}/${id}`;
      idsHtml += `<a href="${safeUrl(link)}" target="_blank" rel="noopener noreferrer" class="record-id-link">${escapeHtml(id)}</a>`;
    });
    if ((item.createdIds || []).length > 8) {
      idsHtml += `<span class="text-muted text-sm">+${item.createdIds.length - 8} more</span>`;
    }

    card.innerHTML = `
      <div class="history-header">
        <span class="history-title">${escapeHtml(item.objectLabel || item.objectName)} (${item.recordCount} records)</span>
        <span class="badge ${isSuccess ? 'type-int' : 'text-danger'}">${escapeHtml(item.status.toUpperCase())}</span>
      </div>
      <div class="history-time">${dateStr}</div>
      <div class="history-ids-box">${idsHtml || '<span class="text-muted">Exported without Salesforce insertion</span>'}</div>
    `;

    DOM.historyList.appendChild(card);
  });
}

// ===================================================
// MODAL EVENTS & TEMPLATE SAVING
// ===================================================
function bindModalEvents() {
  // Preview Modal
  DOM.btnClosePreview.addEventListener('click', () => {
    DOM.previewModal.style.display = 'none';
  });

  DOM.btnConfirmInsert.addEventListener('click', async () => {
    DOM.previewModal.style.display = 'none';
    await executeSalesforceInsert(state.generatedPreviewRecords);
  });

  DOM.btnExportPreviewCsv.addEventListener('click', () => {
    exportToCsv(state.generatedPreviewRecords, `${state.selectedObject}_preview.csv`);
    showToast('Exported preview records to CSV!', 'success');
  });

  DOM.btnExportPreviewJson.addEventListener('click', () => {
    exportToJson(state.generatedPreviewRecords, `${state.selectedObject}_preview.json`);
    showToast('Exported preview records to JSON!', 'success');
  });

  // Save Template Modal
  DOM.btnOpenSaveTemplateModal.addEventListener('click', () => {
    const selectedCount = Object.values(state.fieldConfigs).filter(c => c && c.enabled).length;
    DOM.templateSummaryNote.textContent = `Saves ${selectedCount} field rules for ${state.selectedObject}.`;
    DOM.templateNameInput.value = `${state.selectedObject} Test Preset`;
    DOM.saveTemplateModal.style.display = 'flex';
  });

  DOM.btnCloseSaveTemplate.addEventListener('click', () => {
    DOM.saveTemplateModal.style.display = 'none';
  });

  DOM.btnCancelSaveTemplate.addEventListener('click', () => {
    DOM.saveTemplateModal.style.display = 'none';
  });

  DOM.btnConfirmSaveTemplate.addEventListener('click', async () => {
    const name = DOM.templateNameInput.value.trim() || `${state.selectedObject} Preset`;
    await StorageService.saveTemplate({
      name,
      objectName: state.selectedObject,
      objectLabel: (state.objectDescribe && state.objectDescribe.label) || state.selectedObject,
      fieldConfigs: state.fieldConfigs
    });
    DOM.saveTemplateModal.style.display = 'none';
    showToast(`Template "${name}" saved!`, 'success');
  });

  // Progress Modal
  DOM.btnCloseProgress.addEventListener('click', () => {
    DOM.progressModal.style.display = 'none';
  });

  DOM.btnDownloadBatchCsv.addEventListener('click', () => {
    if (state.lastBatchResult && state.lastBatchResult.results) {
      const recordsToExport = state.lastBatchResult.results.map(r => ({
        Id: r.id || 'FAILED',
        Success: r.success,
        Error: r.errorMessage || '',
        ...r.record
      }));
      exportToCsv(recordsToExport, `${state.selectedObject}_batch_results.csv`);
      showToast('Exported batch results to CSV!', 'success');
    }
  });

  DOM.btnClearHistory.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all generation history?')) {
      await StorageService.clearHistory();
      renderHistoryView();
      showToast('Generation history cleared.', 'info');
    }
  });

  // Quick Token Modal
  DOM.btnCloseQuickToken.addEventListener('click', () => {
    DOM.quickTokenModal.style.display = 'none';
  });

  DOM.btnCancelQuickToken.addEventListener('click', () => {
    DOM.quickTokenModal.style.display = 'none';
  });

  DOM.btnSaveQuickToken.addEventListener('click', async () => {
    const instanceUrl = DOM.quickInstanceUrl.value.trim().replace(/\/$/, '');
    const token = DOM.quickSessionToken.value.trim();

    if (!instanceUrl) {
      showToast('Please enter your Salesforce Instance URL.', 'warning');
      return;
    }
    if (!isSalesforceUrl(instanceUrl)) {
      showToast('Invalid domain: Please enter a valid Salesforce URL (e.g. https://your-domain.my.salesforce.com).', 'error');
      return;
    }
    if (!token) {
      showToast('Please enter your Session ID or Access Token.', 'warning');
      return;
    }

    showToast('Validating token against Salesforce...', 'info');

    // Test token
    const testResult = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'TEST_SF_SESSION',
        payload: { instanceUrl, token }
      }, resolve);
    });

    if (testResult && testResult.valid) {
      await StorageService.saveSettings({
        instanceUrl,
        manualSessionId: token,
        useMockMode: false
      });
      DOM.quickTokenModal.style.display = 'none';
      hideSessionAlert();
      showToast('Token verified! Connected successfully.', 'success');
      await initializeConnection();
    } else {
      showToast(`Token verification failed (${testResult ? testResult.status || testResult.error : 'Network error'}). Please verify the token.`, 'error');
    }
  });

  // Picklist Values Modal Events
  if (DOM.btnClosePicklistModal) {
    DOM.btnClosePicklistModal.addEventListener('click', () => {
      DOM.picklistValuesModal.style.display = 'none';
    });
  }

  if (DOM.btnDonePicklistModal) {
    DOM.btnDonePicklistModal.addEventListener('click', () => {
      DOM.picklistValuesModal.style.display = 'none';
    });
  }

  if (DOM.btnSelectRandomPicklist) {
    DOM.btnSelectRandomPicklist.addEventListener('click', () => {
      if (currentPicklistConfig) {
        currentPicklistConfig.picklistValue = '__RANDOM__';
        if (currentPicklistSelect) currentPicklistSelect.value = '__RANDOM__';
        if (currentPicklistPreview) updatePillsActiveState(currentPicklistPreview, '__RANDOM__');
      }
      DOM.picklistValuesModal.style.display = 'none';
      showToast('Set to Random valid picklist value.', 'info');
    });
  }

  if (DOM.picklistSearchInput) {
    DOM.picklistSearchInput.addEventListener('input', (e) => {
      if (currentPicklistField && currentPicklistConfig) {
        renderPicklistModalTable(
          currentPicklistField.picklistValues || [],
          currentPicklistConfig.picklistValue,
          e.target.value
        );
      }
    });
  }
}

// ===================================================
// PICKLIST MODAL CONTROLLER
// ===================================================
let currentPicklistField = null;
let currentPicklistConfig = null;
let currentPicklistSelect = null;
let currentPicklistPreview = null;

function openPicklistModal(field, config, selectElement, previewElement) {
  currentPicklistField = field;
  currentPicklistConfig = config;
  currentPicklistSelect = selectElement;
  currentPicklistPreview = previewElement;

  DOM.picklistModalTitle.textContent = `Picklist Values: ${field.label || field.name}`;
  DOM.picklistModalSubtitle.textContent = `Object: ${state.selectedObject} • Field API: ${field.name} (${(field.picklistValues || []).length} available values)`;
  DOM.picklistSearchInput.value = '';

  let values = field.picklistValues || [];
  const fnLower = (field.name || '').toLowerCase();
  const flLower = (field.label || '').toLowerCase();
  const isStateField = fnLower.includes('state') || flLower.includes('state');

  if (isStateField && typeof GeneratorEngine !== 'undefined' && GeneratorEngine.US_STATE_CODES) {
    const usVals = values.filter(pv => GeneratorEngine.US_STATE_CODES.has((pv.value || '').toUpperCase()));
    const otherVals = values.filter(pv => !GeneratorEngine.US_STATE_CODES.has((pv.value || '').toUpperCase()));
    if (usVals.length > 0) {
      values = [...usVals, ...otherVals];
    }
  }

  renderPicklistModalTable(values, config.picklistValue);
  DOM.picklistValuesModal.style.display = 'flex';
}

function renderPicklistModalTable(values, selectedValue, filterQuery = '') {
  DOM.picklistModalTableBody.innerHTML = '';
  const query = (filterQuery || '').toLowerCase().trim();

  const filtered = values.filter(pv => {
    if (!query) return true;
    return (pv.label || '').toLowerCase().includes(query) || (pv.value || '').toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    DOM.picklistModalTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-3">No picklist values match your search filter.</td></tr>';
    return;
  }

  filtered.forEach((pv, idx) => {
    const isSelected = selectedValue === pv.value;
    const isUsState = typeof GeneratorEngine !== 'undefined' && GeneratorEngine.US_STATE_CODES && GeneratorEngine.US_STATE_CODES.has((pv.value || '').toUpperCase());
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${idx + 1}</strong></td>
      <td><strong>${escapeHtml(pv.label || pv.value)}</strong></td>
      <td><code>${escapeHtml(pv.value)}</code></td>
      <td>${pv.defaultValue ? '<span class="type-badge type-int">Default</span>' : (isUsState ? '<span class="type-badge" style="background:#059669;color:#fff;font-weight:600;">US State</span>' : '<span class="text-muted">-</span>')}</td>
      <td style="text-align: right;">
        <button class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-pick-value">
          ${isSelected ? 'Selected ✓' : 'Select'}
        </button>
      </td>
    `;

    tr.querySelector('.btn-pick-value').addEventListener('click', () => {
      if (currentPicklistConfig) {
        currentPicklistConfig.picklistValue = pv.value;
        if (currentPicklistSelect) currentPicklistSelect.value = pv.value;
        if (currentPicklistPreview) updatePillsActiveState(currentPicklistPreview, pv.value);
      }
      renderPicklistModalTable(values, pv.value, DOM.picklistSearchInput.value);
      showToast(`Selected "${pv.label || pv.value}" for ${currentPicklistField.label}`, 'success');
    });

    DOM.picklistModalTableBody.appendChild(tr);
  });
}

function updatePillsActiveState(previewContainer, activeValue) {
  if (!previewContainer) return;
  const pills = previewContainer.querySelectorAll('.pv-pill');
  pills.forEach(pill => {
    pill.classList.toggle('active', pill.textContent === activeValue);
  });
}

// ===================================================
// SETTINGS TAB EVENTS
// ===================================================
function bindSettingsEvents() {
  const authRadios = [DOM.authModeAuto, DOM.authModeDemo, DOM.authModeManual];
  authRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      DOM.manualAuthSection.style.display = DOM.authModeManual.checked ? 'flex' : 'none';
    });
  });

  DOM.btnSaveSettings.addEventListener('click', async () => {
    const isDemo = DOM.authModeDemo.checked;
    const isManual = DOM.authModeManual.checked;

    if (isManual) {
      const manualUrl = DOM.settingInstanceUrl.value.trim();
      if (manualUrl && !isSalesforceUrl(manualUrl)) {
        showToast('Invalid domain: Please enter a valid Salesforce URL (e.g. https://your-domain.my.salesforce.com).', 'error');
        return;
      }
    }

    await StorageService.saveSettings({
      useMockMode: isDemo,
      apiVersion: DOM.settingApiVersion.value,
      instanceUrl: isManual ? DOM.settingInstanceUrl.value.trim() : '',
      manualSessionId: isManual ? DOM.settingSessionId.value.trim() : ''
    });

    showToast('Settings saved. Reconnecting...', 'info');
    await initializeConnection();
  });

  DOM.btnRefreshSession.addEventListener('click', async () => {
    DOM.authModeAuto.checked = true;
    DOM.manualAuthSection.style.display = 'none';
    await StorageService.saveSettings({ useMockMode: false });
    showToast('Scanning active tabs for Salesforce...', 'info');
    await initializeConnection();
  });

  DOM.btnResetStorage.addEventListener('click', async () => {
    if (confirm('Reset all extension storage? This will clear templates, history, and custom settings.')) {
      await StorageService.clearHistory();
      await StorageService.set('sf_dataforge_templates', []);
      await StorageService.set('sf_dataforge_settings', {});
      showToast('Storage successfully reset.', 'success');
      await initializeConnection();
    }
  });
}

// ===================================================
// CSV / JSON EXPORT UTILITIES
// ===================================================
function exportToCsv(records, filename) {
  if (!records || records.length === 0) return;
  const headers = Object.keys(records[0]);
  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  for (const rec of records) {
    const values = headers.map(h => {
      const val = rec[h];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  downloadUri(csvContent, filename);
}

function exportToJson(records, filename) {
  const jsonStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
  downloadUri(jsonStr, filename);
}

function downloadUri(uri, filename) {
  const link = document.createElement('a');
  link.setAttribute('href', uri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return escapeHtml(url);
    }
    return '#';
  } catch (e) {
    return '#';
  }
}

function isSalesforceUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const h = parsed.hostname.toLowerCase();
    return h.endsWith('.salesforce.com') ||
           h.endsWith('.force.com') ||
           h.endsWith('.cloudforce.com') ||
           h.endsWith('.salesforce-setup.com') ||
           h.endsWith('.salesforce.mil') ||
           h.endsWith('.cloudforce.mil') ||
           h.endsWith('.site.com') ||
           h.endsWith('.visualforce.com') ||
           h === 'salesforce.com' ||
           h === 'login.salesforce.com' ||
           h === 'test.salesforce.com';
  } catch (e) {
    return false;
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ===================================================
// DATA CLEANER (RECORD DELETION) CONTROLLERS
// ===================================================

function populateDeleterSObjects(objects) {
  if (!DOM.deleterSObjectSelect || !objects || objects.length === 0) return;

  DOM.deleterSObjectSelect.innerHTML = '';

  const standardGroup = document.createElement('optgroup');
  standardGroup.label = 'Standard Objects';
  const customGroup = document.createElement('optgroup');
  customGroup.label = 'Custom Objects';

  for (const obj of objects) {
    const option = document.createElement('option');
    option.value = obj.name;
    option.textContent = `${obj.label} (${obj.name})`;
    if (obj.custom) {
      customGroup.appendChild(option);
    } else {
      standardGroup.appendChild(option);
    }
  }

  if (standardGroup.children.length > 0) DOM.deleterSObjectSelect.appendChild(standardGroup);
  if (customGroup.children.length > 0) DOM.deleterSObjectSelect.appendChild(customGroup);

  // Default to Account or first object if not already selected
  if (!state.deleterSObject) {
    const defaultObj = objects.find(o => o.name === 'Account') || objects[0];
    if (defaultObj) {
      state.deleterSObject = defaultObj.name;
      DOM.deleterSObjectSelect.value = defaultObj.name;
      updateDeleterObjectTypeBadge(defaultObj.name);
    }
  } else {
    DOM.deleterSObjectSelect.value = state.deleterSObject;
    updateDeleterObjectTypeBadge(state.deleterSObject);
  }
}

function updateDeleterObjectTypeBadge(sObjectName) {
  if (!DOM.deleterObjectTypeBadge) return;
  const objMeta = state.sobjects.find(o => o.name === sObjectName);
  DOM.deleterObjectTypeBadge.textContent = (objMeta && objMeta.custom) ? 'Custom Object' : 'Standard Object';
}

async function onSwitchToDeleterTab() {
  if (!state.deleterSObject) {
    const defaultObj = state.sobjects.find(o => o.name === 'Account') || state.sobjects[0];
    if (defaultObj) {
      state.deleterSObject = defaultObj.name;
      if (DOM.deleterSObjectSelect) DOM.deleterSObjectSelect.value = defaultObj.name;
      updateDeleterObjectTypeBadge(defaultObj.name);
    }
  }

  if (state.deleterSObject && state.deleterRecords.length === 0) {
    await refreshDeleterData();
  }
}

async function onSelectDeleterSObject(sObjectName) {
  state.deleterSObject = sObjectName;
  updateDeleterObjectTypeBadge(sObjectName);
  state.deleterSelectedIds.clear();
  updateDeleterSummary();
  await refreshDeleterData();
}

async function refreshDeleterData() {
  if (!state.deleterSObject) return;

  // 1. Fetch total count in org
  fetchDeleterTotalCount(state.deleterSObject);

  // 2. Fetch records
  await loadDeleterRecords();
}

async function fetchDeleterTotalCount(sObjectName) {
  if (!DOM.deleterTotalCount) return;
  DOM.deleterTotalCount.textContent = '...';
  try {
    const count = await state.sfService.getRecordCount(sObjectName);
    state.deleterTotalCount = count;
    DOM.deleterTotalCount.textContent = count.toLocaleString();
  } catch (err) {
    console.error('Failed to get record count:', err);
    DOM.deleterTotalCount.textContent = '-';
  }
}

async function loadDeleterRecords() {
  if (!state.deleterSObject) return;

  DOM.deleterLoading.style.display = 'flex';
  DOM.deleterTable.style.display = 'none';
  DOM.deleterEmpty.style.display = 'none';

  const limit = parseInt(DOM.deleterFetchLimit ? DOM.deleterFetchLimit.value : '100', 10) || 100;
  const preset = state.deleterFilterPreset || 'all';

  try {
    const result = await state.sfService.getRecordsForDeletion(state.deleterSObject, {
      limit,
      filterPreset: preset
    });

    state.deleterRecords = result.records || [];
    state.deleterPrimaryField = result.nameField || 'Name';

    if (DOM.deleterThName) {
      DOM.deleterThName.textContent = state.deleterPrimaryField !== 'Id' ? `${state.deleterPrimaryField} / Name` : 'Record Identifier';
    }

    // Retain only selected IDs that are still in current set
    const loadedIdSet = new Set(state.deleterRecords.map(r => r.id));
    for (const id of Array.from(state.deleterSelectedIds)) {
      if (!loadedIdSet.has(id)) {
        state.deleterSelectedIds.delete(id);
      }
    }

    applyDeleterFilterAndRender();
  } catch (err) {
    console.error('Error loading records for deletion:', err);
    showToast(`Failed to load records: ${err.message}`, 'error');
    DOM.deleterEmpty.style.display = 'flex';
    DOM.deleterEmpty.querySelector('p').textContent = `Error querying records: ${err.message}`;
  } finally {
    DOM.deleterLoading.style.display = 'none';
  }
}

function applyDeleterFilterAndRender() {
  const query = (state.deleterSearchQuery || '').toLowerCase().trim();

  let filtered = state.deleterRecords;
  if (query) {
    filtered = filtered.filter(rec => {
      const idMatch = (rec.id || '').toLowerCase().includes(query);
      const nameMatch = (rec.displayName || '').toLowerCase().includes(query);
      return idMatch || nameMatch;
    });
  }

  // Client-side test pattern filter if preset is test_tool
  if (state.deleterFilterPreset === 'test_tool') {
    const testPattern = /(qa|test|batch|sample|mock|temp|demo|apex|nova|acme)/i;
    filtered = filtered.filter(rec => testPattern.test(rec.displayName || ''));
  }

  state.deleterFilteredRecords = filtered;
  renderDeleterTable();
}

function renderDeleterTable() {
  const records = state.deleterFilteredRecords;
  DOM.deleterTableBody.innerHTML = '';

  if (records.length === 0) {
    DOM.deleterTable.style.display = 'none';
    DOM.deleterEmpty.style.display = 'flex';
    const msg = state.deleterSearchQuery
      ? `No records match search "${state.deleterSearchQuery}".`
      : 'No records found for this object or filter criteria.';
    DOM.deleterEmpty.querySelector('p').textContent = msg;
  } else {
    DOM.deleterTable.style.display = 'table';
    DOM.deleterEmpty.style.display = 'none';

    const instanceUrl = (state.sfService && state.sfService.instanceUrl) || 'https://login.salesforce.com';

    records.forEach((rec) => {
      const tr = document.createElement('tr');
      const isSelected = state.deleterSelectedIds.has(rec.id);
      if (isSelected) tr.classList.add('row-selected');

      const sfRecordUrl = `${instanceUrl}/${rec.id}`;

      tr.innerHTML = `
        <td class="col-check">
          <input type="checkbox" class="deleter-row-checkbox" data-id="${escapeHtml(rec.id)}" ${isSelected ? 'checked' : ''}>
        </td>
        <td class="col-id">
          <div class="d-flex align-items-center gap-1">
            <a href="${safeUrl(sfRecordUrl)}" target="_blank" rel="noopener noreferrer" class="record-id-link" title="Open record in Salesforce">${escapeHtml(rec.id)}</a>
            <button type="button" class="icon-copy-btn" title="Copy Record ID" data-copy="${escapeHtml(rec.id)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </td>
        <td class="col-name" title="${escapeHtml(rec.displayName)}">
          <div class="deleter-record-name">${escapeHtml(rec.displayName)}</div>
        </td>
        <td class="col-date">
          <span class="text-secondary text-sm">${escapeHtml(rec.createdDate)}</span>
        </td>
        <td class="col-actions" style="text-align: right;">
          <button type="button" class="btn btn-outline-danger btn-xs row-del-btn" data-id="${rec.id}" title="Delete this single record">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      `;

      // Row checkbox change
      const checkbox = tr.querySelector('.deleter-row-checkbox');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.deleterSelectedIds.add(rec.id);
          tr.classList.add('row-selected');
        } else {
          state.deleterSelectedIds.delete(rec.id);
          tr.classList.remove('row-selected');
        }
        updateDeleterSummary();
        updateSelectAllCheckboxState();
      });

      // Copy ID button
      const copyBtn = tr.querySelector('.icon-copy-btn');
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(rec.id);
        showToast(`Copied ${rec.id} to clipboard`, 'info');
      });

      // Single delete button
      const delBtn = tr.querySelector('.row-del-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteConfirmModal([rec.id]);
      });

      DOM.deleterTableBody.appendChild(tr);
    });
  }

  // Update Toolbar Stats
  const limitVal = DOM.deleterFetchLimit ? DOM.deleterFetchLimit.value : '100';
  DOM.deleterTableStats.textContent = `${records.length} record${records.length === 1 ? '' : 's'} loaded (limit: ${limitVal})`;

  updateSelectAllCheckboxState();
  updateDeleterSummary();
}

function updateSelectAllCheckboxState() {
  if (!DOM.deleterSelectAllCheckbox) return;
  const records = state.deleterFilteredRecords;
  if (records.length === 0) {
    DOM.deleterSelectAllCheckbox.checked = false;
    DOM.deleterSelectAllCheckbox.indeterminate = false;
    return;
  }

  let selectedCount = 0;
  for (const rec of records) {
    if (state.deleterSelectedIds.has(rec.id)) selectedCount++;
  }

  if (selectedCount === 0) {
    DOM.deleterSelectAllCheckbox.checked = false;
    DOM.deleterSelectAllCheckbox.indeterminate = false;
  } else if (selectedCount === records.length) {
    DOM.deleterSelectAllCheckbox.checked = true;
    DOM.deleterSelectAllCheckbox.indeterminate = false;
  } else {
    DOM.deleterSelectAllCheckbox.checked = false;
    DOM.deleterSelectAllCheckbox.indeterminate = true;
  }
}

function toggleSelectAllDeleter(selectAll) {
  const records = state.deleterFilteredRecords;
  if (selectAll) {
    for (const rec of records) {
      state.deleterSelectedIds.add(rec.id);
    }
  } else {
    for (const rec of records) {
      state.deleterSelectedIds.delete(rec.id);
    }
  }

  // Update table row checkboxes without rebuilding the entire DOM
  const checkboxes = DOM.deleterTableBody.querySelectorAll('.deleter-row-checkbox');
  checkboxes.forEach(cb => {
    const id = cb.getAttribute('data-id');
    const checked = selectAll;
    cb.checked = checked;
    const row = cb.closest('tr');
    if (row) row.classList.toggle('row-selected', checked);
  });

  updateSelectAllCheckboxState();
  updateDeleterSummary();
}

function updateDeleterSummary() {
  const count = state.deleterSelectedIds.size;

  if (DOM.footerDeleterSelectedCount) {
    DOM.footerDeleterSelectedCount.textContent = `${count} record${count === 1 ? '' : 's'} selected`;
  }

  if (DOM.deleterSelectedBadge) {
    DOM.deleterSelectedBadge.textContent = `${count} selected`;
    DOM.deleterSelectedBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  if (DOM.btnExecuteDeleteSelected) {
    DOM.btnExecuteDeleteSelected.disabled = count === 0;
  }

  if (DOM.btnDeleteSelectedText) {
    DOM.btnDeleteSelectedText.textContent = count > 0 ? `Delete Selected Records (${count})` : 'Delete Selected Records';
  }

  if (DOM.footerDeleterWarning) {
    if (count > 0) {
      DOM.footerDeleterWarning.textContent = 'Will be moved to Salesforce Recycle Bin';
      DOM.footerDeleterWarning.className = 'summary-records text-warning';
    } else {
      DOM.footerDeleterWarning.textContent = 'Select records to delete';
      DOM.footerDeleterWarning.className = 'summary-records text-danger';
    }
  }
}

function openDeleteConfirmModal(idsToDelete) {
  if (!idsToDelete || idsToDelete.length === 0) {
    showToast('No records selected for deletion.', 'info');
    return;
  }

  state.pendingDeleteIds = idsToDelete;
  DOM.deleteConfirmCount.textContent = idsToDelete.length.toLocaleString();
  DOM.deleteConfirmObject.textContent = state.deleterSObject || 'Records';
  DOM.deleteConfirmModal.style.display = 'flex';
}

function closeDeleteConfirmModal() {
  DOM.deleteConfirmModal.style.display = 'none';
  state.pendingDeleteIds = [];
}

async function executeSalesforceDelete() {
  const idsToDelete = [...state.pendingDeleteIds];
  closeDeleteConfirmModal();

  if (!idsToDelete || idsToDelete.length === 0) return;

  // Open progress modal for deletion
  DOM.progressModal.style.display = 'flex';
  if (DOM.progressTitle) DOM.progressTitle.textContent = `Deleting Records from ${state.deleterSObject}...`;
  DOM.progressBarFill.style.width = '15%';
  DOM.progressStatusText.textContent = `Preparing batch deletion for ${idsToDelete.length} records...`;
  DOM.resultsSummarySection.style.display = 'none';
  DOM.btnCloseProgress.style.display = 'none';
  DOM.btnDownloadBatchCsv.style.display = 'none';

  try {
    DOM.progressBarFill.style.width = '45%';
    DOM.progressStatusText.textContent = `Submitting batch delete to Salesforce Composite API...`;

    const result = await state.sfService.deleteRecords(state.deleterSObject, idsToDelete);

    DOM.progressBarFill.style.width = '100%';
    DOM.progressStatusText.textContent = `Completed! ${result.successCount} of ${result.total} records moved to Recycle Bin.`;

    DOM.statSuccessCount.textContent = result.successCount;
    if (result.failureCount > 0) {
      DOM.statFailedBadge.style.display = 'flex';
      DOM.statFailedCount.textContent = result.failureCount;
    } else {
      DOM.statFailedBadge.style.display = 'none';
    }

    // List results
    DOM.createdIdsList.innerHTML = '';

    result.results.forEach((item, index) => {
      const li = document.createElement('li');
      if (item.success) {
        li.innerHTML = `
          <span class="text-success">✓ Deleted: <code>${escapeHtml(item.id)}</code></span>
          <span class="text-muted text-xs">Recycle Bin</span>
        `;
      } else {
        li.innerHTML = `
          <span class="text-danger">✗ Failed [${escapeHtml(item.id || '#' + (index + 1))}]: ${escapeHtml(item.errorMessage || 'Unknown error')}</span>
        `;
      }
      DOM.createdIdsList.appendChild(li);
    });

    DOM.resultsSummarySection.style.display = 'flex';
    DOM.btnCloseProgress.style.display = 'inline-flex';

    // Remove deleted IDs from state and selection
    const deletedIdSet = new Set(result.results.filter(r => r.success).map(r => r.id));
    state.deleterRecords = state.deleterRecords.filter(r => !deletedIdSet.has(r.id));
    for (const id of deletedIdSet) {
      state.deleterSelectedIds.delete(id);
    }

    // Refresh views
    applyDeleterFilterAndRender();
    fetchDeleterTotalCount(state.deleterSObject);

    // Log deletion activity in history
    const instanceUrl = (state.sfService && state.sfService.instanceUrl) || 'https://login.salesforce.com';
    await StorageService.logGeneration({
      objectName: state.deleterSObject,
      objectLabel: `${state.deleterSObject} (Batch Delete)`,
      recordCount: idsToDelete.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      status: result.failureCount === 0 ? 'success' : (result.successCount > 0 ? 'partial' : 'failed'),
      records: result.results.map(r => ({ id: r.id, status: r.success ? 'Deleted' : 'Failed', error: r.errorMessage || '' })),
      createdIds: result.results.filter(r => r.success).map(r => r.id),
      errors: result.results.filter(r => !r.success).map(r => r.errorMessage),
      instanceUrl
    });

    if (result.successCount > 0) {
      showToast(`Successfully deleted ${result.successCount} records!`, 'success');
    } else {
      showToast('Deletion failed: All records could not be deleted.', 'error');
    }
  } catch (err) {
    console.error('Batch delete error:', err);
    DOM.progressBarFill.style.width = '100%';
    DOM.progressStatusText.textContent = `Error: ${err.message}`;
    DOM.btnCloseProgress.style.display = 'inline-flex';

    if (err.message.includes('401') || err.message.includes('Session expired')) {
      showSessionAlert('Salesforce session expired or restricted.');
    }
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

function bindDeleterEvents() {
  if (!DOM.deleterSObjectSelect) return;

  // Object selector
  DOM.deleterSObjectSelect.addEventListener('change', (e) => {
    onSelectDeleterSObject(e.target.value);
  });

  // Limit selector
  if (DOM.deleterFetchLimit) {
    DOM.deleterFetchLimit.addEventListener('change', () => {
      loadDeleterRecords();
    });
  }

  // Refresh query button
  if (DOM.btnRefreshDeleterRecords) {
    DOM.btnRefreshDeleterRecords.addEventListener('click', () => {
      refreshDeleterData();
    });
  }

  // Filter Preset Pills
  const presetPills = [
    { btn: DOM.btnFilterPresetAll, preset: 'all' },
    { btn: DOM.btnFilterPresetToday, preset: 'today' },
    { btn: DOM.btnFilterPresetWeek, preset: 'this_week' },
    { btn: DOM.btnFilterPresetTool, preset: 'test_tool' }
  ];

  presetPills.forEach(({ btn, preset }) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      presetPills.forEach(p => p.btn && p.btn.classList.remove('active'));
      btn.classList.add('active');
      state.deleterFilterPreset = preset;
      loadDeleterRecords();
    });
  });

  // Search input & clear
  if (DOM.deleterSearchInput) {
    DOM.deleterSearchInput.addEventListener('input', (e) => {
      state.deleterSearchQuery = e.target.value;
      if (DOM.btnClearDeleterSearch) {
        DOM.btnClearDeleterSearch.style.display = e.target.value ? 'block' : 'none';
      }
      applyDeleterFilterAndRender();
    });
  }

  if (DOM.btnClearDeleterSearch) {
    DOM.btnClearDeleterSearch.addEventListener('click', () => {
      if (DOM.deleterSearchInput) {
        DOM.deleterSearchInput.value = '';
        state.deleterSearchQuery = '';
      }
      DOM.btnClearDeleterSearch.style.display = 'none';
      applyDeleterFilterAndRender();
    });
  }

  // Select All / Clear toolbar links
  if (DOM.btnSelectAllDeleter) {
    DOM.btnSelectAllDeleter.addEventListener('click', () => {
      toggleSelectAllDeleter(true);
    });
  }

  if (DOM.btnDeselectAllDeleter) {
    DOM.btnDeselectAllDeleter.addEventListener('click', () => {
      toggleSelectAllDeleter(false);
    });
  }

  // Table header checkbox
  if (DOM.deleterSelectAllCheckbox) {
    DOM.deleterSelectAllCheckbox.addEventListener('change', (e) => {
      toggleSelectAllDeleter(e.target.checked);
    });
  }

  // Delete selected button
  if (DOM.btnExecuteDeleteSelected) {
    DOM.btnExecuteDeleteSelected.addEventListener('click', () => {
      openDeleteConfirmModal(Array.from(state.deleterSelectedIds));
    });
  }

  // Confirmation Modal buttons
  if (DOM.btnCloseDeleteConfirm) {
    DOM.btnCloseDeleteConfirm.addEventListener('click', closeDeleteConfirmModal);
  }
  if (DOM.btnCancelDelete) {
    DOM.btnCancelDelete.addEventListener('click', closeDeleteConfirmModal);
  }
  if (DOM.btnConfirmDeleteExecute) {
    DOM.btnConfirmDeleteExecute.addEventListener('click', executeSalesforceDelete);
  }
}

