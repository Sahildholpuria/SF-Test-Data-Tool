# SF DataForge - Comprehensive Feature & Technical Documentation

**SF DataForge** is an enterprise-grade Manifest V3 Chrome Extension built specifically for Salesforce Administrators, Developers, QA Engineers, and Solution Architects. It provides complete control to generate realistic, non-duplicate test data for any standard or custom Salesforce object, and provides a powerful **Data Cleaner** to query, inspect, and bulk-delete records directly from your browser.

**Developer & Architect**: **Sahil Dholpuria**

---

## 📑 Table of Contents

1. [Architecture & Overview](#1-architecture--overview)
2. [Connection & Authentication](#2-connection--authentication)
3. [Smart Test Data Generation](#3-smart-test-data-generation)
   - [Deep Semantic Field Analysis](#deep-semantic-field-analysis)
   - [Combinatorial Non-Duplicate Engine](#combinatorial-non-duplicate-engine)
   - [Geographic Address Coherence](#geographic-address-coherence)
   - [Picklist Values Explorer & Inline Preview](#picklist-values-explorer--inline-preview)
   - [Pattern & Formula Tokens](#pattern--formula-tokens)
4. [Data Cleaner & Bulk Record Deletion](#4-data-cleaner--bulk-record-deletion)
   - [Live Total Org Record Count](#live-total-org-record-count)
   - [Dynamic Display Field Detection](#dynamic-display-field-detection)
   - [SOQL Query Limits & Filter Presets](#soql-query-limits--filter-presets)
   - [Multi-Record Selection & Bulk Delete](#multi-record-selection--bulk-delete)
   - [Recycle Bin Safeguards & Confirmation Modal](#recycle-bin-safeguards--confirmation-modal)
5. [Presets, Templates & History](#5-presets-templates--history)
6. [Security & Compliance Architecture](#6-security--compliance-architecture)
   - [Domain Isolation & Salesforce-Only Guard](#domain-isolation--salesforce-only-guard)
   - [Manifest V3 CSP Hardening](#manifest-v3-csp-hardening)
   - [SOQL Injection Protections](#soql-injection-protections)
   - [Credential Security](#credential-security)
7. [Installation & Setup Guide](#7-installation--setup-guide)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)
9. [Releasing Updates & Creating New Packages](#9-releasing-updates--creating-new-packages)

---

## 1. Architecture & Overview

SF DataForge operates entirely client-side within Google Chrome, interacting directly with your Salesforce org using native Salesforce REST APIs (v60.0). No data ever leaves your browser or routes through third-party servers.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Chrome Browser                                │
│                                                                        │
│  ┌──────────────────────┐              ┌────────────────────────────┐  │
│  │     Popup / Panel    │   Messages   │      Service Worker        │  │
│  │      (popup.js)      │ ◄──────────► │      (background.js)       │  │
│  └──────────┬───────────┘              └─────────────┬──────────────┘  │
│             │                                        │                 │
│      Storage & Schemas                       Session Discovery         │
│             ▼                                & API Proxy               │
│  ┌──────────────────────┐                            ▼                 │
│  │  generatorEngine.js  │              ┌────────────────────────────┐  │
│  │  salesforceService.js│ ───────────► │  Salesforce REST APIs      │  │
│  │  storageService.js   │              │  /services/data/v60.0/...  │  │
│  └──────────────────────┘              └────────────────────────────┘  │
└───────────────────────────────────────────────────────┼────────────────┘
                                                        ▼
                                       ┌────────────────────────────────┐
                                       │   Salesforce Org (Cloud)       │
                                       │   • Describe API               │
                                       │   • Query API (SOQL)           │
                                       │   • Composite SObject API      │
                                       └────────────────────────────────┘
```

---

## 2. Connection & Authentication

SF DataForge provides three distinct connection modes:

### 1. Zero-Click Auto-Detection (Default)
When you open the extension while viewing an active Salesforce tab (`*.lightning.force.com` or `*.my.salesforce.com`):
- The background service worker accesses the authenticated `sid` session cookie for your domain.
- It normalizes your Lightning URL to your canonical REST API instance (`*.my.salesforce.com`).
- It tests candidate tokens against `/services/data/v60.0/sobjects` to verify active REST API access.
- Upon validation, the status pill turns green (`● Your Org Name`) and schema metadata is loaded immediately.

### 2. Multi-Tab Org Switching
If your active tab is on a non-Salesforce website (e.g. Google or GitHub), the extension displays the **Salesforce Active Tab Required** guard. If you have an open Salesforce tab in another window, a prompt automatically detects it:
- Clicking **"Switch to this Org"** immediately brings that Salesforce tab into focus and establishes connection.

### 3. Manual Session / Access Token Override
If your organization enforces the Salesforce security setting **"Lock sessions to the IP address from which they originated"**, cookies cannot be shared with extensions.
- Click **"Enter Token"** on the warning banner or navigate to **Settings**.
- Paste your Instance URL and Session ID (obtained in 5 seconds by running `System.debug(UserInfo.getSessionId());` in Developer Console Execute Anonymous).
- The token is verified against Salesforce before saving.

### 4. Demo / Sandbox Mode (Offline)
Select **Demo Mode** in Settings to test and evaluate all features offline with pre-configured schemas for Account, Contact, Lead, Opportunity, Case, and Custom Objects.

---

## 3. Smart Test Data Generation

### Deep Semantic Field Analysis
SF DataForge doesn't just look at field data types (`string`, `number`, `date`) — it performs contextual natural language analysis on the **field API name** and **field label** to generate context-perfect data.

| Field Name / Label Pattern | Detected Context | Generation Behavior | Smart UI Badge |
|---|---|---|---|
| `*Street*`, `*Address*` | Physical Address | Street address matching selected metropolitan city | `📍 Coherent Street Address` |
| `*City*` | Municipality | Realistic US City | `🏙️ Coherent City` |
| `*State*`, `*StateCode*` | State / Province | Valid 2-letter state ISO code or full state | `🗺️ Coherent State` |
| `*PostalCode*`, `*Zip*` | Postal Code | Valid 5-digit ZIP code matching the city SCF prefix | `📮 Coherent Postal Code` |
| `*Country*`, `*CountryCode*`| Country | United States / `US` | `🌐 Coherent Country` |
| `*Revenue*`, `*Turnover*` | Corporate Revenue | Scaled enterprise numeric ($500,000 – $25,000,000) | `💰 Enterprise Revenue` |
| `*Salary*`, `*Compensation*`| Personal Income | Realistic professional compensation ($65,000 – $220,000)| `💵 Enterprise Salary` |
| `*Amount*`, `*Budget*` | Deal / Budget Size | Commercial budget range ($15,000 – $500,000) | `📊 Deal Amount` |
| `*Discount*`, `*Margin*` | Percentage | Realistic discount range (5% – 30%) | `🏷️ Realistic Discount` |
| `*Birthdate*`, `*DOB*` | Birth Date | Adult birthdate (22 – 62 years in the past) | `🎂 Adult Birthdate` |
| `*CloseDate*`, `*TargetDate*`| Future Milestone | Contextual future date (+15 to +120 days) | `📅 Future Target Date` |
| `*HireDate*`, `*StartDate*` | Past Milestone | Realistic past date (3 months to 3 years ago) | `📆 Realistic Past Date` |
| `*SSN*`, `*TaxId*`, `*EIN*` | Identifiers | Masked identifiers (`XXX-XX-XXXX` or `XX-XXXXXXX`) | `🆔 Sensitive Identifier` |
| `*Company*`, `*Account*` | Organizations | Combinatorial enterprise name with unique salt | `🏢 Unique Enterprise Company` |

---

### Combinatorial Non-Duplicate Engine
To prevent batch execution failures caused by Salesforce **Duplicate Rules** or **Unique Field Constraints**:
- **Enterprise Names**: Constructed from 40 tech adjectives × 30 industry nouns × 9 corporate suffixes (10,800+ combinations) with randomized unique 3-4 digit suffix salts (e.g. `Quantum Dynamics Corp (842)`).
- **Personal Names**: Sampled from an expansive pool of diverse first and last names.
- **Emails**: Guaranteed unique per record with dynamic random salts (`jane.doe.7492@sandbox.io`).
- **Phone Numbers**: Valid North American area codes with random subscriber numbers.
- **Intra-Batch Collision Prevention**: Maintains unique tracking sets during batch creation to ensure no two records within a batch share identical unique identifiers.

---

### Geographic Address Coherence
In Salesforce, addresses are interdependent. When State and Country picklists are enabled in an org, generating an invalid state or mismatched country throws a `FIELD_INTEGRITY_EXCEPTION`.

SF DataForge solves this with a **Metropolitan Cluster Algorithm**:
1. Groups related address fields on the object by scope:
   - `Billing`: `BillingStreet`, `BillingCity`, `BillingStateCode`, `BillingPostalCode`, `BillingCountryCode`
   - `Shipping`: `ShippingStreet`, `ShippingCity`, `ShippingStateCode`, `ShippingPostalCode`, `ShippingCountryCode`
   - `Mailing`: `MailingStreet`, `MailingCity`, `MailingStateCode`, `MailingPostalCode`, `MailingCountryCode`
   - `Custom`: `Custom_Address__Street__s`, `Office_Location__City__s`
2. Selects a single metropolitan area for the record from a dataset of 20 major US metros:
   - **San Francisco, CA 94105** (Market St, Mission St, Montgomery St)
   - **New York, NY 10031** (Broadway, Madison Ave, 5th Ave)
   - **Austin, TX 78701** (Congress Ave, Colorado St, Guadalupe St)
   - **Chicago, IL 60611** (Michigan Ave, Lake Shore Dr, Wacker Dr)
   - **Seattle, WA 98101** (Pike St, Pine St, 4th Ave)
   - ...and 15 other major commercial hubs.
3. Automatically pairs state codes (`CA`, `TX`, `NY`) with matching country codes (`US`).
4. Auto-enables dependent country fields in the UI whenever a state field is selected.

---

### Picklist Values Explorer & Inline Preview
1. **Dynamic Schema Introspection**: Reads active, valid picklist entries from Salesforce metadata.
2. **Inline Value Count Badge**: Displays `👁️ N values` in the field type column.
3. **Inline Quick Preview Pills**: Shows the actual picklist choices as clickable pills directly in the row. Clicking any pill immediately locks in that value.
4. **Dedicated Explorer Modal**:
   - Opens a searchable table showing **Label**, **API Name**, and **Default Status**.
   - Filter picklist choices instantaneously.
   - Click **"🎲 Pick Random Value"** to sample choices evenly.
   - For State picklists, highlights active **US States** with green badges to guarantee validation compliance.

---

### Pattern & Formula Tokens
When choosing **Pattern / Formula** mode for a field, dynamic template interpolation is supported:

```
QA-{{batch}}-{{random:4}}
```

| Token | Description | Example Output |
|---|---|---|
| `{{index}}` | 1-based record index within batch | `1`, `2`, `3` |
| `{{index0}}` | 0-based record index within batch | `0`, `1`, `2` |
| `{{seq:1000}}`| Sequential integer starting from N | `1000`, `1001`, `1002` |
| `{{random}}` | 6-digit random integer | `482910` |
| `{{random:N}}`| N-digit random integer | `{{random:4}}` → `0391` |
| `{{date}}` | Current UTC date (`YYYY-MM-DD`) | `2026-09-09` |
| `{{timestamp}}`| Unix millisecond timestamp | `1788954200000` |
| `{{uuid}}` | Short random UUID | `a4f2-9c10-3d84` |
| `{{batch}}` | Unique 6-character batch code | `B7X2K9` |

---

## 4. Data Cleaner & Bulk Record Deletion

The **Data Cleaner** tab provides comprehensive tools to inspect and clean records directly from Salesforce.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Data Cleaner Tab                                                      │
│                                                                        │
│  Target Object: [ Account (Standard) ▼ ]   Total in Org: [ 1,420 ]     │
│  Query Limit:   [ 100 records        ▼ ]   [ 🔄 Query ]                │
│                                                                        │
│  Filter Presets: [ All Records ] [ Created Today ] [ Created This Week ]│
│  Search:         [ Search by ID or Name...                 ]           │
│                                                                        │
│  ┌───┬──────────────────┬──────────────────────┬─────────────┬──────┐  │
│  │ ☑ │ Record ID        │ Name / Title         │ Created     │ Del  │  │
│  ├───┼──────────────────┼──────────────────────┼─────────────┼──────┤  │
│  │ ☑ │ 0015g00000abc12  │ Apex Global Systems  │ Today 14:20 │ 🗑️  │  │
│  │ ☑ │ 0015g00000abc13  │ Nova Labs Corp (319) │ Today 14:20 │ 🗑️  │  │
│  └───┴──────────────────┴──────────────────────┴─────────────┴──────┘  │
│                                                                        │
│  Summary: 2 records selected • Will be moved to Salesforce Recycle Bin │
│  Action:  [ 🗑️ Delete Selected Records (2) ]                           │
└────────────────────────────────────────────────────────────────────────┘
```

### Live Total Org Record Count
- Executes `SELECT count() FROM {sObjectName}` via the Salesforce SOQL REST API.
- Renders the exact count in a prominent **Total in Org** stat badge.
- Automatically refreshes upon object selection and decrements in real-time following deletions.

### Dynamic Display Field Detection
Salesforce objects don't all use `Name` for their primary label:
- Standard Objects: `Account.Name`, `Case.CaseNumber`, `Task.Subject`, `Contract.ContractNumber`, `User.Username`.
- Custom Objects: `Custom_Object__c.Name` or `DeveloperName`.
The Data Cleaner inspects the describe schema to automatically detect the best available identifier field for the column header and row display.

### SOQL Query Limits & Filter Presets
- **Query Limit**: Choose 50, 100, 200, or 500 records.
- **Filter Presets**:
  - `All Records`: Fetches the latest records ordered by `CreatedDate DESC`.
  - `Created Today`: Executes SOQL `WHERE CreatedDate = TODAY`.
  - `Created This Week`: Executes SOQL `WHERE CreatedDate = THIS_WEEK`.
  - `Test Data Patterns`: Automatically filters records containing QA prefixes, batch tags, or mock company patterns (`QA-`, `batch`, `Apex`, `Nova`, `Acme`).
- **Live Search**: Instant client-side search filtering records by Record ID or Name.

### Multi-Record Selection & Bulk Delete
- **Table Header Checkbox**: Supports tri-state toggle (Checked, Indeterminate, Unchecked).
- **Quick Links**: **Select All** and **Clear**.
- **Row Checkboxes**: Check or uncheck individual records with visual row highlighting.
- **Individual Record Delete**: Dedicated trash can icon on each row for single-record deletion.
- **Batch Processing**: Uses the Salesforce Composite SObject Collections API (`DELETE /services/data/v60.0/composite/sobjects?ids=...&allOrNone=false`) in chunks of up to 200 IDs.

### Recycle Bin Safeguards & Confirmation Modal
Before any record is deleted, a danger-themed modal prompts for explicit confirmation:
- Displays the exact count of records to be deleted.
- Displays the target SObject name.
- Explicitly warns that deleted records will be moved to the Salesforce Recycle Bin and reminds of potential cascade deletions on child relationships.
- Deletion progress is tracked live with percentage fill, success count, failure badges, and audit logging to extension history.

---

## 5. Presets, Templates & History

### Presets & Templates
- Save any customized field mapping, custom formulas, and selected picklist values as a named preset (e.g. *"SLA Enterprise Accounts"*, *"QA Lead Batch"*).
- Saved templates persist across sessions in Chrome storage.
- Apply templates in 1 click to restore complex multi-field configurations instantly.

### Generation & Deletion History
- Every generation batch and deletion run is logged in the **History** tab.
- Tracks timestamp, object name, record count, success/partial/failure status, and instance URL.
- Displays created or deleted Record IDs as direct clickable links opening the record in Salesforce.
- Keep up to 100 recent operations with an easy 1-click **"Clear History"** option.

---

## 6. Security & Compliance Architecture

SF DataForge has undergone a rigorous security audit and is engineered to adhere to strict enterprise security standards:

### Domain Isolation & Salesforce-Only Guard
- The extension operates **strictly** on verified Salesforce domains:
  `*.salesforce.com`, `*.force.com`, `*.cloudforce.com`, `*.salesforce-setup.com`, `*.site.com`, `*.visualforce.com`, `*.salesforce.mil`, `*.cloudforce.mil`.
- If opened on any third-party domain (e.g. `google.com`, `github.com`), an active tab barrier prevents execution.
- Background API proxies enforce `isSalesforceUrl(url)` validation, rejecting any non-Salesforce request with `HTTP 403 Access Denied`.

### Manifest V3 CSP Hardening
- Strictly adheres to Chrome Manifest V3 Content Security Policy:
  `script-src 'self'; object-src 'none'; base-uri 'self';`
- **Zero inline event handlers**: No `onclick="..."` attributes in HTML templates. All interactive elements use standard `addEventListener` bindings.
- **Defensive HTML & URL Escaping**: All dynamic variables, IDs, and links are passed through `escapeHtml()` and `safeUrl()` helpers to eliminate DOM-based Cross-Site Scripting (XSS).

### SOQL Injection Protections
- All SObject names are validated against `/^[a-zA-Z0-9_]+$/`.
- Dynamic select fields are strictly validated against field metadata.
- Custom SOQL filter inputs reject dangerous characters (`--`, `;`).
- Composite Delete query parameters are sanitized with `/^[a-zA-Z0-9]{15,18}$/` and URL-encoded.

### Credential Security
- Session cookies are accessed locally via Chrome's privileged Cookies API without transmitting credentials to external servers.
- When manual tokens are supplied, they are stored strictly within the extension's private `chrome.storage.local` sandbox.
- No passwords, tokens, or client secrets are ever recorded in generation history or logs.

---

## 7. Installation & Setup Guide

### Step 1: Download or Clone the Repository
Ensure the project files are located on your local drive:
```
/Users/sahildholpuria/Documents/SF Test Data Tool
```

### Step 2: Load into Google Chrome
1. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the project directory: `SF Test Data Tool`.
5. The **SF DataForge** icon will appear in your Chrome toolbar.

### Step 3: Pin & Launch
1. Click the Chrome Extensions puzzle piece icon and **Pin** SF DataForge.
2. Navigate to your Salesforce organization tab (e.g. `https://your-org.lightning.force.com`).
3. Click the SF DataForge icon to open the popup, or right-click to open in the **Chrome Side Panel** for side-by-side productivity!

---

## 8. Troubleshooting & FAQs

### Q: Why do I see "Session expired or invalid (HTTP 401)"?
**A**: Your Salesforce tab session may have timed out, or your organization may enforce *"Lock sessions to IP"*.
- **Fix 1**: Refresh your active Salesforce tab.
- **Fix 2**: Click **"Enter Token"** on the warning banner. In Salesforce, open Developer Console, press `Ctrl+E` (or `Cmd+E`), run `System.debug(UserInfo.getSessionId());`, and paste the token from the debug log.

### Q: Why did an insert fail with `FIELD_INTEGRITY_EXCEPTION: State/Country`?
**A**: Your organization has Salesforce State and Country Picklists enabled.
- **Fix**: SF DataForge automatically handles this when address fields are in **Realistic (Smart)** mode! Ensure matching Country fields (`BillingCountryCode`, `MailingCountryCode`) are selected whenever a StateCode is selected.

### Q: Can I generate data for Custom Objects and Custom Fields?
**A**: Yes! SF DataForge dynamically discovers all custom objects (`*__c`) and custom fields (`*__c`, `*__s`). Select your custom object from the **Custom Objects** group in the dropdown.

### Q: Where do deleted records go?
**A**: Records deleted via the **Data Cleaner** are sent to your Salesforce **Recycle Bin**, where they remain recoverable for 15 days according to standard Salesforce retention policies.

---

## 9. Releasing Updates & Creating New Packages

This section outlines the standard operating procedure for rolling out new features, bug fixes, and security patches to users via the **Chrome Web Store**.

### 🏷️ Semantic Versioning Strategy
Follow standard Semantic Versioning (`MAJOR.MINOR.PATCH`):
- **PATCH** (`1.0.0` → `1.0.1`): Bug fixes, CSS styling updates, small UI tweaks, label adjustments.
- **MINOR** (`1.0.1` → `1.1.0`): New features, new field generator modes, new export formats, backward-compatible additions.
- **MAJOR** (`1.1.0` → `2.0.0`): Significant architectural changes or major platform redesigns.

---

### 📦 Step 1: Bump the Version Number

Whenever you prepare a release, update the version in two places:

1. **`manifest.json`** (required by Chrome Web Store):
   ```json
   {
     "manifest_version": 3,
     "name": "SF DataForge - Salesforce Test Data Generator",
     "version": "1.0.1",
     ...
   }
   ```
2. **`popup.html`** (user-facing badge under Settings > About):
   ```html
   <span>Version 1.0.1 (Manifest V3)</span>
   ```

---

### 🔨 Step 2: Build the Production Package

Run the automated packaging script from your terminal:

```bash
cd "/Users/sahildholpuria/Documents/SF Test Data Tool"
./scripts/package.sh
```

#### What `package.sh` Does Automatically:
1. Reads the current `"version"` string dynamically from `manifest.json`.
2. Creates the `dist/` output directory if it does not already exist.
3. Cleans up any prior zip with the same version name.
4. Strips OS metadata and hidden development files (`.DS_Store`, `__MACOSX`, `.git`).
5. Packages only the required production files:
   - `manifest.json`
   - `background.js`
   - `popup.html`, `popup.css`, `popup.js`
   - `icons/` (16, 32, 48, 128px pngs)
   - `src/` (`generatorEngine.js`, `salesforceService.js`, `storageService.js`)
6. Produces the final, clean store zip:
   ```
   dist/sf-dataforge-v1.0.1.zip
   ```

---

### 🧪 Step 3: Test the Unpacked Build Locally

Before submitting to Google, test the changes locally:
1. Open Chrome and navigate to `chrome://extensions`.
2. Click the **🔄 Refresh** icon on the **SF DataForge** card.
3. Open an active Salesforce tab.
4. Verify that:
   - New features and UI updates render properly.
   - Version number in **Settings** reflects the new version.
   - Data generation, picklist exploration, and bulk deletion function without console errors.

---

### 📤 Step 4: Upload to Chrome Web Store Developer Dashboard

1. Navigate to the **[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)**.
2. Select your extension: **SF DataForge - Salesforce Test Data Generator**.
3. In the left navigation menu, click **Package**.
4. Click the blue **Upload new package** button.
5. Select your newly generated zip:
   ```
   dist/sf-dataforge-v<VERSION>.zip
   ```
6. The dashboard will validate the manifest and display the updated version number.
7. *(Optional)* If you updated store copy, promotional images, or privacy disclosures, navigate to **Store listing** or **Privacy** to make adjustments.
8. Click **Submit for review** in the top right corner.

---

### ⏳ Step 5: Review & Automatic Rollout

- **Fast Review for Updates**: Minor and patch updates for existing, approved extensions are typically processed rapidly (often within 2 to 24 hours).
- **Zero Effort for Users**: Once Google approves the update, Chrome automatically pushes the new version to all active installations within a few hours. Users do not need to take any action!

