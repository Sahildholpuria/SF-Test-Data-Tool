/**
 * SF DataForge - Main Application Controller
 */

// Side Panel View Mode Check
const isSidePanelMode = (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('is-sidepanel')) ||
  (typeof window !== 'undefined' && window.location && (
    window.location.pathname.includes('sidepanel') ||
    (window.location.search && window.location.search.includes('mode=sidepanel'))
  ));

if (isSidePanelMode && typeof document !== 'undefined') {
  if (document.documentElement) document.documentElement.classList.add('is-sidepanel');
  if (document.body) {
    document.body.classList.add('is-sidepanel');
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) document.body.classList.add('is-sidepanel');
    });
  }
}

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
  generatedPreviewChildren: [],
  lastBatchResult: null,

  // Record Type State
  selectedRecordTypeId: '',
  availableRecordTypes: [],

  // Killer Feature Master Switch & Relational Graph State
  killerFeatureEnabled: true,
  relationalConfig: {
    enabled: true,
    children: [] // array of { sObject, label, foreignKey, count, enabled, isDefault }
  },

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
  bindAdvanceEvents();
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
  state.killerFeatureEnabled = await StorageService.get('sf_dataforge_killer_feature_enabled', true);
  syncKillerFeatureUI();
  await initializeConnection();
});

function cacheDOMElements() {
  DOM.connectionStatusPill = document.getElementById('connectionStatusPill');
  DOM.statusDot = document.getElementById('statusDot');
  DOM.statusText = document.getElementById('statusText');
  DOM.btnThemeToggle = document.getElementById('btnThemeToggle');
  DOM.themeToggleIcon = document.getElementById('themeToggleIcon');
  DOM.btnOpenSidePanel = document.getElementById('btnOpenSidePanel');
  if (DOM.btnOpenSidePanel && isSidePanelMode) {
    DOM.btnOpenSidePanel.style.display = 'none';
  }

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

  // Lookup / Reference Search Modal
  DOM.lookupRecordsModal = document.getElementById('lookupRecordsModal');
  DOM.lookupModalTitle = document.getElementById('lookupModalTitle');
  DOM.lookupModalSubtitle = document.getElementById('lookupModalSubtitle');
  DOM.btnCloseLookupModal = document.getElementById('btnCloseLookupModal');
  DOM.btnCloseLookupModalBottom = document.getElementById('btnCloseLookupModalBottom');
  DOM.btnLookupStrategyOrg = document.getElementById('btnLookupStrategyOrg');
  DOM.btnLookupStrategyHistory = document.getElementById('btnLookupStrategyHistory');
  DOM.lookupHistoryCount = document.getElementById('lookupHistoryCount');
  DOM.btnLookupStrategyNone = document.getElementById('btnLookupStrategyNone');
  DOM.lookupSearchInput = document.getElementById('lookupSearchInput');
  DOM.btnClearLookupSearch = document.getElementById('btnClearLookupSearch');
  DOM.lookupTargetSwitch = document.getElementById('lookupTargetSwitch');
  DOM.lookupTargetSelect = document.getElementById('lookupTargetSelect');
  DOM.btnRefreshLookupSearch = document.getElementById('btnRefreshLookupSearch');
  DOM.lookupLoading = document.getElementById('lookupLoading');
  DOM.lookupResultsContainer = document.getElementById('lookupResultsContainer');
  DOM.lookupResultsTableBody = document.getElementById('lookupResultsTableBody');
  DOM.lookupEmptyState = document.getElementById('lookupEmptyState');
  DOM.lookupEmptyMessage = document.getElementById('lookupEmptyMessage');
  DOM.lookupManualIdInput = document.getElementById('lookupManualIdInput');
  DOM.btnApplyManualId = document.getElementById('btnApplyManualId');

  // Navigation
  DOM.navTabs = document.querySelectorAll('.nav-tab');
  DOM.tabPanels = document.querySelectorAll('.tab-panel');

  // SObject Configuration
  DOM.sobjectSelect = document.getElementById('sobjectSelect');
  DOM.objectTypeBadge = document.getElementById('objectTypeBadge');
  DOM.recordCountInput = document.getElementById('recordCountInput');
  DOM.btnCountDec = document.getElementById('btnCountDec');
  DOM.btnCountInc = document.getElementById('btnCountInc');
  DOM.destinationSelect = document.getElementById('destinationSelect');
  DOM.recordTypeGroup = document.getElementById('recordTypeGroup');
  DOM.recordTypeSelect = document.getElementById('recordTypeSelect');
  DOM.recordTypeBadge = document.getElementById('recordTypeBadge');

  // Advance (Relational Graph Killer Feature)
  DOM.btnGoToAdvance = document.getElementById('btnGoToAdvance');
  DOM.generatorTeaserObjName = document.getElementById('generatorTeaserObjName');
  DOM.toggleKillerFeature = document.getElementById('toggleKillerFeature');
  DOM.toggleKillerFeatureLabel = document.getElementById('toggleKillerFeatureLabel');
  DOM.advanceFeatureStatusBadge = document.getElementById('advanceFeatureStatusBadge');
  DOM.advanceDisabledCard = document.getElementById('advanceDisabledCard');
  DOM.advanceControlsWrapper = document.getElementById('advanceControlsWrapper');
  DOM.btnEnableKillerFeature = document.getElementById('btnEnableKillerFeature');
  DOM.advanceSObjectSelect = document.getElementById('advanceSObjectSelect');
  DOM.advanceObjectTypeBadge = document.getElementById('advanceObjectTypeBadge');
  DOM.advanceRecordTypeGroup = document.getElementById('advanceRecordTypeGroup');
  DOM.advanceRecordTypeSelect = document.getElementById('advanceRecordTypeSelect');
  DOM.advanceRecordTypeBadge = document.getElementById('advanceRecordTypeBadge');
  DOM.advanceRecordCountInput = document.getElementById('advanceRecordCountInput');
  DOM.btnAdvanceCountDec = document.getElementById('btnAdvanceCountDec');
  DOM.btnAdvanceCountInc = document.getElementById('btnAdvanceCountInc');
  DOM.advanceDestinationSelect = document.getElementById('advanceDestinationSelect');
  DOM.advanceGraphTotalSummary = document.getElementById('advanceGraphTotalSummary');
  DOM.btnAdvancePreview = document.getElementById('btnAdvancePreview');
  DOM.btnAdvanceGenerate = document.getElementById('btnAdvanceGenerate');
  DOM.btnAdvanceGenerateText = document.getElementById('btnAdvanceGenerateText');

  // Relational Data Graph
  DOM.relationalCard = document.getElementById('relationalCard');
  DOM.toggleRelationalData = document.getElementById('toggleRelationalData');
  DOM.relationalBody = document.getElementById('relationalBody');
  DOM.relationalParentName = document.getElementById('relationalParentName');
  DOM.relationalSummaryBadge = document.getElementById('relationalSummaryBadge');
  DOM.relationalChildrenList = document.getElementById('relationalChildrenList');
  DOM.relationalAddSelect = document.getElementById('relationalAddSelect');

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
  DOM.previewTabs = document.getElementById('previewTabs');
  DOM.tabPreviewParent = document.getElementById('tabPreviewParent');
  DOM.tabPreviewChildren = document.getElementById('tabPreviewChildren');
  DOM.previewParentCount = document.getElementById('previewParentCount');
  DOM.previewChildrenCount = document.getElementById('previewChildrenCount');
  DOM.previewChildrenWrapper = document.getElementById('previewChildrenWrapper');
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

    // Also populate Advance parent object dropdown
    if (DOM.advanceSObjectSelect) {
      DOM.advanceSObjectSelect.innerHTML = DOM.sobjectSelect.innerHTML;
    }

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
  if (DOM.advanceSObjectSelect) {
    DOM.advanceSObjectSelect.value = sObjectName;
  }
  if (DOM.advanceObjectTypeBadge && objMeta) {
    DOM.advanceObjectTypeBadge.textContent = objMeta.custom ? 'Custom Object' : 'Standard Object';
  }
  if (DOM.generatorTeaserObjName) {
    DOM.generatorTeaserObjName.textContent = objMeta ? objMeta.label : sObjectName;
  }

  DOM.fieldsLoading.style.display = 'flex';
  DOM.fieldsTable.style.display = 'none';
  DOM.fieldsEmpty.style.display = 'none';

  try {
    const describe = await state.sfService.describeSObject(sObjectName);
    state.objectDescribe = describe;
    state.fieldConfigs = {};

    // Handle Record Types
    state.selectedRecordTypeId = '';
    state.availableRecordTypes = [];

    const recordTypes = (describe.recordTypeInfos || []).filter(rt => !rt.master);
    if (recordTypes && recordTypes.length > 1) {
      state.availableRecordTypes = recordTypes;
      if (DOM.recordTypeGroup && DOM.recordTypeSelect) {
        DOM.recordTypeSelect.innerHTML = '';

        // Option 1: Default Record Type
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        const defRt = recordTypes.find(rt => rt.isDefault);
        defaultOpt.textContent = defRt ? `Default (${defRt.name})` : 'Default Record Type';
        DOM.recordTypeSelect.appendChild(defaultOpt);

        // Option 2: Random / Mixed
        const randomOpt = document.createElement('option');
        randomOpt.value = '__RANDOM__';
        randomOpt.textContent = '🎲 Random / Mixed (Distribute Across Types)';
        DOM.recordTypeSelect.appendChild(randomOpt);

        // Options: Specific Record Types
        const optGroup = document.createElement('optgroup');
        optGroup.label = 'Specific Record Types';
        recordTypes.forEach(rt => {
          const opt = document.createElement('option');
          opt.value = rt.id;
          opt.textContent = `${rt.name}${rt.isDefault ? ' (Default)' : ''}`;
          optGroup.appendChild(opt);
        });
        DOM.recordTypeSelect.appendChild(optGroup);

        DOM.recordTypeSelect.value = '';
        if (DOM.recordTypeBadge) {
          DOM.recordTypeBadge.textContent = `${recordTypes.length} Types`;
        }
        DOM.recordTypeGroup.style.display = '';

        if (DOM.advanceRecordTypeGroup && DOM.advanceRecordTypeSelect) {
          DOM.advanceRecordTypeSelect.innerHTML = DOM.recordTypeSelect.innerHTML;
          DOM.advanceRecordTypeSelect.value = '';
          if (DOM.advanceRecordTypeBadge) {
            DOM.advanceRecordTypeBadge.textContent = `${recordTypes.length} Types`;
          }
          DOM.advanceRecordTypeGroup.style.display = '';
        }
      }
    } else {
      if (DOM.recordTypeGroup) {
        DOM.recordTypeGroup.style.display = 'none';
      }
      if (DOM.recordTypeSelect) {
        DOM.recordTypeSelect.innerHTML = '<option value="">Default Record Type</option>';
        DOM.recordTypeSelect.value = '';
      }
      if (DOM.advanceRecordTypeGroup) {
        DOM.advanceRecordTypeGroup.style.display = 'none';
      }
      if (DOM.advanceRecordTypeSelect) {
        DOM.advanceRecordTypeSelect.innerHTML = '<option value="">Default Record Type</option>';
        DOM.advanceRecordTypeSelect.value = '';
      }
    }

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

      const isRecordTypeField = field.name === 'RecordTypeId';

      state.fieldConfigs[field.name] = {
        enabled: isRecordTypeField ? true : isReq, // Auto-enable RecordTypeId
        mode: (isPicklist && !isAddress) ? GeneratorEngine.MODES.PICKLIST : GeneratorEngine.MODES.REALISTIC,
        pattern: getDefaultPattern(field),
        fixedValue: '',
        picklistValue: isRecordTypeField ? '' : '__RANDOM__',
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
    updateRelationalConfigForObject(sObjectName, describe);
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
      if (field.name === 'RecordTypeId') {
        if (!config.enabled) {
          state.selectedRecordTypeId = '';
          if (DOM.recordTypeSelect) DOM.recordTypeSelect.value = '';
          if (DOM.recordTypeBadge) DOM.recordTypeBadge.textContent = 'Default';
        }
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
    
    if (field.name === 'RecordTypeId') {
      const defOpt = document.createElement('option');
      defOpt.value = '';
      defOpt.textContent = 'Default Record Type';
      if (!config.picklistValue) defOpt.selected = true;
      select.appendChild(defOpt);
    }

    const randomOpt = document.createElement('option');
    randomOpt.value = '__RANDOM__';
    randomOpt.textContent = isStateField
      ? `🎲 Random US State (${values.length} valid states)`
      : (field.name === 'RecordTypeId'
        ? `🎲 Random / Mixed (${values.length} types)`
        : `🎲 Random (from ${values.length} values)`);
    if ((!config.picklistValue && field.name !== 'RecordTypeId') || config.picklistValue === '__RANDOM__') {
      randomOpt.selected = true;
    }
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
      if (field.name === 'RecordTypeId') {
        state.selectedRecordTypeId = e.target.value;
        if (DOM.recordTypeSelect) DOM.recordTypeSelect.value = state.selectedRecordTypeId;
        if (DOM.recordTypeBadge) {
          if (!state.selectedRecordTypeId) {
            DOM.recordTypeBadge.textContent = state.availableRecordTypes.length > 0 ? `${state.availableRecordTypes.length} Types` : 'Default';
          } else if (state.selectedRecordTypeId === '__RANDOM__') {
            DOM.recordTypeBadge.textContent = '🎲 Mixed';
          } else {
            const match = state.availableRecordTypes.find(rt => rt.id === state.selectedRecordTypeId);
            DOM.recordTypeBadge.textContent = match ? match.name : 'Selected';
          }
        }
      }
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
        if (field.name === 'RecordTypeId') {
          state.selectedRecordTypeId = pv.value;
          if (DOM.recordTypeSelect) DOM.recordTypeSelect.value = pv.value;
          if (DOM.recordTypeBadge) DOM.recordTypeBadge.textContent = pv.label || 'Selected';
        }
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
    const targetObj = (field.referenceTo && field.referenceTo[0]) || 'Parent';
    const group = document.createElement('div');
    group.className = 'lookup-field-group';

    const rowMain = document.createElement('div');
    rowMain.className = 'lookup-row-main';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lookup-select-btn';

    if (config.referenceMode === 'random_org' || config.referenceId === '__RANDOM_ORG__') {
      btn.innerHTML = `🎲 Random from Org (${escapeHtml(targetObj)})`;
      btn.classList.add('is-random');
      btn.title = `Randomly selects from ${targetObj} records in your Salesforce org`;
    } else if (config.referenceMode === 'random_history' || config.referenceId === '__RANDOM_HISTORY__') {
      btn.innerHTML = `📦 Random from History (${escapeHtml(targetObj)})`;
      btn.classList.add('is-random');
      btn.title = `Randomly selects from ${targetObj} records previously generated by SF DataForge`;
    } else if (config.referenceId && config.referenceId !== '__NONE__') {
      btn.innerHTML = `🏢 ${escapeHtml(config.referenceName || config.referenceId)}`;
      btn.classList.add('is-selected');
      btn.title = `Record ID: ${config.referenceId} (Click to change)`;
    } else {
      btn.innerHTML = `🔍 Lookup ${escapeHtml(targetObj)}...`;
      btn.title = `Search or choose random ${targetObj} record`;
    }

    const btnClear = document.createElement('button');
    btnClear.type = 'button';
    btnClear.className = 'lookup-btn-clear';
    btnClear.innerHTML = '&times;';
    btnClear.title = 'Clear lookup value (set null)';
    btnClear.style.display = (config.referenceId && config.referenceId !== '__NONE__') ? 'inline-block' : 'none';

    btnClear.addEventListener('click', (e) => {
      e.stopPropagation();
      config.referenceId = '';
      config.referenceName = '';
      config.referenceMode = 'none';
      updateLookupFieldRowUI(field, config, btn);
      btnClear.style.display = 'none';
      showToast(`Cleared ${field.label}`, 'info');
    });

    btn.addEventListener('click', () => {
      openLookupModal(field, config, btn);
    });

    rowMain.appendChild(btn);
    rowMain.appendChild(btnClear);
    group.appendChild(rowMain);

    const pillsRow = document.createElement('div');
    pillsRow.className = 'lookup-pills-row';

    const pillOrg = document.createElement('span');
    pillOrg.className = `lookup-pill lookup-pill-org ${(config.referenceMode === 'random_org' || config.referenceId === '__RANDOM_ORG__') ? 'active' : ''}`;
    pillOrg.textContent = '🎲 Random Org';
    pillOrg.title = `Assign random ${targetObj} records from your Salesforce org`;
    pillOrg.addEventListener('click', () => {
      config.referenceId = '__RANDOM_ORG__';
      config.referenceName = `Random from Org`;
      config.referenceMode = 'random_org';
      updateLookupFieldRowUI(field, config, btn);
      btnClear.style.display = 'inline-block';
      pillsRow.querySelectorAll('.lookup-pill').forEach(p => p.classList.remove('active'));
      pillOrg.classList.add('active');
      showToast(`Set ${field.label} to Random from Org`, 'info');
    });
    pillsRow.appendChild(pillOrg);

    const pillSearch = document.createElement('span');
    pillSearch.className = 'lookup-pill lookup-pill-search';
    pillSearch.textContent = '🔍 Search...';
    pillSearch.title = `Search and select specific ${targetObj} record`;
    pillSearch.addEventListener('click', () => {
      openLookupModal(field, config, btn);
    });
    pillsRow.appendChild(pillSearch);

    group.appendChild(pillsRow);
    container.appendChild(group);
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
  const recordCount = parseInt(DOM.recordCountInput ? DOM.recordCountInput.value : '1', 10) || 1;

  if (DOM.selectedFieldsCount) DOM.selectedFieldsCount.textContent = selectedCount;
  if (DOM.footerSelectedSummary) DOM.footerSelectedSummary.textContent = `${selectedCount} fields selected`;

  if (DOM.footerRecordsSummary) {
    const isRelational = state.relationalConfig && state.relationalConfig.enabled && state.relationalConfig.children && state.relationalConfig.children.some(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);
    if (isRelational) {
      const activeChildren = state.relationalConfig.children.filter(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);
      const totalPerParent = activeChildren.reduce((sum, c) => sum + (parseInt(c.count, 10) || 1), 0);
      const totalGraph = recordCount + (recordCount * totalPerParent);
      DOM.footerRecordsSummary.textContent = `${recordCount} ${state.selectedObject || 'Records'} + ${recordCount * totalPerParent} Children (${totalGraph} Total Graph)`;
    } else {
      DOM.footerRecordsSummary.textContent = `${recordCount} record${recordCount > 1 ? 's' : ''}`;
    }
  }
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
  } else if (tabId === 'tab-advance') {
    syncKillerFeatureUI();
  }
}

function bindGeneratorEvents() {
  // SObject select
  DOM.sobjectSelect.addEventListener('change', (e) => {
    onSelectSObject(e.target.value);
  });

  // Record Type select
  if (DOM.recordTypeSelect) {
    DOM.recordTypeSelect.addEventListener('change', (e) => {
      state.selectedRecordTypeId = e.target.value;
      if (DOM.recordTypeBadge) {
        if (!state.selectedRecordTypeId) {
          DOM.recordTypeBadge.textContent = state.availableRecordTypes.length > 0 ? `${state.availableRecordTypes.length} Types` : 'Default';
        } else if (state.selectedRecordTypeId === '__RANDOM__') {
          DOM.recordTypeBadge.textContent = '🎲 Mixed';
        } else {
          const match = state.availableRecordTypes.find(rt => rt.id === state.selectedRecordTypeId);
          DOM.recordTypeBadge.textContent = match ? match.name : 'Selected';
        }
      }

      // Synchronize with RecordTypeId row in fieldConfigs and re-render table
      if (state.fieldConfigs['RecordTypeId']) {
        state.fieldConfigs['RecordTypeId'].enabled = true;
        state.fieldConfigs['RecordTypeId'].mode = GeneratorEngine.MODES.PICKLIST;
        state.fieldConfigs['RecordTypeId'].picklistValue = state.selectedRecordTypeId;
        renderFieldsTable();
      }
    });
  }

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

  // Relational Data Graph Toggle
  if (DOM.toggleRelationalData) {
    DOM.toggleRelationalData.addEventListener('change', (e) => {
      state.relationalConfig.enabled = e.target.checked;
      if (DOM.relationalCard) {
        DOM.relationalCard.classList.toggle('active', state.relationalConfig.enabled);
      }
      if (DOM.relationalBody) {
        DOM.relationalBody.style.display = state.relationalConfig.enabled ? 'block' : 'none';
      }
      updateRelationalSummary();
      updateFooterSummary();
    });
  }

  // Relational Add Child Dropdown
  if (DOM.relationalAddSelect) {
    DOM.relationalAddSelect.addEventListener('change', (e) => {
      if (!e.target.value) return;
      try {
        const item = JSON.parse(e.target.value);
        if (!state.relationalConfig.children.some(c => c.sObject === item.sObject)) {
          state.relationalConfig.children.push({
            sObject: item.sObject,
            label: item.label,
            foreignKey: item.foreignKey,
            count: 1,
            enabled: true,
            isDefault: false
          });
          renderRelationalChildrenList();
          updateRelationalSummary();
          updateFooterSummary();
          showToast(`Added ${item.label} (${item.foreignKey}) to relational graph!`, 'info');
        }
      } catch (err) {
        console.error('Failed to parse child option:', err);
      }
      e.target.value = '';
    });
  }

  // Preview Tabs
  if (DOM.tabPreviewParent) {
    DOM.tabPreviewParent.addEventListener('click', () => {
      DOM.tabPreviewParent.classList.add('active');
      if (DOM.tabPreviewChildren) DOM.tabPreviewChildren.classList.remove('active');
      if (DOM.previewTableWrapper) DOM.previewTableWrapper.style.display = 'block';
      if (DOM.previewChildrenWrapper) DOM.previewChildrenWrapper.style.display = 'none';
    });
  }

  if (DOM.tabPreviewChildren) {
    DOM.tabPreviewChildren.addEventListener('click', () => {
      DOM.tabPreviewChildren.classList.add('active');
      if (DOM.tabPreviewParent) DOM.tabPreviewParent.classList.remove('active');
      if (DOM.previewTableWrapper) DOM.previewTableWrapper.style.display = 'none';
      if (DOM.previewChildrenWrapper) DOM.previewChildrenWrapper.style.display = 'block';
    });
  }

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

  if (DOM.btnOpenSidePanel) {
    DOM.btnOpenSidePanel.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
        setTimeout(() => {
          try { window.close(); } catch (e) {}
        }, 120);
      } else {
        showToast('Side Panel is available inside Google Chrome browser.', 'info');
      }
    });
  }
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
async function onOpenPreview() {
  if (!state.selectedObject) {
    showToast('Please select a Target SObject from the dropdown first.', 'warning');
    shakeElement(DOM.sobjectSelect);
    return;
  }

  const selectedFields = Object.entries(state.fieldConfigs).filter(([_, c]) => c && c.enabled);
  if (selectedFields.length === 0) {
    showToast('No fields selected! Please select at least one field before opening preview.', 'warning');
    shakeElement(DOM.btnPreviewData);
    shakeElement(DOM.fieldsTable);
    return;
  }

  const count = parseInt(DOM.recordCountInput.value, 10);
  if (isNaN(count) || count < 1) {
    showToast('Please specify a valid record count (between 1 and 200).', 'warning');
    shakeElement(DOM.recordCountInput);
    return;
  }

  // Pre-fetch lookup pools if any reference fields use random org/history mode
  await prepareLookupFieldPools(state.fieldConfigs, state.objectDescribe);

  const records = GeneratorEngine.generateRecords(
    state.selectedObject,
    state.objectDescribe,
    state.fieldConfigs,
    count,
    state.selectedRecordTypeId,
    state.availableRecordTypes
  );

  state.generatedPreviewRecords = records;
  const isRelational = state.activeTab === 'tab-advance' && state.relationalConfig.enabled && state.relationalConfig.children.some(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);

  if (isRelational) {
    const parentPrefix = (state.objectDescribe && state.objectDescribe.keyPrefix) || '001';
    state.generatedPreviewChildren = [];

    records.forEach((parentRec, idx) => {
      const simulatedParentId = `${parentPrefix}PREV00000${idx + 1}`.slice(-18).padStart(18, '0');
      parentRec._previewId = simulatedParentId;

      const activeChildren = state.relationalConfig.children.filter(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);
      activeChildren.forEach(childConf => {
        const cCount = parseInt(childConf.count, 10) || 1;
        const childRecords = (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.generateChildRecordsForParent)
          ? GeneratorEngine.generateChildRecordsForParent(
              state.selectedObject,
              parentRec,
              simulatedParentId,
              childConf.sObject,
              childConf.foreignKey,
              cCount
            )
          : [];

        childRecords.forEach(cRec => {
          state.generatedPreviewChildren.push({
            childSObject: childConf.sObject,
            parentName: parentRec.Name || parentRec.LastName || `Parent #${idx + 1}`,
            parentId: simulatedParentId,
            record: cRec
          });
        });
      });
    });

    if (DOM.previewTabs) {
      DOM.previewTabs.style.display = 'flex';
      if (DOM.previewParentCount) DOM.previewParentCount.textContent = records.length;
      if (DOM.previewChildrenCount) DOM.previewChildrenCount.textContent = state.generatedPreviewChildren.length;
      if (DOM.tabPreviewParent) DOM.tabPreviewParent.classList.add('active');
      if (DOM.tabPreviewChildren) DOM.tabPreviewChildren.classList.remove('active');
    }

    if (DOM.previewTableWrapper) DOM.previewTableWrapper.style.display = 'block';
    if (DOM.previewChildrenWrapper) DOM.previewChildrenWrapper.style.display = 'none';

    renderPreviewTable(records);
    renderChildrenPreviewTable(state.generatedPreviewChildren);
    DOM.previewSubtitle.textContent = `Previewing Relational Graph: ${records.length} ${state.selectedObject} + ${state.generatedPreviewChildren.length} Linked Children`;
  } else {
    if (DOM.previewTabs) DOM.previewTabs.style.display = 'none';
    if (DOM.previewTableWrapper) DOM.previewTableWrapper.style.display = 'block';
    if (DOM.previewChildrenWrapper) DOM.previewChildrenWrapper.style.display = 'none';

    renderPreviewTable(records);
    DOM.previewSubtitle.textContent = `Previewing ${count} generated record${count > 1 ? 's' : ''} for ${state.selectedObject}`;
  }

  DOM.previewModal.style.display = 'flex';
}

function renderPreviewTable(records) {
  if (!records || records.length === 0) {
    DOM.previewTableWrapper.innerHTML = '<p class="text-muted p-3 text-center">No records generated.</p>';
    return;
  }

  const keys = Object.keys(records[0]).filter(k => !k.startsWith('_previewId'));
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

function renderChildrenPreviewTable(previewChildren) {
  if (!DOM.previewChildrenWrapper) return;
  if (!previewChildren || previewChildren.length === 0) {
    DOM.previewChildrenWrapper.innerHTML = '<div class="empty-state"><p>No related child records configured.</p></div>';
    return;
  }

  let html = `
    <table class="preview-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Child Object</th>
          <th>Parent Link</th>
          <th>Generated Field Details</th>
        </tr>
      </thead>
      <tbody>
  `;

  previewChildren.forEach((item, idx) => {
    const details = Object.entries(item.record)
      .map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}`)
      .join(' &nbsp;•&nbsp; ');

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><span class="field-meta-tag">${escapeHtml(item.childSObject)}</span></td>
        <td><code>${escapeHtml(item.parentId)}</code><br><small class="text-muted">${escapeHtml(item.parentName)}</small></td>
        <td style="font-size: 11px; line-height: 1.5;">${details}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  DOM.previewChildrenWrapper.innerHTML = html;
}

// Relational configuration update & rendering
function updateRelationalConfigForObject(sObjectName, describe) {
  if (!DOM.relationalCard) return;

  if (DOM.relationalParentName) {
    DOM.relationalParentName.textContent = describe.label || sObjectName;
  }

  const childRelations = describe.childRelationships || [];

  // Default presets for standard & common objects
  const defaultChildren = [];
  if (sObjectName === 'Account') {
    defaultChildren.push(
      { sObject: 'Contact', label: 'Contacts', foreignKey: 'AccountId', count: 2, enabled: true, isDefault: true },
      { sObject: 'Opportunity', label: 'Opportunities', foreignKey: 'AccountId', count: 1, enabled: true, isDefault: true },
      { sObject: 'Case', label: 'Cases', foreignKey: 'AccountId', count: 1, enabled: true, isDefault: true }
    );
  } else if (sObjectName === 'Contact') {
    defaultChildren.push(
      { sObject: 'Case', label: 'Cases', foreignKey: 'ContactId', count: 1, enabled: true, isDefault: true }
    );
  } else if (childRelations.length > 0) {
    const candidates = childRelations.filter(cr =>
      !cr.childSObject.endsWith('History') &&
      !cr.childSObject.endsWith('Share') &&
      !cr.childSObject.endsWith('Feed') &&
      !cr.childSObject.endsWith('ChangeEvent')
    );
    candidates.slice(0, 2).forEach(cr => {
      defaultChildren.push({
        sObject: cr.childSObject,
        label: cr.relationshipName || cr.childSObject,
        foreignKey: cr.field,
        count: 1,
        enabled: false,
        isDefault: false
      });
    });
  }

  state.relationalConfig.children = defaultChildren;

  // Populate "+ Add another related object" dropdown
  if (DOM.relationalAddSelect) {
    DOM.relationalAddSelect.innerHTML = '<option value="" disabled selected>+ Add another related object...</option>';
    const existing = new Set(defaultChildren.map(c => c.sObject));
    const available = childRelations.filter(cr =>
      !existing.has(cr.childSObject) &&
      !cr.childSObject.endsWith('History') &&
      !cr.childSObject.endsWith('Share') &&
      !cr.childSObject.endsWith('Feed') &&
      !cr.childSObject.endsWith('ChangeEvent')
    );

    if (available.length > 0) {
      available.forEach(cr => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({
          sObject: cr.childSObject,
          foreignKey: cr.field,
          label: cr.relationshipName || cr.childSObject
        });
        opt.textContent = `${cr.relationshipName || cr.childSObject} (${cr.childSObject} via ${cr.field})`;
        DOM.relationalAddSelect.appendChild(opt);
      });
      DOM.relationalAddSelect.style.display = 'inline-block';
    } else {
      DOM.relationalAddSelect.style.display = 'none';
    }
  }

  renderRelationalChildrenList();
  updateRelationalSummary();
}

function renderRelationalChildrenList() {
  if (!DOM.relationalChildrenList) return;

  DOM.relationalChildrenList.innerHTML = '';

  if (state.relationalConfig.children.length === 0) {
    DOM.relationalChildrenList.innerHTML = '<div class="text-muted text-xs p-2">No child relationships available for this object.</div>';
    return;
  }

  state.relationalConfig.children.forEach((child, index) => {
    const row = document.createElement('div');
    row.className = 'child-relation-row';

    row.innerHTML = `
      <div class="child-relation-left">
        <input type="checkbox" class="child-relation-checkbox" id="chkRelChild_${index}" ${child.enabled ? 'checked' : ''} data-index="${index}">
        <div class="child-relation-info">
          <label for="chkRelChild_${index}" class="child-relation-title" style="cursor: pointer;">${escapeHtml(child.label || child.sObject)}</label>
          <span class="child-relation-badge" title="Foreign Key Field">${escapeHtml(child.foreignKey)}</span>
        </div>
      </div>
      <div class="child-relation-right">
        <div class="child-stepper-wrap">
          <span class="child-stepper-label">per ${escapeHtml(state.selectedObject || 'parent')}:</span>
          <div class="child-stepper">
            <button type="button" class="child-stepper-btn btn-child-dec" data-index="${index}" title="Decrease count">-</button>
            <span class="child-stepper-val">${child.count}</span>
            <button type="button" class="child-stepper-btn btn-child-inc" data-index="${index}" title="Increase count">+</button>
          </div>
        </div>
        ${!child.isDefault ? `<button type="button" class="child-relation-btn-remove" data-index="${index}" title="Remove relationship">&times;</button>` : ''}
      </div>
    `;

    // Checkbox toggle
    const chk = row.querySelector('.child-relation-checkbox');
    chk.addEventListener('change', (e) => {
      child.enabled = e.target.checked;
      updateRelationalSummary();
      updateFooterSummary();
    });

    // Steppers
    const btnDec = row.querySelector('.btn-child-dec');
    btnDec.addEventListener('click', () => {
      if (child.count > 1) {
        child.count--;
        row.querySelector('.child-stepper-val').textContent = child.count;
        updateRelationalSummary();
        updateFooterSummary();
      }
    });

    const btnInc = row.querySelector('.btn-child-inc');
    btnInc.addEventListener('click', () => {
      if (child.count < 10) {
        child.count++;
        row.querySelector('.child-stepper-val').textContent = child.count;
        updateRelationalSummary();
        updateFooterSummary();
      }
    });

    // Remove button (if custom added)
    const btnRemove = row.querySelector('.child-relation-btn-remove');
    if (btnRemove) {
      btnRemove.addEventListener('click', () => {
        state.relationalConfig.children.splice(index, 1);
        renderRelationalChildrenList();
        updateRelationalSummary();
        updateFooterSummary();
      });
    }

    DOM.relationalChildrenList.appendChild(row);
  });
}

function updateRelationalSummary() {
  if (!DOM.relationalSummaryBadge) return;

  if (state.killerFeatureEnabled === false) {
    DOM.relationalSummaryBadge.textContent = 'Relational Graph Turned Off';
    DOM.relationalSummaryBadge.style.background = 'rgba(100, 116, 139, 0.12)';
    DOM.relationalSummaryBadge.style.color = 'var(--text-muted)';
    if (DOM.advanceGraphTotalSummary) {
      DOM.advanceGraphTotalSummary.textContent = 'Relational Graph is Turned Off (Toggle switch above to enable)';
    }
    return;
  }

  const activeChildren = state.relationalConfig.children.filter(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);
  const totalPerParent = activeChildren.reduce((sum, c) => sum + (parseInt(c.count, 10) || 1), 0);
  const parentCount = parseInt(
    (state.activeTab === 'tab-advance' && DOM.advanceRecordCountInput)
      ? DOM.advanceRecordCountInput.value
      : (DOM.recordCountInput ? DOM.recordCountInput.value : (DOM.advanceRecordCountInput ? DOM.advanceRecordCountInput.value : '2')),
    10
  ) || 2;
  const totalGraph = parentCount + (parentCount * totalPerParent);

  if (activeChildren.length === 0) {
    DOM.relationalSummaryBadge.textContent = '0 Children / Parent';
    DOM.relationalSummaryBadge.style.background = 'rgba(100, 116, 139, 0.12)';
    DOM.relationalSummaryBadge.style.color = 'var(--text-muted)';
  } else {
    DOM.relationalSummaryBadge.textContent = `${totalPerParent} Children / Parent (${totalPerParent * parentCount} total)`;
    DOM.relationalSummaryBadge.style.background = 'rgba(1, 118, 211, 0.1)';
    DOM.relationalSummaryBadge.style.color = 'var(--sf-blue)';
  }

  if (DOM.advanceGraphTotalSummary) {
    DOM.advanceGraphTotalSummary.textContent = `${parentCount} ${state.selectedObject || 'Records'} + ${totalPerParent * parentCount} Children (${totalGraph} Total Graph)`;
  }

  // Update Footer summary records note if relational is enabled
  if (DOM.footerRecordsSummary) {
    if (state.activeTab === 'tab-advance' && activeChildren.length > 0) {
      DOM.footerRecordsSummary.textContent = `${parentCount} ${state.selectedObject || 'Records'} + ${parentCount * totalPerParent} Children (${totalGraph} Total Graph)`;
    } else {
      DOM.footerRecordsSummary.textContent = `${parentCount} records`;
    }
  }
}

async function onExecuteGeneration() {
  if (!state.selectedObject) {
    showToast('Please select a Target SObject from the dropdown first.', 'warning');
    shakeElement(DOM.sobjectSelect);
    return;
  }

  const destination = DOM.destinationSelect.value;
  const selectedFields = Object.entries(state.fieldConfigs).filter(([_, c]) => c && c.enabled);

  if (selectedFields.length === 0) {
    showToast('No fields selected! Please check at least one field box or click "Select Required".', 'warning');
    shakeElement(DOM.btnGenerate);
    shakeElement(DOM.fieldsTable);
    return;
  }

  const count = parseInt(DOM.recordCountInput.value, 10);
  if (isNaN(count) || count < 1) {
    showToast('Please specify a valid record count (between 1 and 200).', 'warning');
    shakeElement(DOM.recordCountInput);
    return;
  }

  // Pre-fetch lookup pools if any reference fields use random org/history mode
  await prepareLookupFieldPools(state.fieldConfigs, state.objectDescribe);

  const records = GeneratorEngine.generateRecords(
    state.selectedObject,
    state.objectDescribe,
    state.fieldConfigs,
    count,
    state.selectedRecordTypeId,
    state.availableRecordTypes
  );

  const isRelational = state.activeTab === 'tab-advance' && state.relationalConfig.enabled && state.relationalConfig.children.some(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);

  if (destination === 'csv') {
    if (isRelational) {
      exportRelationalCsv(records);
    } else {
      exportToCsv(records, `${state.selectedObject}_test_data.csv`);
      showToast(`Exported ${count} records to CSV!`, 'success');
    }
    return;
  }

  if (destination === 'json') {
    if (isRelational) {
      exportRelationalJson(records);
    } else {
      exportToJson(records, `${state.selectedObject}_test_data.json`);
      showToast(`Exported ${count} records to JSON!`, 'success');
    }
    return;
  }

  // Insert to Salesforce Org
  if (isRelational) {
    await executeRelationalSalesforceInsert(records);
  } else {
    await executeSalesforceInsert(records);
  }
}

async function executeRelationalSalesforceInsert(parentRecords) {
  DOM.progressModal.style.display = 'flex';
  if (DOM.progressTitle) DOM.progressTitle.textContent = `Inserting Relational Data Graph into Salesforce...`;
  DOM.progressBarFill.style.width = '10%';
  DOM.progressBarFill.style.backgroundColor = 'var(--sf-blue)';
  DOM.progressStatusText.textContent = `Preparing relational graph for ${state.selectedObject}...`;
  DOM.resultsSummarySection.style.display = 'none';
  DOM.btnCloseProgress.style.display = 'none';
  DOM.btnDownloadBatchCsv.style.display = 'none';

  try {
    const graphResult = await state.sfService.insertRelationalGraph(
      state.selectedObject,
      parentRecords,
      state.relationalConfig.children,
      (prog) => {
        DOM.progressBarFill.style.width = `${prog.percentage}%`;
        DOM.progressStatusText.textContent = prog.message;
      }
    );

    DOM.progressBarFill.style.width = '100%';
    DOM.progressStatusText.textContent = `Completed! Created ${graphResult.successCount} of ${graphResult.totalRecords} total graph records.`;

    DOM.statSuccessCount.textContent = graphResult.successCount;
    if (graphResult.failureCount > 0) {
      DOM.statFailedBadge.style.display = 'flex';
      DOM.statFailedCount.textContent = graphResult.failureCount;
    } else {
      DOM.statFailedBadge.style.display = 'none';
    }

    // Render Hierarchical Tree in results list
    DOM.createdIdsList.innerHTML = '';
    const instanceUrl = state.sfService.instanceUrl || 'https://login.salesforce.com';

    (graphResult.createdHierarchy || []).forEach((node, parentIdx) => {
      const parentCard = document.createElement('div');
      parentCard.className = 'tree-parent-card';

      const parentLink = `${instanceUrl}/${node.parentId}`;
      const parentTitle = (node.parentRecord && (node.parentRecord.Name || node.parentRecord.LastName || node.parentRecord.Subject)) || `${state.selectedObject} #${parentIdx + 1}`;

      let childrenHtml = '';
      Object.entries(node.children || {}).forEach(([childObj, childList]) => {
        childList.forEach(childItem => {
          if (childItem.success) {
            const childLink = `${instanceUrl}/${childItem.id}`;
            const childTitle = (childItem.record && (childItem.record.LastName || childItem.record.Name || childItem.record.Subject)) || childObj;
            childrenHtml += `
              <div class="tree-child-item">
                <span><strong>${escapeHtml(childObj)}:</strong> <a href="${safeUrl(childLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(childTitle)}</a> (<code>${escapeHtml(childItem.id)}</code>)</span>
                <button type="button" class="text-link-btn btn-copy-rec-id" data-id="${escapeHtml(childItem.id)}">Copy</button>
              </div>
            `;
          } else {
            childrenHtml += `
              <div class="tree-child-item text-danger">
                <span><strong>${escapeHtml(childObj)}:</strong> ${escapeHtml(childItem.errorMessage || 'Failed')}</span>
              </div>
            `;
          }
        });
      });

      parentCard.innerHTML = `
        <div class="tree-parent-header">
          <span>🏢 <strong>${escapeHtml(state.selectedObject)}:</strong> <a href="${safeUrl(parentLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(parentTitle)}</a> (<code>${escapeHtml(node.parentId)}</code>)</span>
          <button type="button" class="text-link-btn btn-copy-rec-id" data-id="${escapeHtml(node.parentId)}">Copy</button>
        </div>
        ${childrenHtml ? `<div class="tree-children-list">${childrenHtml}</div>` : ''}
      `;

      DOM.createdIdsList.appendChild(parentCard);
    });

    // Wire up all copy buttons
    DOM.createdIdsList.querySelectorAll('.btn-copy-rec-id').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          navigator.clipboard.writeText(id);
          showToast(`Copied ${id} to clipboard`, 'info');
        }
      });
    });

    const flattenedResults = [];
    (graphResult.createdHierarchy || []).forEach(node => {
      flattenedResults.push({
        id: node.parentId,
        success: true,
        errorMessage: '',
        record: { _Type: state.selectedObject, ...node.parentRecord }
      });
      Object.entries(node.children || {}).forEach(([cObj, cList]) => {
        cList.forEach(cItem => {
          flattenedResults.push({
            id: cItem.id,
            success: cItem.success,
            errorMessage: cItem.errorMessage || '',
            record: { _Type: cObj, ...cItem.record }
          });
        });
      });
    });
    state.lastBatchResult = { results: flattenedResults };

    DOM.resultsSummarySection.style.display = 'flex';
    DOM.btnCloseProgress.style.display = 'inline-flex';
    DOM.btnDownloadBatchCsv.style.display = 'inline-flex';

    // Log Graph to History
    await StorageService.logGeneration({
      objectName: state.selectedObject,
      objectLabel: `${(state.objectDescribe && state.objectDescribe.label) || state.selectedObject} (Relational Graph)`,
      recordCount: graphResult.totalRecords,
      successCount: graphResult.successCount,
      failureCount: graphResult.failureCount,
      status: graphResult.failureCount === 0 ? 'success' : (graphResult.successCount > 0 ? 'partial' : 'failed'),
      records: parentRecords,
      createdIds: (graphResult.createdHierarchy || []).map(n => n.parentId),
      instanceUrl
    });

    if (graphResult.successCount > 0) {
      showToast(`Created full relational graph: ${graphResult.successCount} records linked!`, 'success');
    } else {
      showToast('Relational insert failed: records could not be created.', 'error');
    }
  } catch (err) {
    console.error('Relational insert error:', err);
    DOM.progressStatusText.textContent = `Error: ${err.message}`;
    DOM.progressBarFill.style.backgroundColor = 'var(--sf-red)';
    DOM.btnCloseProgress.style.display = 'inline-flex';
    showToast(`Relational insertion failed: ${err.message}`, 'error');
  }
}

function exportRelationalJson(parentRecords) {
  const tree = parentRecords.map((parentRec, idx) => {
    const parentId = `SIM_001_${idx + 1}`;
    const childrenGrouped = {};
    state.relationalConfig.children.filter(c => c.enabled && (parseInt(c.count, 10) || 0) > 0).forEach(childConf => {
      const cCount = parseInt(childConf.count, 10) || 1;
      childrenGrouped[childConf.sObject] = (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.generateChildRecordsForParent)
        ? GeneratorEngine.generateChildRecordsForParent(
            state.selectedObject,
            parentRec,
            parentId,
            childConf.sObject,
            childConf.foreignKey,
            cCount
          )
        : [];
    });
    return {
      _simulatedId: parentId,
      ...parentRec,
      _relatedRecords: childrenGrouped
    };
  });

  exportToJson(tree, `${state.selectedObject}_relational_graph.json`);
  showToast('Exported relational data graph to JSON!', 'success');
}

function exportRelationalCsv(parentRecords) {
  const allRows = [];
  parentRecords.forEach((parentRec, idx) => {
    const parentId = `SIM_001_${idx + 1}`;
    allRows.push({
      _RecordType: state.selectedObject,
      _RecordId: parentId,
      _ParentId: '',
      ...parentRec
    });

    state.relationalConfig.children.filter(c => c.enabled && (parseInt(c.count, 10) || 0) > 0).forEach(childConf => {
      const cCount = parseInt(childConf.count, 10) || 1;
      const children = (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.generateChildRecordsForParent)
        ? GeneratorEngine.generateChildRecordsForParent(
            state.selectedObject,
            parentRec,
            parentId,
            childConf.sObject,
            childConf.foreignKey,
            cCount
          )
        : [];
      children.forEach(cRec => {
        allRows.push({
          _RecordType: childConf.sObject,
          _RecordId: '',
          _ParentId: parentId,
          ...cRec
        });
      });
    });
  });

  exportToCsv(allRows, `${state.selectedObject}_relational_graph.csv`);
  showToast('Exported combined relational records to CSV!', 'success');
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
// ADVANCE (KILLER FEATURE) TAB CONTROLLER & EVENTS
// ===================================================
function syncKillerFeatureUI() {
  const isEnabled = state.killerFeatureEnabled !== false;
  state.relationalConfig.enabled = isEnabled;

  if (DOM.toggleKillerFeature) {
    DOM.toggleKillerFeature.checked = isEnabled;
  }

  if (DOM.toggleKillerFeatureLabel) {
    DOM.toggleKillerFeatureLabel.innerHTML = isEnabled
      ? 'Relational Graph: <strong>ON</strong>'
      : 'Relational Graph: <strong>OFF</strong>';
  }

  if (DOM.advanceFeatureStatusBadge) {
    if (isEnabled) {
      DOM.advanceFeatureStatusBadge.textContent = 'Active ⚡';
      DOM.advanceFeatureStatusBadge.className = 'badge-status-pill active';
    } else {
      DOM.advanceFeatureStatusBadge.textContent = 'Turned Off ⏸️';
      DOM.advanceFeatureStatusBadge.className = 'badge-status-pill inactive';
    }
  }

  if (DOM.advanceControlsWrapper) {
    DOM.advanceControlsWrapper.style.display = isEnabled ? 'flex' : 'none';
  }

  if (DOM.advanceDisabledCard) {
    DOM.advanceDisabledCard.style.display = isEnabled ? 'none' : 'flex';
  }

  if (DOM.relationalCard) {
    DOM.relationalCard.classList.toggle('active', isEnabled);
  }

  updateRelationalSummary();
}

function bindAdvanceEvents() {
  // Master Relational Graph Switch
  if (DOM.toggleKillerFeature) {
    DOM.toggleKillerFeature.addEventListener('change', async (e) => {
      const isEnabled = e.target.checked;
      state.killerFeatureEnabled = isEnabled;
      syncKillerFeatureUI();
      await StorageService.set('sf_dataforge_killer_feature_enabled', isEnabled);
      if (isEnabled) {
        showToast('Relational Graph Generation is now ON!', 'success');
      } else {
        showToast('Relational Graph Generation turned OFF.', 'info');
      }
    });
  }

  // Turn On Relational Generator Button (in disabled placeholder card)
  if (DOM.btnEnableKillerFeature) {
    DOM.btnEnableKillerFeature.addEventListener('click', async () => {
      state.killerFeatureEnabled = true;
      syncKillerFeatureUI();
      await StorageService.set('sf_dataforge_killer_feature_enabled', true);
      showToast('Relational Graph Generation is now ON!', 'success');
    });
  }

  if (DOM.btnGoToAdvance) {
    DOM.btnGoToAdvance.addEventListener('click', () => {
      switchTab('tab-advance');
    });
  }

  if (DOM.advanceSObjectSelect) {
    DOM.advanceSObjectSelect.addEventListener('change', (e) => {
      DOM.sobjectSelect.value = e.target.value;
      onSelectSObject(e.target.value);
    });
  }

  if (DOM.advanceRecordTypeSelect) {
    DOM.advanceRecordTypeSelect.addEventListener('change', (e) => {
      state.selectedRecordTypeId = e.target.value;
      if (DOM.recordTypeSelect) DOM.recordTypeSelect.value = state.selectedRecordTypeId;
      if (DOM.advanceRecordTypeBadge) {
        if (!state.selectedRecordTypeId) {
          DOM.advanceRecordTypeBadge.textContent = state.availableRecordTypes.length > 0 ? `${state.availableRecordTypes.length} Types` : 'Default';
        } else if (state.selectedRecordTypeId === '__RANDOM__') {
          DOM.advanceRecordTypeBadge.textContent = '🎲 Mixed';
        } else {
          const match = state.availableRecordTypes.find(rt => rt.id === state.selectedRecordTypeId);
          DOM.advanceRecordTypeBadge.textContent = match ? match.name : 'Selected';
        }
      }
      if (DOM.recordTypeBadge) {
        DOM.recordTypeBadge.textContent = DOM.advanceRecordTypeBadge ? DOM.advanceRecordTypeBadge.textContent : 'Selected';
      }
      if (state.fieldConfigs['RecordTypeId']) {
        state.fieldConfigs['RecordTypeId'].enabled = true;
        state.fieldConfigs['RecordTypeId'].mode = GeneratorEngine.MODES.PICKLIST;
        state.fieldConfigs['RecordTypeId'].picklistValue = state.selectedRecordTypeId;
        renderFieldsTable();
      }
    });
  }

  if (DOM.btnAdvanceCountDec) {
    DOM.btnAdvanceCountDec.addEventListener('click', () => {
      let val = parseInt(DOM.advanceRecordCountInput.value, 10) || 1;
      if (val > 1) {
        DOM.advanceRecordCountInput.value = val - 1;
        updateRelationalSummary();
      }
    });
  }

  if (DOM.btnAdvanceCountInc) {
    DOM.btnAdvanceCountInc.addEventListener('click', () => {
      let val = parseInt(DOM.advanceRecordCountInput.value, 10) || 1;
      if (val < 50) {
        DOM.advanceRecordCountInput.value = val + 1;
        updateRelationalSummary();
      }
    });
  }

  if (DOM.advanceRecordCountInput) {
    DOM.advanceRecordCountInput.addEventListener('input', () => {
      let val = parseInt(DOM.advanceRecordCountInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 50) val = 50;
      DOM.advanceRecordCountInput.value = val;
      updateRelationalSummary();
    });
  }

  if (DOM.advanceDestinationSelect) {
    DOM.advanceDestinationSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (DOM.btnAdvanceGenerateText) {
        if (val === 'salesforce') {
          DOM.btnAdvanceGenerateText.textContent = 'Generate & Insert Graph';
        } else if (val === 'csv') {
          DOM.btnAdvanceGenerateText.textContent = 'Generate & Export CSV';
        } else {
          DOM.btnAdvanceGenerateText.textContent = 'Generate & Export JSON';
        }
      }
    });
  }

  if (DOM.btnAdvancePreview) {
    DOM.btnAdvancePreview.addEventListener('click', () => {
      onOpenAdvancePreview();
    });
  }

  if (DOM.btnAdvanceGenerate) {
    DOM.btnAdvanceGenerate.addEventListener('click', () => {
      onExecuteAdvanceGeneration();
    });
  }
}

async function onOpenAdvancePreview() {
  if (state.killerFeatureEnabled === false) {
    showToast('Relational Generation is currently turned off. Turn it on using the toggle switch to preview relational graphs.', 'warning');
    if (DOM.toggleKillerFeature) shakeElement(DOM.toggleKillerFeature);
    return;
  }

  state.relationalConfig.enabled = true;
  if (!state.selectedObject || !state.objectDescribe) {
    showToast('Please select a Parent SObject first.', 'warning');
    if (DOM.advanceSObjectSelect) shakeElement(DOM.advanceSObjectSelect);
    return;
  }

  const count = parseInt(DOM.advanceRecordCountInput ? DOM.advanceRecordCountInput.value : '2', 10);
  if (isNaN(count) || count < 1) {
    showToast('Please specify a valid parent count (between 1 and 50).', 'warning');
    if (DOM.advanceRecordCountInput) shakeElement(DOM.advanceRecordCountInput);
    return;
  }

  // Ensure activeFieldConfigs has at least required fields enabled
  let activeFieldConfigs = state.fieldConfigs;
  const hasActiveFields = Object.values(activeFieldConfigs || {}).some(c => c && c.enabled);
  if (!hasActiveFields && state.objectDescribe && state.objectDescribe.fields) {
    activeFieldConfigs = {};
    for (const f of state.objectDescribe.fields) {
      if (f.createable && (f.required || f.name === 'Name' || f.name === 'LastName' || f.name === 'Subject')) {
        activeFieldConfigs[f.name] = {
          enabled: true,
          mode: f.type === 'picklist' ? GeneratorEngine.MODES.PICKLIST : GeneratorEngine.MODES.REALISTIC,
          pattern: getDefaultPattern(f),
          picklistValue: '__RANDOM__'
        };
      }
    }
  }

  await prepareLookupFieldPools(activeFieldConfigs, state.objectDescribe);

  const records = GeneratorEngine.generateRecords(
    state.selectedObject,
    state.objectDescribe,
    activeFieldConfigs,
    count,
    state.selectedRecordTypeId,
    state.availableRecordTypes
  );

  state.generatedPreviewRecords = records;
  const parentPrefix = (state.objectDescribe && state.objectDescribe.keyPrefix) || '001';
  state.generatedPreviewChildren = [];

  records.forEach((parentRec, idx) => {
    const simulatedParentId = `${parentPrefix}PREV00000${idx + 1}`.slice(-18).padStart(18, '0');
    parentRec._previewId = simulatedParentId;

    const activeChildren = state.relationalConfig.children.filter(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);
    activeChildren.forEach(childConf => {
      const cCount = parseInt(childConf.count, 10) || 1;
      const childRecords = (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.generateChildRecordsForParent)
        ? GeneratorEngine.generateChildRecordsForParent(
            state.selectedObject,
            parentRec,
            simulatedParentId,
            childConf.sObject,
            childConf.foreignKey,
            cCount
          )
        : [];

      childRecords.forEach(cr => {
        state.generatedPreviewChildren.push({
          childSObject: childConf.sObject,
          parentName: parentRec.Name || parentRec.LastName || parentRec.Subject || `${state.selectedObject} #${idx + 1}`,
          parentId: simulatedParentId,
          record: cr
        });
      });
    });
  });

  if (DOM.previewTabs) {
    DOM.previewTabs.style.display = 'flex';
    if (DOM.previewParentCount) DOM.previewParentCount.textContent = records.length;
    if (DOM.previewChildrenCount) DOM.previewChildrenCount.textContent = state.generatedPreviewChildren.length;
    if (DOM.tabPreviewParent) DOM.tabPreviewParent.classList.add('active');
    if (DOM.tabPreviewChildren) DOM.tabPreviewChildren.classList.remove('active');
  }

  if (DOM.previewTableWrapper) DOM.previewTableWrapper.style.display = 'block';
  if (DOM.previewChildrenWrapper) DOM.previewChildrenWrapper.style.display = 'none';

  renderPreviewTable(records);
  renderChildrenPreviewTable(state.generatedPreviewChildren);
  if (DOM.previewSubtitle) {
    DOM.previewSubtitle.textContent = `Previewing Relational Graph: ${records.length} ${state.selectedObject} + ${state.generatedPreviewChildren.length} Linked Children`;
  }
  DOM.previewModal.style.display = 'flex';
}

async function onExecuteAdvanceGeneration() {
  if (!state.selectedObject || !state.objectDescribe) {
    showToast('Please select a Parent SObject first.', 'warning');
    if (DOM.advanceSObjectSelect) shakeElement(DOM.advanceSObjectSelect);
    return;
  }

  const destination = DOM.advanceDestinationSelect ? DOM.advanceDestinationSelect.value : 'salesforce';

  if (destination === 'salesforce') {
    const isRestricted = state.connection && state.connection.status === 'restricted';
    const isOffline = !state.connection || state.connection.status === 'offline';
    if (isRestricted || isOffline) {
      showSessionAlert(state.connection ? state.connection.message : 'Salesforce connection required.');
      showToast('Salesforce session restricted or offline. Please reconnect or switch to Demo Mode.', 'warning');
      return;
    }
  }

  const count = parseInt(DOM.advanceRecordCountInput ? DOM.advanceRecordCountInput.value : '2', 10);
  if (isNaN(count) || count < 1) {
    showToast('Please specify a valid parent count (between 1 and 50).', 'warning');
    if (DOM.advanceRecordCountInput) shakeElement(DOM.advanceRecordCountInput);
    return;
  }

  if (state.killerFeatureEnabled === false) {
    showToast('Relational Generation is currently turned off. Turn it on using the toggle switch to generate relational records.', 'warning');
    if (DOM.toggleKillerFeature) shakeElement(DOM.toggleKillerFeature);
    return;
  }

  state.relationalConfig.enabled = true;

  // Ensure activeFieldConfigs has at least required fields enabled
  let activeFieldConfigs = state.fieldConfigs;
  const hasActiveFields = Object.values(activeFieldConfigs || {}).some(c => c && c.enabled);
  if (!hasActiveFields && state.objectDescribe && state.objectDescribe.fields) {
    activeFieldConfigs = {};
    for (const f of state.objectDescribe.fields) {
      if (f.createable && (f.required || f.name === 'Name' || f.name === 'LastName' || f.name === 'Subject')) {
        activeFieldConfigs[f.name] = {
          enabled: true,
          mode: f.type === 'picklist' ? GeneratorEngine.MODES.PICKLIST : GeneratorEngine.MODES.REALISTIC,
          pattern: getDefaultPattern(f),
          picklistValue: '__RANDOM__'
        };
      }
    }
  }

  await prepareLookupFieldPools(activeFieldConfigs, state.objectDescribe);

  const records = GeneratorEngine.generateRecords(
    state.selectedObject,
    state.objectDescribe,
    activeFieldConfigs,
    count,
    state.selectedRecordTypeId,
    state.availableRecordTypes
  );

  if (destination === 'csv') {
    exportRelationalCsv(records);
    return;
  }

  if (destination === 'json') {
    exportRelationalJson(records);
    return;
  }

  await executeRelationalSalesforceInsert(records);
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
    if (!state.generatedPreviewRecords || state.generatedPreviewRecords.length === 0) {
      showToast('No preview records available to insert into Salesforce!', 'warning');
      shakeElement(DOM.btnConfirmInsert);
      return;
    }
    DOM.previewModal.style.display = 'none';
    const isRelational = state.relationalConfig.enabled && state.relationalConfig.children.some(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);
    if (isRelational) {
      await executeRelationalSalesforceInsert(state.generatedPreviewRecords);
    } else {
      await executeSalesforceInsert(state.generatedPreviewRecords);
    }
  });

  DOM.btnExportPreviewCsv.addEventListener('click', () => {
    if (!state.generatedPreviewRecords || state.generatedPreviewRecords.length === 0) {
      showToast('No preview records available to export.', 'warning');
      shakeElement(DOM.btnExportPreviewCsv);
      return;
    }
    const isRelational = state.relationalConfig.enabled && state.relationalConfig.children.some(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);
    if (isRelational) {
      exportRelationalCsv(state.generatedPreviewRecords);
    } else {
      exportToCsv(state.generatedPreviewRecords, `${state.selectedObject}_preview.csv`);
      showToast('Exported preview records to CSV!', 'success');
    }
  });

  DOM.btnExportPreviewJson.addEventListener('click', () => {
    if (!state.generatedPreviewRecords || state.generatedPreviewRecords.length === 0) {
      showToast('No preview records available to export.', 'warning');
      shakeElement(DOM.btnExportPreviewJson);
      return;
    }
    const isRelational = state.relationalConfig.enabled && state.relationalConfig.children.some(c => c.enabled && (parseInt(c.count, 10) || 0) > 0);
    if (isRelational) {
      exportRelationalJson(state.generatedPreviewRecords);
    } else {
      exportToJson(state.generatedPreviewRecords, `${state.selectedObject}_preview.json`);
      showToast('Exported preview records to JSON!', 'success');
    }
  });

  // Save Template Modal
  DOM.btnOpenSaveTemplateModal.addEventListener('click', () => {
    if (!state.selectedObject) {
      showToast('Please select a Target SObject before saving a preset template.', 'warning');
      shakeElement(DOM.sobjectSelect);
      return;
    }
    const selectedCount = Object.values(state.fieldConfigs).filter(c => c && c.enabled).length;
    if (selectedCount === 0) {
      showToast('No fields selected! Please select and configure at least one field to save as a preset.', 'warning');
      shakeElement(DOM.btnOpenSaveTemplateModal);
      return;
    }
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
    const name = DOM.templateNameInput.value.trim();
    if (!name) {
      showToast('Please enter a name for your preset template.', 'warning');
      shakeElement(DOM.templateNameInput);
      return;
    }
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
      shakeElement(DOM.quickInstanceUrl);
      return;
    }
    if (!isSalesforceUrl(instanceUrl)) {
      showToast('Invalid domain: Please enter a valid Salesforce URL (e.g. https://your-domain.my.salesforce.com).', 'error');
      shakeElement(DOM.quickInstanceUrl);
      return;
    }
    if (!token) {
      showToast('Please enter your Session ID or Access Token.', 'warning');
      shakeElement(DOM.quickSessionToken);
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

  // Lookup Modal Events
  if (DOM.btnCloseLookupModal) {
    DOM.btnCloseLookupModal.addEventListener('click', () => {
      DOM.lookupRecordsModal.style.display = 'none';
    });
  }

  if (DOM.btnCloseLookupModalBottom) {
    DOM.btnCloseLookupModalBottom.addEventListener('click', () => {
      DOM.lookupRecordsModal.style.display = 'none';
    });
  }

  if (DOM.lookupSearchInput) {
    DOM.lookupSearchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (DOM.btnClearLookupSearch) {
        DOM.btnClearLookupSearch.style.display = val ? 'inline-block' : 'none';
      }
      clearTimeout(lookupSearchDebounceTimer);
      lookupSearchDebounceTimer = setTimeout(() => {
        loadLookupRecords(currentLookupTargetObj, val);
      }, 300);
    });
  }

  if (DOM.btnClearLookupSearch) {
    DOM.btnClearLookupSearch.addEventListener('click', () => {
      DOM.lookupSearchInput.value = '';
      DOM.btnClearLookupSearch.style.display = 'none';
      loadLookupRecords(currentLookupTargetObj, '');
    });
  }

  if (DOM.btnRefreshLookupSearch) {
    DOM.btnRefreshLookupSearch.addEventListener('click', () => {
      loadLookupRecords(currentLookupTargetObj, DOM.lookupSearchInput ? DOM.lookupSearchInput.value : '');
    });
  }

  if (DOM.lookupTargetSelect) {
    DOM.lookupTargetSelect.addEventListener('change', (e) => {
      currentLookupTargetObj = e.target.value;
      if (DOM.lookupModalTitle) DOM.lookupModalTitle.textContent = `Select ${currentLookupTargetObj} Record`;
      if (DOM.lookupModalSubtitle && currentLookupField) {
        DOM.lookupModalSubtitle.textContent = `Field: ${currentLookupField.label || currentLookupField.name} • Target SObject: ${currentLookupTargetObj}`;
      }
      loadLookupRecords(currentLookupTargetObj, DOM.lookupSearchInput ? DOM.lookupSearchInput.value : '');
    });
  }

  if (DOM.btnLookupStrategyOrg) {
    DOM.btnLookupStrategyOrg.addEventListener('click', () => {
      if (currentLookupConfig) {
        currentLookupConfig.referenceId = '__RANDOM_ORG__';
        currentLookupConfig.referenceName = `Random from Org`;
        currentLookupConfig.referenceMode = 'random_org';
        updateLookupFieldRowUI(currentLookupField, currentLookupConfig, currentLookupTriggerBtn);
      }
      DOM.lookupRecordsModal.style.display = 'none';
      showToast(`Set ${currentLookupField ? currentLookupField.label : 'field'} to Random from Org!`, 'success');
    });
  }

  if (DOM.btnLookupStrategyHistory) {
    DOM.btnLookupStrategyHistory.addEventListener('click', () => {
      if (currentLookupConfig) {
        currentLookupConfig.referenceId = '__RANDOM_HISTORY__';
        currentLookupConfig.referenceName = `Random from History`;
        currentLookupConfig.referenceMode = 'random_history';
        updateLookupFieldRowUI(currentLookupField, currentLookupConfig, currentLookupTriggerBtn);
      }
      DOM.lookupRecordsModal.style.display = 'none';
      showToast(`Set ${currentLookupField ? currentLookupField.label : 'field'} to Random from Tool History!`, 'success');
    });
  }

  if (DOM.btnLookupStrategyNone) {
    DOM.btnLookupStrategyNone.addEventListener('click', () => {
      if (currentLookupConfig) {
        currentLookupConfig.referenceId = '';
        currentLookupConfig.referenceName = '';
        currentLookupConfig.referenceMode = 'none';
        updateLookupFieldRowUI(currentLookupField, currentLookupConfig, currentLookupTriggerBtn);
      }
      DOM.lookupRecordsModal.style.display = 'none';
      showToast(`Cleared lookup value for ${currentLookupField ? currentLookupField.label : 'field'}.`, 'info');
    });
  }

  if (DOM.btnApplyManualId && DOM.lookupManualIdInput) {
    DOM.btnApplyManualId.addEventListener('click', () => {
      const val = (DOM.lookupManualIdInput.value || '').trim();
      if (!val || !/^[a-zA-Z0-9]{15,18}$/.test(val)) {
        showToast('Please enter a valid 15 or 18-character Salesforce ID.', 'warning');
        shakeElement(DOM.lookupManualIdInput);
        return;
      }
      if (currentLookupConfig) {
        currentLookupConfig.referenceId = val;
        currentLookupConfig.referenceName = val;
        currentLookupConfig.referenceMode = 'specific';
        updateLookupFieldRowUI(currentLookupField, currentLookupConfig, currentLookupTriggerBtn);
      }
      DOM.lookupRecordsModal.style.display = 'none';
      showToast(`Applied manual ID ${val} for ${currentLookupField ? currentLookupField.label : 'field'}!`, 'success');
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
        if (currentPicklistField && currentPicklistField.name === 'RecordTypeId') {
          state.selectedRecordTypeId = pv.value;
          if (DOM.recordTypeSelect) DOM.recordTypeSelect.value = pv.value;
          if (DOM.recordTypeBadge) DOM.recordTypeBadge.textContent = pv.label || 'Selected';
        }
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
// LOOKUP / REFERENCE MODAL CONTROLLER
// ===================================================
let currentLookupField = null;
let currentLookupConfig = null;
let currentLookupTargetObj = '';
let currentLookupTriggerBtn = null;
let lookupSearchDebounceTimer = null;

async function openLookupModal(field, config, triggerButton) {
  currentLookupField = field;
  currentLookupConfig = config;
  currentLookupTriggerBtn = triggerButton;

  const targetObjects = (field.referenceTo && field.referenceTo.length > 0) ? field.referenceTo : ['Account'];
  currentLookupTargetObj = targetObjects[0] || 'Account';

  if (DOM.lookupModalTitle) {
    DOM.lookupModalTitle.textContent = `Select ${currentLookupTargetObj} Record`;
  }
  if (DOM.lookupModalSubtitle) {
    DOM.lookupModalSubtitle.textContent = `Field: ${field.label || field.name} (${field.name}) • Target SObject: ${currentLookupTargetObj}`;
  }

  // Handle polymorphic targets (e.g. WhatId -> Account, Opportunity, etc.)
  if (DOM.lookupTargetSwitch && DOM.lookupTargetSelect) {
    if (targetObjects.length > 1) {
      DOM.lookupTargetSelect.innerHTML = '';
      targetObjects.forEach(tObj => {
        const opt = document.createElement('option');
        opt.value = tObj;
        opt.textContent = tObj;
        DOM.lookupTargetSelect.appendChild(opt);
      });
      DOM.lookupTargetSelect.value = currentLookupTargetObj;
      DOM.lookupTargetSwitch.style.display = 'block';
    } else {
      DOM.lookupTargetSwitch.style.display = 'none';
    }
  }

  // Check history pool count
  if (DOM.lookupHistoryCount) {
    try {
      const histIds = await StorageService.getCreatedIdsForObject(currentLookupTargetObj);
      DOM.lookupHistoryCount.textContent = histIds.length;
      if (DOM.btnLookupStrategyHistory) {
        DOM.btnLookupStrategyHistory.disabled = histIds.length === 0;
        DOM.btnLookupStrategyHistory.style.opacity = histIds.length === 0 ? '0.5' : '1';
      }
    } catch (e) {
      DOM.lookupHistoryCount.textContent = '0';
    }
  }

  // Update strategy button active states
  if (DOM.btnLookupStrategyOrg) {
    DOM.btnLookupStrategyOrg.classList.toggle('active', config.referenceMode === 'random_org' || config.referenceId === '__RANDOM_ORG__');
  }
  if (DOM.btnLookupStrategyHistory) {
    DOM.btnLookupStrategyHistory.classList.toggle('active', config.referenceMode === 'random_history' || config.referenceId === '__RANDOM_HISTORY__');
  }
  if (DOM.btnLookupStrategyNone) {
    DOM.btnLookupStrategyNone.classList.toggle('active', config.referenceMode === 'none' || !config.referenceId);
  }

  // Manual ID input
  if (DOM.lookupManualIdInput) {
    DOM.lookupManualIdInput.value = (config.referenceMode === 'specific' && config.referenceId && !config.referenceId.startsWith('__')) ? config.referenceId : '';
  }

  if (DOM.lookupSearchInput) {
    DOM.lookupSearchInput.value = '';
  }
  if (DOM.btnClearLookupSearch) {
    DOM.btnClearLookupSearch.style.display = 'none';
  }

  if (DOM.lookupRecordsModal) {
    DOM.lookupRecordsModal.style.display = 'flex';
  }

  await loadLookupRecords(currentLookupTargetObj, '');
}

async function loadLookupRecords(sObjectName, searchTerm = '') {
  if (!DOM.lookupResultsTableBody) return;

  if (DOM.lookupLoading) DOM.lookupLoading.style.display = 'flex';
  if (DOM.lookupResultsContainer) DOM.lookupResultsContainer.style.display = 'none';
  if (DOM.lookupEmptyState) DOM.lookupEmptyState.style.display = 'none';

  try {
    const res = await state.sfService.searchLookupRecords(sObjectName, searchTerm, 25);
    if (DOM.lookupLoading) DOM.lookupLoading.style.display = 'none';

    if (!res.records || res.records.length === 0) {
      if (DOM.lookupEmptyMessage) {
        DOM.lookupEmptyMessage.textContent = searchTerm
          ? `No ${sObjectName} records matching "${searchTerm}".`
          : `No ${sObjectName} records found in your Salesforce org.`;
      }
      if (DOM.lookupEmptyState) DOM.lookupEmptyState.style.display = 'block';
      if (DOM.lookupResultsContainer) DOM.lookupResultsContainer.style.display = 'none';
    } else {
      renderLookupModalTable(res.records, currentLookupConfig ? currentLookupConfig.referenceId : '');
      if (DOM.lookupResultsContainer) DOM.lookupResultsContainer.style.display = 'block';
    }
  } catch (err) {
    console.error('loadLookupRecords error:', err);
    if (DOM.lookupLoading) DOM.lookupLoading.style.display = 'none';
    if (DOM.lookupEmptyMessage) {
      DOM.lookupEmptyMessage.textContent = `Error querying ${sObjectName} records: ${err.message}`;
    }
    if (DOM.lookupEmptyState) DOM.lookupEmptyState.style.display = 'block';
    if (DOM.lookupResultsContainer) DOM.lookupResultsContainer.style.display = 'none';
  }
}

function renderLookupModalTable(records, selectedId) {
  if (!DOM.lookupResultsTableBody) return;
  DOM.lookupResultsTableBody.innerHTML = '';

  records.forEach((rec, idx) => {
    const isSelected = selectedId === rec.id;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${idx + 1}</strong></td>
      <td><strong>${escapeHtml(rec.name || rec.id)}</strong></td>
      <td>
        <span class="lookup-rec-code">${escapeHtml(rec.id)}</span>
        <button type="button" class="text-link-btn btn-copy-lookup-id" data-id="${escapeHtml(rec.id)}" style="margin-left: 6px;">Copy</button>
      </td>
      <td><span class="text-muted text-xs">${escapeHtml(rec.createdDate || '-')}</span></td>
      <td style="text-align: right;">
        <button type="button" class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-select-lookup-rec">
          ${isSelected ? 'Selected ✓' : 'Select'}
        </button>
      </td>
    `;

    // Copy ID button
    tr.querySelector('.btn-copy-lookup-id').addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(rec.id);
      showToast(`Copied ${rec.id} to clipboard`, 'info');
    });

    // Select button
    tr.querySelector('.btn-select-lookup-rec').addEventListener('click', () => {
      if (currentLookupConfig) {
        currentLookupConfig.referenceId = rec.id;
        currentLookupConfig.referenceName = rec.name;
        currentLookupConfig.referenceMode = 'specific';
        updateLookupFieldRowUI(currentLookupField, currentLookupConfig, currentLookupTriggerBtn);
      }
      if (DOM.lookupRecordsModal) DOM.lookupRecordsModal.style.display = 'none';
      showToast(`Selected "${rec.name}" (${rec.id}) for ${currentLookupField ? currentLookupField.label : 'field'}`, 'success');
    });

    DOM.lookupResultsTableBody.appendChild(tr);
  });
}

function updateLookupFieldRowUI(field, config, triggerBtn) {
  if (!triggerBtn) return;
  const targetObj = (field.referenceTo && field.referenceTo[0]) || 'Record';

  if (config.referenceMode === 'random_org' || config.referenceId === '__RANDOM_ORG__') {
    triggerBtn.innerHTML = `🎲 Random from Org (${escapeHtml(targetObj)})`;
    triggerBtn.className = 'lookup-select-btn is-random';
    triggerBtn.title = `Randomly selects from ${targetObj} records in your Salesforce org`;
  } else if (config.referenceMode === 'random_history' || config.referenceId === '__RANDOM_HISTORY__') {
    triggerBtn.innerHTML = `📦 Random from History (${escapeHtml(targetObj)})`;
    triggerBtn.className = 'lookup-select-btn is-random';
    triggerBtn.title = `Randomly selects from ${targetObj} records previously generated by SF DataForge`;
  } else if (config.referenceMode === 'specific' && config.referenceId && !config.referenceId.startsWith('__')) {
    triggerBtn.innerHTML = `🏢 ${escapeHtml(config.referenceName || config.referenceId)}`;
    triggerBtn.className = 'lookup-select-btn is-selected';
    triggerBtn.title = `Record ID: ${config.referenceId} (Click to change)`;
  } else {
    triggerBtn.innerHTML = `🔍 Lookup ${escapeHtml(targetObj)}...`;
    triggerBtn.className = 'lookup-select-btn';
    triggerBtn.title = `Search or choose random ${targetObj} record`;
  }

  // Toggle clear button
  const rowMain = triggerBtn.closest('.lookup-row-main');
  if (rowMain) {
    const btnClear = rowMain.querySelector('.lookup-btn-clear');
    if (btnClear) {
      btnClear.style.display = (config.referenceId && config.referenceId !== '__NONE__') ? 'inline-block' : 'none';
    }
  }

  // Toggle pills active state
  const group = triggerBtn.closest('.lookup-field-group');
  if (group) {
    const pillOrg = group.querySelector('.lookup-pill-org');
    if (pillOrg) {
      pillOrg.classList.toggle('active', config.referenceMode === 'random_org' || config.referenceId === '__RANDOM_ORG__');
    }
  }
}

async function prepareLookupFieldPools(fieldConfigs, objectDescribe) {
  if (!fieldConfigs || !objectDescribe || !objectDescribe.fields) return;
  const fieldMap = new Map(objectDescribe.fields.map(f => [f.name, f]));

  for (const [fieldName, config] of Object.entries(fieldConfigs)) {
    if (!config || !config.enabled) continue;
    const meta = fieldMap.get(fieldName);
    if (!meta || meta.type !== 'reference') continue;

    const targetObj = (meta.referenceTo && meta.referenceTo[0]) || 'Account';

    // 1. Fetch Random from Org pool
    if (config.referenceMode === 'random_org' || config.referenceId === '__RANDOM_ORG__') {
      try {
        const pool = await state.sfService.getRandomLookupIds(targetObj, 50);
        config.orgRecordPool = pool;
      } catch (e) {
        console.warn(`Failed to fetch random lookup pool for ${fieldName} (${targetObj}):`, e);
      }
    }

    // 2. Fetch Random from History pool
    if (config.referenceMode === 'random_history' || config.referenceId === '__RANDOM_HISTORY__') {
      try {
        const histIds = await StorageService.getCreatedIdsForObject(targetObj);
        config.historyRecordPool = histIds;
      } catch (e) {
        console.warn(`Failed to fetch history pool for ${fieldName}:`, e);
      }
    }
  }
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
      const manualToken = DOM.settingSessionId.value.trim();
      if (!manualUrl) {
        showToast('Please provide your Salesforce Instance URL.', 'warning');
        shakeElement(DOM.settingInstanceUrl);
        return;
      }
      if (!isSalesforceUrl(manualUrl)) {
        showToast('Invalid domain: Please enter a valid Salesforce URL (e.g. https://your-domain.my.salesforce.com).', 'error');
        shakeElement(DOM.settingInstanceUrl);
        return;
      }
      if (!manualToken) {
        showToast('Please provide your Salesforce Access Token / Session ID.', 'warning');
        shakeElement(DOM.settingSessionId);
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

function shakeElement(el) {
  if (!el) return;
  el.classList.remove('shake-animate');
  void el.offsetWidth;
  el.classList.add('shake-animate');
  setTimeout(() => {
    try { el.classList.remove('shake-animate'); } catch (e) {}
  }, 500);
}

function showToast(message, type = 'info') {
  if (!DOM.toastContainer) {
    DOM.toastContainer = document.getElementById('toastContainer');
  }
  if (!DOM.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  if (type === 'success') iconSpan.textContent = '✅';
  else if (type === 'warning') iconSpan.textContent = '⚠️';
  else if (type === 'error') iconSpan.textContent = '❌';
  else iconSpan.textContent = 'ℹ️';

  const textSpan = document.createElement('span');
  textSpan.className = 'toast-text';
  textSpan.textContent = message.replace(/^[⚠️✅❌ℹ️]\s*/, '');

  toast.appendChild(iconSpan);
  toast.appendChild(textSpan);
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      try { toast.remove(); } catch (e) {}
    }, 260);
  }, 3800);
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
  if (!state.deleterSObject) {
    showToast('Please select a Target SObject to clean first.', 'warning');
    shakeElement(DOM.deleterSObjectSelect);
    return;
  }

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
    DOM.btnExecuteDeleteSelected.disabled = false;
    DOM.btnExecuteDeleteSelected.classList.toggle('btn-unselected', count === 0);
  }

  if (DOM.btnDeleteSelectedText) {
    DOM.btnDeleteSelectedText.textContent = count > 0 ? `Delete Selected Records (${count})` : 'Delete Selected Records (0)';
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
    showToast('No records selected! Please check the boxes beside the records you wish to delete.', 'warning');
    shakeElement(DOM.btnExecuteDeleteSelected);
    shakeElement(DOM.deleterTable);
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
      if (!state.deleterSObject) {
        showToast('Please select a Target SObject to clean first.', 'warning');
        shakeElement(DOM.deleterSObjectSelect);
        return;
      }
      if (!state.deleterRecords || state.deleterRecords.length === 0) {
        showToast('No records loaded! Click "Query" to fetch records from Salesforce first.', 'warning');
        shakeElement(DOM.btnRefreshDeleterRecords);
        return;
      }
      if (state.deleterSelectedIds.size === 0) {
        showToast('No records selected! Please check the boxes beside the records you wish to delete.', 'warning');
        shakeElement(DOM.btnExecuteDeleteSelected);
        shakeElement(DOM.deleterTable);
        return;
      }
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

