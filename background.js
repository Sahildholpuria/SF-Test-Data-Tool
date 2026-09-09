/**
 * SF DataForge - Background Service Worker (Manifest V3)
 * Handles smart Salesforce session discovery, multi-domain token resolution, and API proxying.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('SF DataForge Extension installed.');
});

// Message dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_ACTIVE_SF_SESSION') {
    handleGetActiveSession(sender, sendResponse);
    return true; // async
  }

  if (message.action === 'TEST_SF_SESSION') {
    handleTestSession(message.payload, sendResponse);
    return true; // async
  }

  if (message.action === 'OPEN_SIDE_PANEL') {
    if (sender.tab && sender.tab.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
    } else {
      chrome.windows.getCurrent((w) => {
        if (w && w.id) chrome.sidePanel.open({ windowId: w.id });
      });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'OPEN_FULL_TAB') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?mode=tab') });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'SWITCH_TO_TAB') {
    if (message.payload && message.payload.tabId) {
      chrome.tabs.update(message.payload.tabId, { active: true }, (tab) => {
        if (tab && tab.windowId) {
          chrome.windows.update(tab.windowId, { focused: true });
        }
        sendResponse({ success: true });
      });
      return true;
    }
  }

  if (message.action === 'OPEN_URL') {
    if (message.payload && message.payload.url) {
      const targetUrl = message.payload.url;
      try {
        const parsed = new URL(targetUrl);
        if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && isSalesforceUrl(targetUrl)) {
          chrome.tabs.create({ url: targetUrl });
          sendResponse({ success: true });
          return true;
        }
      } catch (e) {}
      sendResponse({ success: false, error: 'Blocked navigation to unverified or dangerous URL protocol.' });
      return true;
    }
  }

  if (message.action === 'PROXY_SF_FETCH') {
    handleProxyFetch(message.payload, sendResponse);
    return true; // async
  }
});

// Dynamic Badge & Tooltip: Visually shows when user is on an active Salesforce tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateActionBadgeForTab(tab);
  } catch (e) {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    updateActionBadgeForTab(tab);
  }
});

function updateActionBadgeForTab(tab) {
  if (!tab || !tab.url) return;
  const isSf = isSalesforceUrl(tab.url);
  if (isSf) {
    chrome.action.setBadgeText({ text: 'SF', tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#0176D3', tabId: tab.id });
    try {
      const u = new URL(tab.url);
      chrome.action.setTitle({ title: `SF DataForge (Active on ${u.hostname})`, tabId: tab.id });
    } catch (e) {
      chrome.action.setTitle({ title: 'SF DataForge (Active on Salesforce)', tabId: tab.id });
    }
  } else {
    chrome.action.setBadgeText({ text: '', tabId: tab.id });
    chrome.action.setTitle({ title: 'SF DataForge - Open on a Salesforce tab to generate data', tabId: tab.id });
  }
}

/**
 * Robust Salesforce Session Discovery
 * Solves the "INVALID_SESSION_ID / Session expired or invalid" issue by:
 * 1. Discovering OrgID from active tab.
 * 2. Searching salesforce.com / my.salesforce.com domains for the true API session token.
 * 3. Ignoring lightning.force.com scoped cookies (which Salesforce blocks from REST APIs).
 * 4. Actively validating token against /services/data/v60.0/sobjects to guarantee it works!
 */
async function handleGetActiveSession(sender, sendResponse) {
  try {
    // 1. Locate active tab in current focused window
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const currentTab = tabs && tabs.length > 0 ? tabs[0] : null;

    // Check if current tab is a valid Salesforce URL
    const isCurrentTabSf = currentTab && isSalesforceUrl(currentTab.url);

    // Look for any Salesforce tabs open across all windows
    const allTabs = await chrome.tabs.query({});
    const sfTabs = allTabs.filter(t => isSalesforceUrl(t.url));

    // If current tab is NOT on Salesforce, return dedicated notOnSalesforce status
    if (!isCurrentTabSf) {
      return sendResponse({
        found: false,
        notOnSalesforce: true,
        currentTabUrl: currentTab ? currentTab.url : null,
        currentTabTitle: currentTab ? currentTab.title : null,
        hasOtherSfTab: sfTabs.length > 0,
        otherSfTab: sfTabs.length > 0 ? {
          id: sfTabs[0].id,
          url: sfTabs[0].url,
          title: sfTabs[0].title
        } : null,
        reason: 'The active browser tab is not a Salesforce org. SF DataForge works exclusively with active Salesforce tabs.'
      });
    }

    const activeTab = currentTab;

    const tabUrl = new URL(activeTab.url);
    const host = tabUrl.hostname;

    // Convert lightning domain to REST API domain (avoid redirects which drop Authorization headers)
    const myDomainHost = getMyDomain(host);
    const instanceUrl = `https://${myDomainHost}`;

    // 2. Discover OrgId from current tab cookie
    let orgId = null;
    const storeId = sender.tab ? sender.tab.cookieStoreId : undefined;
    const tabCookie = await chrome.cookies.get({ url: activeTab.url, name: 'sid', storeId });
    if (tabCookie && tabCookie.value) {
      orgId = tabCookie.value.split('!')[0];
    }

    // 3. Search for candidates across salesforce domains
    const searchDomains = [
      myDomainHost,
      'salesforce.com',
      'cloudforce.com',
      'force.com',
      'salesforce.mil'
    ];

    const candidateTokens = new Map(); // tokenValue -> { cookie, priority }

    for (const domain of searchDomains) {
      try {
        const cookies = await chrome.cookies.getAll({ name: 'sid', domain, storeId });
        for (const c of cookies) {
          if (!c.value || c.domain === 'help.salesforce.com') continue;

          // Crucial: lightning.force.com cookies DO NOT have REST API access!
          const isLightning = c.domain.includes('.lightning.force.com');
          const matchesOrg = orgId ? c.value.startsWith(orgId + '!') : true;

          let priority = 0;
          if (matchesOrg) priority += 10;
          if (c.domain.includes('.my.salesforce.')) priority += 8;
          if (c.domain.endsWith('salesforce.com') && !isLightning) priority += 5;
          if (isLightning) priority -= 10; // Penalize lightning-scoped cookies

          if (!candidateTokens.has(c.value) || candidateTokens.get(c.value).priority < priority) {
            candidateTokens.set(c.value, { cookie: c, priority });
          }
        }
      } catch (err) {
        console.warn(`Cookie lookup failed for domain ${domain}`, err);
      }
    }

    // Sort candidate tokens by priority (highest first)
    const sortedCandidates = Array.from(candidateTokens.values())
      .sort((a, b) => b.priority - a.priority);

    // 4. Test candidate tokens against Salesforce REST API to find the one that works
    let validToken = null;
    let verifiedOrgInfo = null;

    for (const candidate of sortedCandidates) {
      const testResult = await verifyTokenAgainstSalesforce(instanceUrl, candidate.cookie.value);
      if (testResult.valid) {
        validToken = candidate.cookie.value;
        verifiedOrgInfo = testResult.orgInfo;
        break;
      }
    }

    // If a verified working token was found:
    if (validToken) {
      return sendResponse({
        found: true,
        valid: true,
        tabId: activeTab.id,
        tabTitle: activeTab.title,
        instanceUrl,
        hasToken: true,
        sessionId: validToken,
        orgId: orgId || validToken.split('!')[0],
        orgInfo: verifiedOrgInfo
      });
    }

    // If candidates were found but rejected by Salesforce (e.g. session expired or IP restriction)
    if (sortedCandidates.length > 0) {
      return sendResponse({
        found: true,
        valid: false,
        sessionExpired: true,
        tabId: activeTab.id,
        tabTitle: activeTab.title,
        instanceUrl,
        hasToken: true,
        sessionId: sortedCandidates[0].cookie.value,
        reason: 'Salesforce session expired or restricted by "Lock sessions to the IP address from which they originated".'
      });
    }

    // No session cookie found
    return sendResponse({
      found: true,
      valid: false,
      tabTitle: activeTab.title,
      instanceUrl,
      hasToken: false,
      reason: 'No Salesforce session cookie found. Please log in to your Salesforce tab.'
    });

  } catch (error) {
    console.error('Error detecting SF session:', error);
    sendResponse({ found: false, error: error.message });
  }
}

/**
 * Convert lightning host to base REST API host (avoids redirect header drop)
 */
function getMyDomain(host) {
  if (!host) return host;
  return host
    .replace(/\.lightning\.force\./, '.my.salesforce.')
    .replace(/\.mcas\.ms$/, '');
}

function isSalesforceUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    let h = '';
    if (typeof URL !== 'undefined') {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      h = parsed.hostname.toLowerCase();
    } else {
      const match = url.match(/^https?:\/\/([^/?#]+)/i);
      if (match) h = match[1].toLowerCase();
      else return false;
    }
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

/**
 * Verify a token directly against Salesforce REST API
 */
async function verifyTokenAgainstSalesforce(instanceUrl, token, apiVersion = 'v60.0') {
  try {
    const endpoint = `${instanceUrl}/services/data/${apiVersion}/sobjects`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        valid: true,
        orgInfo: {
          sobjectsCount: (data.sobjects || []).length
        }
      };
    }

    return { valid: false, status: response.status };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

async function handleTestSession(payload, sendResponse) {
  const { instanceUrl, token, apiVersion = 'v60.0' } = payload;
  const cleanUrl = instanceUrl.replace(/\/$/, '');
  const result = await verifyTokenAgainstSalesforce(cleanUrl, token, apiVersion);
  sendResponse(result);
}

/**
 * Proxy fetch for Salesforce REST API
 */
async function handleProxyFetch(payload, sendResponse) {
  const { url, method = 'GET', headers = {}, body } = payload;
  try {
    if (!isSalesforceUrl(url)) {
      return sendResponse({
        ok: false,
        status: 403,
        error: 'Access denied: SF DataForge only makes requests to verified Salesforce domains.'
      });
    }

    const options = {
      method,
      headers: { ...headers }
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(url, options);
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    sendResponse({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data
    });
  } catch (err) {
    sendResponse({
      ok: false,
      status: 0,
      error: err.message
    });
  }
}
