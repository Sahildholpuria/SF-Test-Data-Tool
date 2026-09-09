/**
 * SF DataForge - Salesforce Service
 * Handles Active Session Discovery, SObject Metadata Describe, and REST API Insertion
 */

class SalesforceService {
  constructor() {
    this.instanceUrl = '';
    this.sessionId = '';
    this.apiVersion = 'v60.0';
    this.isMockMode = false;
    this.orgInfo = null;
  }

  /**
   * Initializes connection from stored settings, active tab, or falls back to mock mode
   */
  async initConnection() {
    // 1. Check if user configured manual settings or mock mode in Storage
    if (typeof StorageService !== 'undefined') {
      const settings = await StorageService.getSettings();
      if (settings.apiVersion) this.apiVersion = settings.apiVersion;
      
      if (settings.useMockMode) {
        this.enableMockMode();
        return { connected: true, isMock: true, orgName: 'Demo Salesforce Sandbox (Offline)' };
      }

      if (settings.instanceUrl && settings.manualSessionId) {
        this.instanceUrl = settings.instanceUrl.replace(/\/$/, '');
        this.sessionId = settings.manualSessionId;
        this.isMockMode = false;
        const testResult = await this.testConnection();
        if (testResult.success) {
          return {
            connected: true,
            isMock: false,
            orgName: this.instanceUrl.replace(/^https?:\/\//, ''),
            instanceUrl: this.instanceUrl
          };
        } else {
          return {
            connected: false,
            sessionExpired: true,
            reason: `Manual Session Token Invalid: ${testResult.error}`,
            instanceUrl: this.instanceUrl
          };
        }
      }
    }

    // 2. Try detecting verified active session from active Chrome tab
    const autoSession = await this.detectActiveTabSession();

    if (autoSession && autoSession.valid && autoSession.sessionId) {
      this.instanceUrl = autoSession.instanceUrl.replace(/\/$/, '');
      this.sessionId = autoSession.sessionId;
      this.isMockMode = false;
      return {
        connected: true,
        isMock: false,
        orgName: autoSession.tabTitle || this.instanceUrl.replace(/^https?:\/\//, ''),
        instanceUrl: this.instanceUrl
      };
    }

    // 3. If session was found but expired / restricted by IP lock
    if (autoSession && autoSession.sessionExpired) {
      this.instanceUrl = (autoSession.instanceUrl || '').replace(/\/$/, '');
      return {
        connected: false,
        sessionExpired: true,
        instanceUrl: this.instanceUrl,
        reason: autoSession.reason || 'Session expired or blocked by Salesforce IP restrictions.'
      };
    }

    // 4. If current tab is not on Salesforce (Strict Salesforce-Only guard)
    if (autoSession && autoSession.notOnSalesforce) {
      return {
        connected: false,
        notOnSalesforce: true,
        currentTabUrl: autoSession.currentTabUrl,
        currentTabTitle: autoSession.currentTabTitle,
        hasOtherSfTab: autoSession.hasOtherSfTab,
        otherSfTab: autoSession.otherSfTab,
        reason: autoSession.reason || 'Active browser tab is not a Salesforce org.'
      };
    }

    // 5. If no Salesforce session was discovered
    return {
      connected: false,
      notOnSalesforce: true,
      reason: (autoSession && autoSession.reason) || 'No active Salesforce tab detected.'
    };
  }

  enableMockMode() {
    this.isMockMode = true;
    this.instanceUrl = 'https://demo-salesforce.my.salesforce.com';
    this.sessionId = 'mock_session_token_12345';
    this.orgInfo = {
      orgName: 'Demo Developer Org',
      username: 'admin@demo-sandbox.salesforce.test',
      orgId: '00D00000000DEMO'
    };
  }

  /**
   * Detect session from background worker
   */
  async detectActiveTabSession() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      return null;
    }
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'GET_ACTIVE_SF_SESSION' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Runtime message error:', chrome.runtime.lastError);
          return resolve(null);
        }
        resolve(response);
      });
    });
  }

  /**
   * Test REST API connection & verify authentication
   */
  async testConnection() {
    if (this.isMockMode) {
      return { success: true, orgName: 'Demo Developer Sandbox' };
    }
    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects`;
      const res = await this.executeFetch(url);
      if (res.ok && res.data) {
        return {
          success: true,
          orgName: this.instanceUrl.replace(/^https?:\/\//, ''),
          sobjectsCount: (res.data.sobjects || []).length
        };
      }
      const errMsg = res.data && res.data[0] ? res.data[0].message : (res.error || `HTTP ${res.status}`);
      return { success: false, error: errMsg };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Fetch list of all SObjects in the org
   */
  async getSObjectsList() {
    if (this.isMockMode) {
      return this.getMockSObjectsList();
    }

    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects`;
      const res = await this.executeFetch(url);
      if (res.ok && res.data && res.data.sobjects) {
        const objects = res.data.sobjects
          .filter(obj => obj.createable && !obj.deprecatedAndHidden)
          .map(obj => ({
            name: obj.name,
            label: obj.label,
            custom: obj.custom,
            keyPrefix: obj.keyPrefix
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        return objects;
      }

      if (res.status === 401) {
        throw new Error('Session expired or invalid (HTTP 401). Please refresh your Salesforce tab or enter your token in Settings.');
      }

      throw new Error(res.error || 'Failed to fetch SObjects');
    } catch (err) {
      console.warn('Could not fetch remote SObjects, falling back to mock:', err);
      if (err.message.includes('401') || err.message.includes('Session expired')) {
        throw err;
      }
      return this.getMockSObjectsList();
    }
  }

  /**
   * Describe SObject metadata (fields, types, picklists, createable, required)
   */
  async describeSObject(sObjectName) {
    if (this.isMockMode) {
      return this.getMockDescribe(sObjectName);
    }

    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${sObjectName}/describe`;
      const res = await this.executeFetch(url);

      if (res.ok && res.data) {
        const describe = res.data;
        const fields = (describe.fields || [])
          .filter(f => f.createable)
          .map(f => {
            const isRequired = !f.nillable && !f.defaultedOnCreate && f.type !== 'boolean';
            return {
              name: f.name,
              label: f.label,
              type: f.type,
              length: f.length,
              precision: f.precision,
              scale: f.scale,
              required: isRequired,
              createable: f.createable,
              custom: f.custom,
              defaultValue: f.defaultValue,
              picklistValues: (f.picklistValues || []).map(pv => ({
                label: pv.label,
                value: pv.value,
                active: pv.active,
                defaultValue: pv.defaultValue
              })),
              referenceTo: f.referenceTo || []
            };
          });

        fields.sort((a, b) => {
          if (a.required !== b.required) return a.required ? -1 : 1;
          return a.label.localeCompare(b.label);
        });

        return {
          name: describe.name,
          label: describe.label,
          custom: describe.custom,
          keyPrefix: describe.keyPrefix,
          fields
        };
      }

      if (res.status === 401) {
        throw new Error('Session expired or invalid (HTTP 401). Please refresh your Salesforce tab or update your token in Settings.');
      }

      throw new Error(res.error || `Failed to describe ${sObjectName}`);
    } catch (err) {
      console.warn('Describe error for ' + sObjectName, err);
      if (err.message.includes('401') || err.message.includes('Session expired')) {
        throw err;
      }
      return this.getMockDescribe(sObjectName);
    }
  }

  /**
   * Insert records into Salesforce using Composite SObject Collections API
   * POST /services/data/{version}/composite/sobjects
   */
  async insertRecords(sObjectName, records) {
    if (this.isMockMode) {
      return this.simulateMockInsert(sObjectName, records);
    }

    if (!this.sessionId) {
      throw new Error('No active Salesforce session token available. Please refresh your Salesforce tab or enter your Session ID in Settings.');
    }

    // Pre-flight address sanitizer (Salesforce requires Country whenever State/StateCode is specified)
    this.sanitizeRecordPayloads(records);

    const BATCH_SIZE = 200; // Salesforce composite API batch limit
    const results = [];
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batchRecords = records.slice(i, i + BATCH_SIZE).map(record => ({
        attributes: { type: sObjectName },
        ...record
      }));

      const payload = {
        allOrNone: false,
        records: batchRecords
      };

      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/composite/sobjects`;
      const res = await this.executeFetch(url, 'POST', payload);

      if (res.status === 401) {
        throw new Error('Salesforce Session expired or invalid (HTTP 401). Please refresh your Salesforce tab or enter your Session ID in Settings.');
      }

      if (res.ok && Array.isArray(res.data)) {
        for (let j = 0; j < res.data.length; j++) {
          const item = res.data[j];
          if (item.success) {
            totalSuccess++;
            results.push({
              success: true,
              id: item.id,
              record: batchRecords[j]
            });
          } else {
            totalFailed++;
            const errorMsg = (item.errors || []).map(e => `${e.statusCode}: ${e.message} (${(e.fields || []).join(', ')})`).join('; ');
            results.push({
              success: false,
              errors: item.errors || [],
              errorMessage: errorMsg || 'Salesforce record validation failed',
              record: batchRecords[j]
            });
          }
        }
      } else {
        // Entire batch failed
        const errorMsg = res.error || (res.data && res.data[0] ? res.data[0].message : 'Composite request failed');
        for (const rec of batchRecords) {
          totalFailed++;
          results.push({
            success: false,
            errorMessage: errorMsg,
            record: rec
          });
        }
      }
    }

    return {
      total: records.length,
      successCount: totalSuccess,
      failureCount: totalFailed,
      results
    };
  }

  /**
   * Get total number of records for a given SObject
   * Uses SOQL count() query
   */
  async getRecordCount(sObjectName, whereClause = '') {
    if (this.isMockMode) {
      return this.getMockRecordCount(sObjectName);
    }
    if (!this.sessionId) {
      throw new Error('No active Salesforce session available.');
    }

    if (!sObjectName || !/^[a-zA-Z0-9_]+$/.test(sObjectName)) {
      throw new Error('Invalid SObject name format.');
    }

    try {
      let where = '';
      if (whereClause && typeof whereClause === 'string') {
        const sanitized = whereClause.trim();
        if (/[;\-]/.test(sanitized)) {
          throw new Error('Invalid characters in SOQL WHERE clause.');
        }
        where = ` WHERE ${sanitized}`;
      }

      const soql = `SELECT count() FROM ${sObjectName}${where}`;
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/query/?q=${encodeURIComponent(soql)}`;
      const res = await this.executeFetch(url);

      if (res.ok && res.data && typeof res.data.totalSize === 'number') {
        return res.data.totalSize;
      }
      return 0;
    } catch (err) {
      console.error('getRecordCount error:', err);
      return 0;
    }
  }

  /**
   * Fetch records for deletion view
   */
  async getRecordsForDeletion(sObjectName, options = {}) {
    if (this.isMockMode) {
      return this.getMockRecordsForDeletion(sObjectName, options);
    }
    if (!this.sessionId) {
      throw new Error('No active Salesforce session available.');
    }

    if (!sObjectName || !/^[a-zA-Z0-9_]+$/.test(sObjectName)) {
      throw new Error('Invalid SObject name format.');
    }

    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 100, 10), 1000);
    const filterPreset = options.filterPreset || 'all';

    // 1. Get describe to find the best display name field
    let nameField = 'Id';
    try {
      const desc = await this.describeSObject(sObjectName);
      const fields = (desc && desc.fields) || [];
      const fieldNames = new Set(fields.map(f => f.name));

      const candidates = ['Name', 'CaseNumber', 'Subject', 'Title', 'DeveloperName', 'Username', 'ContractNumber', 'SolutionName'];
      for (const cand of candidates) {
        if (fieldNames.has(cand) && /^[a-zA-Z0-9_]+$/.test(cand)) {
          nameField = cand;
          break;
        }
      }
    } catch (e) {
      nameField = 'Id';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(nameField)) {
      nameField = 'Id';
    }

    // 2. Build WHERE clause based on preset
    const whereConditions = [];
    if (filterPreset === 'today') {
      whereConditions.push('CreatedDate = TODAY');
    } else if (filterPreset === 'this_week') {
      whereConditions.push('CreatedDate = THIS_WEEK');
    } else if (filterPreset === 'test_tool') {
      if (nameField !== 'Id') {
        whereConditions.push(`(${nameField} LIKE '%QA-%' OR ${nameField} LIKE '%-batch-%' OR ${nameField} LIKE '%Acme%' OR ${nameField} LIKE '%Apex%' OR ${nameField} LIKE '%Nova%')`);
      }
    }

    if (options.customWhere && typeof options.customWhere === 'string' && options.customWhere.trim()) {
      const customTrimmed = options.customWhere.trim();
      if (!/[;\-]/.test(customTrimmed)) {
        whereConditions.push(`(${customTrimmed})`);
      }
    }

    const whereStr = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';
    const selectFields = nameField === 'Id' ? 'Id, CreatedDate' : `Id, ${nameField}, CreatedDate`;
    const soql = `SELECT ${selectFields} FROM ${sObjectName}${whereStr} ORDER BY CreatedDate DESC LIMIT ${limit}`;
    const url = `${this.instanceUrl}/services/data/${this.apiVersion}/query/?q=${encodeURIComponent(soql)}`;

    const res = await this.executeFetch(url);
    if (!res.ok) {
      const errMsg = res.data && res.data[0] ? res.data[0].message : (res.error || `HTTP ${res.status}`);
      throw new Error(`Failed to query records: ${errMsg}`);
    }

    const records = (res.data && res.data.records) || [];
    return {
      records: records.map(r => ({
        id: r.Id,
        displayName: r[nameField] || r.Id,
        nameField,
        createdDate: r.CreatedDate ? new Date(r.CreatedDate).toLocaleString() : 'Unknown',
        rawCreatedDate: r.CreatedDate
      })),
      nameField,
      totalCount: res.data.totalSize || records.length
    };
  }

  /**
   * Delete a batch of records using Salesforce Composite SObject Collections API
   * DELETE /services/data/{version}/composite/sobjects?ids=id1,id2&allOrNone=false
   */
  async deleteRecords(sObjectName, recordIds) {
    if (this.isMockMode) {
      return this.simulateMockDelete(sObjectName, recordIds);
    }
    if (!this.sessionId) {
      throw new Error('No active Salesforce session available.');
    }
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return { total: 0, successCount: 0, failureCount: 0, results: [] };
    }

    // Defensive ID sanitization: Ensure only valid alphanumeric 15/18-char Salesforce IDs are passed
    const validRecordIds = recordIds.filter(id => typeof id === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(id.trim()));
    if (validRecordIds.length === 0) {
      return { total: 0, successCount: 0, failureCount: 0, results: [] };
    }

    const BATCH_SIZE = 200; // Salesforce composite API limit
    const results = [];
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < validRecordIds.length; i += BATCH_SIZE) {
      const chunk = validRecordIds.slice(i, i + BATCH_SIZE);
      const encodedIds = chunk.map(id => encodeURIComponent(id)).join(',');
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/composite/sobjects?ids=${encodedIds}&allOrNone=false`;

      const res = await this.executeFetch(url, 'DELETE');

      if (res.status === 401) {
        throw new Error('Salesforce Session expired (HTTP 401). Please refresh your Salesforce tab or update token in Settings.');
      }

      if (res.ok && Array.isArray(res.data)) {
        for (let j = 0; j < res.data.length; j++) {
          const item = res.data[j];
          if (item.success) {
            totalSuccess++;
            results.push({
              success: true,
              id: item.id || chunk[j]
            });
          } else {
            totalFailed++;
            const errorMsg = (item.errors || []).map(e => `${e.statusCode}: ${e.message}`).join('; ');
            results.push({
              success: false,
              id: item.id || chunk[j],
              errorMessage: errorMsg || 'Deletion failed'
            });
          }
        }
      } else {
        const errorMsg = res.error || (res.data && res.data[0] ? res.data[0].message : 'Composite delete failed');
        for (const id of chunk) {
          totalFailed++;
          results.push({
            success: false,
            id,
            errorMessage: errorMsg
          });
        }
      }
    }

    return {
      total: recordIds.length,
      successCount: totalSuccess,
      failureCount: totalFailed,
      results
    };
  }

  getMockRecordCount(sObjectName) {
    const counts = {
      Account: 34,
      Contact: 88,
      Lead: 45,
      Opportunity: 29,
      Case: 18,
      Project__c: 12
    };
    return counts[sObjectName] || 15;
  }

  getMockRecordsForDeletion(sObjectName, options = {}) {
    const limit = Math.min(parseInt(options.limit, 10) || 50, 100);
    const mockNames = {
      Account: ['Apex Global Systems', 'Nova Labs Corp', 'CloudPeak Tech', 'Quantum Dynamics', 'Horizon Soft'],
      Contact: ['Sarah Connor', 'John Doe', 'Alice Smith', 'Michael Scott', 'Jim Halpert'],
      Lead: ['Robert California', 'David Wallace', 'Jan Levinson', 'Ryan Howard'],
      Opportunity: ['Acme Enterprise Upgrade - 50k', 'Global Matrix Q3 Rollout', 'Nexus Platform Deal'],
      Case: ['Cannot login via SSO', 'Billing discrepancy Q2', 'API timeout error'],
      Project__c: ['Apollo Migration 2026', 'CloudSync Alpha', 'DataForge Integration']
    };

    const names = mockNames[sObjectName] || ['Sample Record A', 'Sample Record B', 'Sample Record C'];
    const prefixMap = { Account: '001', Contact: '003', Lead: '00Q', Opportunity: '006', Case: '500', Project__c: 'a01' };
    const pfx = prefixMap[sObjectName] || '001';

    const records = [];
    for (let i = 0; i < Math.min(limit, 25); i++) {
      const name = names[i % names.length] + (i >= names.length ? ` (${i + 1})` : '');
      const id = `${pfx}0000000${String(i + 100).padStart(5, '0')}AAA`;
      const date = new Date(Date.now() - i * 3600 * 1000 * 4);
      records.push({
        id,
        displayName: name,
        nameField: 'Name',
        createdDate: date.toLocaleString(),
        rawCreatedDate: date.toISOString()
      });
    }

    return {
      records,
      nameField: 'Name',
      totalCount: records.length
    };
  }

  simulateMockDelete(sObjectName, recordIds) {
    const results = recordIds.map(id => ({
      success: true,
      id
    }));
    return {
      total: recordIds.length,
      successCount: recordIds.length,
      failureCount: 0,
      results
    };
  }

  /**
   * Pre-flight address integrity sanitizer:
   * Salesforce rejects inserts if a State or StateCode is specified without Country or CountryCode.
   * Ensures that any record with StateCode/State has matching CountryCode/Country before dispatch.
   */
  sanitizeRecordPayloads(records) {
    if (!Array.isArray(records)) return;
    const prefixes = ['Mailing', 'Billing', 'Shipping', 'Other', ''];

    const US_VALID_STATE_CODES = new Set([
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
    ]);

    for (const rec of records) {
      if (!rec || typeof rec !== 'object') continue;

      for (const prefix of prefixes) {
        const stateCodeKey = prefix ? `${prefix}StateCode` : 'StateCode';
        const stateKey = prefix ? `${prefix}State` : 'State';
        const countryCodeKey = prefix ? `${prefix}CountryCode` : 'CountryCode';
        const countryKey = prefix ? `${prefix}Country` : 'Country';

        if (rec[stateCodeKey]) {
          const scUpper = String(rec[stateCodeKey]).trim().toUpperCase();
          const ccVal = rec[countryCodeKey] ? String(rec[countryCodeKey]).trim().toUpperCase() : '';
          const isUs = !ccVal || ccVal === 'US' || rec[countryKey] === 'United States' || rec[countryKey] === 'USA';

          // If state code is invalid for US (e.g. foreign code "TA" rejected by Salesforce for US)
          if (!US_VALID_STATE_CODES.has(scUpper) && isUs) {
            rec[stateCodeKey] = 'CA';
          }
          if (!rec[countryCodeKey]) {
            rec[countryCodeKey] = 'US';
          }
        }
        if (rec[stateKey] && !rec[countryKey] && !rec[countryCodeKey]) {
          rec[countryKey] = 'United States';
        }
      }

      // Custom Address Fields: {Prefix}__StateCode__s -> {Prefix}__CountryCode__s
      for (const key of Object.keys(rec)) {
        const match = key.match(/^([a-z0-9_]+)__(statecode|state)__s$/i);
        if (match) {
          const prefix = match[1];
          const isCode = match[2].toLowerCase() === 'statecode';
          const ccKey = `${prefix}__CountryCode__s`;
          const cKey = `${prefix}__Country__s`;

          if (isCode && rec[key]) {
            const scUpper = String(rec[key]).trim().toUpperCase();
            const ccUpper = rec[ccKey] ? String(rec[ccKey]).trim().toUpperCase() : '';
            const isUs = !ccUpper || ccUpper === 'US' || rec[cKey] === 'United States' || rec[cKey] === 'USA';
            if (!US_VALID_STATE_CODES.has(scUpper) && isUs) {
              rec[key] = 'CA';
            }
          }

          if (!rec[ccKey] && !rec[cKey]) {
            if (isCode) {
              rec[ccKey] = 'US';
            } else {
              rec[cKey] = 'United States';
            }
          }
        }
      }
    }
  }

  /**
   * Safe fetch runner - proxies through background worker for maximum permission & CORS freedom
   */
  async executeFetch(url, method = 'GET', body = null) {
    const headers = {
      'Authorization': `Bearer ${this.sessionId}`,
      'Accept': 'application/json'
    };

    // Use background service worker proxy (Manifest V3 host_permissions are fully respected in background)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'PROXY_SF_FETCH',
          payload: { url, method, headers, body }
        }, (proxyRes) => {
          if (chrome.runtime.lastError || !proxyRes) {
            console.warn('Background proxy message failed, trying direct fetch:', chrome.runtime.lastError);
            // Fallback to direct fetch
            this.directFetch(url, method, headers, body).then(resolve);
            return;
          }
          resolve(proxyRes);
        });
      });
    }

    return this.directFetch(url, method, headers, body);
  }

  async directFetch(url, method, headers, body) {
    try {
      const options = { method, headers };
      if (body) {
        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      return {
        ok: response.ok,
        status: response.status,
        data
      };
    } catch (err) {
      return { ok: false, status: 0, error: err.message };
    }
  }

  // ==========================================
  // MOCK / DEMO SCHEMAS & SIMULATOR
  // ==========================================

  getMockSObjectsList() {
    return [
      { name: 'Account', label: 'Account', custom: false, keyPrefix: '001' },
      { name: 'Contact', label: 'Contact', custom: false, keyPrefix: '003' },
      { name: 'Opportunity', label: 'Opportunity', custom: false, keyPrefix: '006' },
      { name: 'Lead', label: 'Lead', custom: false, keyPrefix: '00Q' },
      { name: 'Case', label: 'Case', custom: false, keyPrefix: '500' },
      { name: 'Product2', label: 'Product', custom: false, keyPrefix: '01t' },
      { name: 'Project__c', label: 'Project (Custom)', custom: true, keyPrefix: 'a01' },
      { name: 'Invoice__c', label: 'Invoice (Custom)', custom: true, keyPrefix: 'a02' }
    ];
  }

  getMockDescribe(sObjectName) {
    const mockSchemas = {
      Account: {
        name: 'Account',
        label: 'Account',
        custom: false,
        keyPrefix: '001',
        fields: [
          { name: 'Name', label: 'Account Name', type: 'string', length: 255, required: true, createable: true },
          { name: 'Type', label: 'Type', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'Prospect', value: 'Prospect' }, { label: 'Customer - Direct', value: 'Customer - Direct' }, { label: 'Customer - Channel', value: 'Customer - Channel' }, { label: 'Partner', value: 'Partner' }] },
          { name: 'Industry', label: 'Industry', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'Technology', value: 'Technology' }, { label: 'Finance', value: 'Finance' }, { label: 'Healthcare', value: 'Healthcare' }, { label: 'Manufacturing', value: 'Manufacturing' }, { label: 'Consulting', value: 'Consulting' }] },
          { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'currency', precision: 18, scale: 2, required: false, createable: true },
          { name: 'NumberOfEmployees', label: 'Employees', type: 'int', required: false, createable: true },
          { name: 'Phone', label: 'Phone', type: 'phone', required: false, createable: true },
          { name: 'Website', label: 'Website', type: 'url', required: false, createable: true },
          { name: 'BillingStreet', label: 'Billing Street', type: 'string', length: 255, required: false, createable: true },
          { name: 'BillingCity', label: 'Billing City', type: 'string', length: 40, required: false, createable: true },
          { name: 'BillingState', label: 'Billing State/Province', type: 'string', length: 20, required: false, createable: true },
          { name: 'BillingPostalCode', label: 'Billing Zip/Postal Code', type: 'string', length: 20, required: false, createable: true },
          { name: 'BillingCountry', label: 'Billing Country', type: 'string', length: 40, required: false, createable: true },
          { name: 'ShippingStreet', label: 'Shipping Street', type: 'string', length: 255, required: false, createable: true },
          { name: 'ShippingCity', label: 'Shipping City', type: 'string', length: 40, required: false, createable: true },
          { name: 'ShippingState', label: 'Shipping State/Province', type: 'string', length: 20, required: false, createable: true },
          { name: 'ShippingPostalCode', label: 'Shipping Zip/Postal Code', type: 'string', length: 20, required: false, createable: true },
          { name: 'ShippingCountry', label: 'Shipping Country', type: 'string', length: 40, required: false, createable: true },
          { name: 'Rating', label: 'Rating', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'Hot', value: 'Hot' }, { label: 'Warm', value: 'Warm' }, { label: 'Cold', value: 'Cold' }] },
          { name: 'Description', label: 'Description', type: 'textarea', length: 32000, required: false, createable: true },
          { name: 'Active__c', label: 'Active', type: 'boolean', required: false, createable: true, custom: true }
        ]
      },
      Contact: {
        name: 'Contact',
        label: 'Contact',
        custom: false,
        keyPrefix: '003',
        fields: [
          { name: 'LastName', label: 'Last Name', type: 'string', length: 80, required: true, createable: true },
          { name: 'FirstName', label: 'First Name', type: 'string', length: 40, required: false, createable: true },
          { name: 'AccountId', label: 'Account ID', type: 'reference', referenceTo: ['Account'], required: false, createable: true },
          { name: 'Email', label: 'Email', type: 'email', required: false, createable: true },
          { name: 'Phone', label: 'Phone', type: 'phone', required: false, createable: true },
          { name: 'MobilePhone', label: 'Mobile Phone', type: 'phone', required: false, createable: true },
          { name: 'Title', label: 'Title', type: 'string', length: 128, required: false, createable: true },
          { name: 'Department', label: 'Department', type: 'string', length: 80, required: false, createable: true },
          { name: 'Birthdate', label: 'Birthdate', type: 'date', required: false, createable: true },
          { name: 'MailingStreet', label: 'Mailing Street', type: 'string', length: 255, required: false, createable: true },
          { name: 'MailingCity', label: 'Mailing City', type: 'string', length: 40, required: false, createable: true },
          { name: 'MailingState', label: 'Mailing State/Province', type: 'string', length: 20, required: false, createable: true },
          { name: 'MailingStateCode', label: 'Mailing State Code', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'California', value: 'CA' }, { label: 'New York', value: 'NY' }, { label: 'Texas', value: 'TX' }, { label: 'Washington', value: 'WA' }] },
          { name: 'MailingPostalCode', label: 'Mailing Zip/Postal Code', type: 'string', length: 20, required: false, createable: true },
          { name: 'MailingCountry', label: 'Mailing Country', type: 'string', length: 40, required: false, createable: true },
          { name: 'MailingCountryCode', label: 'Mailing Country Code', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'United States', value: 'US' }, { label: 'Canada', value: 'CA' }] },
          { name: 'LeadSource', label: 'Lead Source', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'Web', value: 'Web' }, { label: 'Phone Inquiry', value: 'Phone Inquiry' }, { label: 'Partner Referral', value: 'Partner Referral' }] },
          { name: 'Description', label: 'Description', type: 'textarea', length: 32000, required: false, createable: true }
        ]
      },
      Opportunity: {
        name: 'Opportunity',
        label: 'Opportunity',
        custom: false,
        keyPrefix: '006',
        fields: [
          { name: 'Name', label: 'Opportunity Name', type: 'string', length: 120, required: true, createable: true },
          { name: 'StageName', label: 'Stage', type: 'picklist', required: true, createable: true, picklistValues: [{ label: 'Prospecting', value: 'Prospecting' }, { label: 'Qualification', value: 'Qualification' }, { label: 'Proposal/Price Quote', value: 'Proposal/Price Quote' }, { label: 'Negotiation/Review', value: 'Negotiation/Review' }, { label: 'Closed Won', value: 'Closed Won' }, { label: 'Closed Lost', value: 'Closed Lost' }] },
          { name: 'CloseDate', label: 'Close Date', type: 'date', required: true, createable: true },
          { name: 'Amount', label: 'Amount', type: 'currency', precision: 18, scale: 2, required: false, createable: true },
          { name: 'Probability', label: 'Probability (%)', type: 'percent', precision: 3, scale: 0, required: false, createable: true },
          { name: 'Type', label: 'Opportunity Type', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'Existing Customer - Upgrade', value: 'Existing Customer - Upgrade' }, { label: 'New Customer', value: 'New Customer' }] },
          { name: 'Description', label: 'Description', type: 'textarea', length: 32000, required: false, createable: true }
        ]
      },
      Lead: {
        name: 'Lead',
        label: 'Lead',
        custom: false,
        keyPrefix: '00Q',
        fields: [
          { name: 'LastName', label: 'Last Name', type: 'string', length: 80, required: true, createable: true },
          { name: 'Company', label: 'Company', type: 'string', length: 255, required: true, createable: true },
          { name: 'FirstName', label: 'First Name', type: 'string', length: 40, required: false, createable: true },
          { name: 'Title', label: 'Title', type: 'string', length: 128, required: false, createable: true },
          { name: 'Email', label: 'Email', type: 'email', required: false, createable: true },
          { name: 'Phone', label: 'Phone', type: 'phone', required: false, createable: true },
          { name: 'Street', label: 'Street', type: 'string', length: 255, required: false, createable: true },
          { name: 'City', label: 'City', type: 'string', length: 40, required: false, createable: true },
          { name: 'State', label: 'State/Province', type: 'string', length: 20, required: false, createable: true },
          { name: 'PostalCode', label: 'Zip/Postal Code', type: 'string', length: 20, required: false, createable: true },
          { name: 'Country', label: 'Country', type: 'string', length: 40, required: false, createable: true },
          { name: 'Status', label: 'Lead Status', type: 'picklist', required: true, createable: true, picklistValues: [{ label: 'Open - Not Contacted', value: 'Open - Not Contacted' }, { label: 'Working - Contacted', value: 'Working - Contacted' }, { label: 'Closed - Converted', value: 'Closed - Converted' }] },
          { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'currency', precision: 18, scale: 2, required: false, createable: true }
        ]
      },
      Case: {
        name: 'Case',
        label: 'Case',
        custom: false,
        keyPrefix: '500',
        fields: [
          { name: 'Subject', label: 'Subject', type: 'string', length: 255, required: false, createable: true },
          { name: 'Status', label: 'Status', type: 'picklist', required: true, createable: true, picklistValues: [{ label: 'New', value: 'New' }, { label: 'Working', value: 'Working' }, { label: 'Escalated', value: 'Escalated' }, { label: 'Closed', value: 'Closed' }] },
          { name: 'Priority', label: 'Priority', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'High', value: 'High' }, { label: 'Medium', value: 'Medium' }, { label: 'Low', value: 'Low' }] },
          { name: 'Origin', label: 'Case Origin', type: 'picklist', required: false, createable: true, picklistValues: [{ label: 'Web', value: 'Web' }, { label: 'Email', value: 'Email' }, { label: 'Phone', value: 'Phone' }] },
          { name: 'Description', label: 'Description', type: 'textarea', length: 32000, required: false, createable: true },
          { name: 'IsEscalated', label: 'Escalated', type: 'boolean', required: false, createable: true }
        ]
      },
      Project__c: {
        name: 'Project__c',
        label: 'Project',
        custom: true,
        keyPrefix: 'a01',
        fields: [
          { name: 'Name', label: 'Project Name', type: 'string', length: 80, required: true, createable: true },
          { name: 'Status__c', label: 'Project Status', type: 'picklist', required: true, createable: true, custom: true, picklistValues: [{ label: 'Planning', value: 'Planning' }, { label: 'In Progress', value: 'In Progress' }, { label: 'Completed', value: 'Completed' }, { label: 'On Hold', value: 'On Hold' }] },
          { name: 'Budget__c', label: 'Total Budget', type: 'currency', precision: 18, scale: 2, required: false, createable: true, custom: true },
          { name: 'Start_Date__c', label: 'Start Date', type: 'date', required: false, createable: true, custom: true },
          { name: 'End_Date__c', label: 'Target Completion Date', type: 'date', required: false, createable: true, custom: true },
          { name: 'Is_Active__c', label: 'Active Project', type: 'boolean', required: false, createable: true, custom: true }
        ]
      }
    };

    if (mockSchemas[sObjectName]) {
      return mockSchemas[sObjectName];
    }

    return {
      name: sObjectName,
      label: sObjectName.replace('__c', '').replace(/_/g, ' '),
      custom: sObjectName.endsWith('__c'),
      keyPrefix: 'a99',
      fields: [
        { name: 'Name', label: `${sObjectName} Name`, type: 'string', length: 80, required: true, createable: true },
        { name: 'Description__c', label: 'Description', type: 'textarea', length: 1000, required: false, createable: true, custom: true },
        { name: 'Status__c', label: 'Status', type: 'picklist', required: false, createable: true, custom: true, picklistValues: [{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }] },
        { name: 'Amount__c', label: 'Amount', type: 'currency', precision: 18, scale: 2, required: false, createable: true, custom: true },
        { name: 'Date__c', label: 'Date', type: 'date', required: false, createable: true, custom: true }
      ]
    };
  }

  async simulateMockInsert(sObjectName, records) {
    await new Promise(r => setTimeout(r, 600));

    const prefixMap = {
      Account: '001',
      Contact: '003',
      Opportunity: '006',
      Lead: '00Q',
      Case: '500',
      Product2: '01t',
      Project__c: 'a01',
      Invoice__c: 'a02'
    };
    const prefix = prefixMap[sObjectName] || 'a99';

    const results = records.map((rec) => {
      const mockId = (typeof GeneratorEngine !== 'undefined' && GeneratorEngine.generateMockSalesforceId)
        ? GeneratorEngine.generateMockSalesforceId(prefix)
        : `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`.toUpperCase().padEnd(18, 'X');
      return {
        success: true,
        id: mockId,
        record: rec
      };
    });

    return {
      total: records.length,
      successCount: records.length,
      failureCount: 0,
      results
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SalesforceService;
}
