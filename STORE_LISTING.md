# Chrome Web Store Listing Package & Publisher Guide

Use the copy-paste content below when submitting **SF DataForge** to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).

---

## 📌 Section 1: Store Listing Details

### Extension Name (Max 75 chars — Search Engine Optimized)
```
SF DataForge - Salesforce (SF) Test Data Generator & Cleaner
```
*(Length: 60 characters — includes primary search triggers: "Salesforce", "SF", "Test Data Generator", "Cleaner")*

### Short Name (Header / Tooltip, Max 45 chars)
```
SF DataForge
```

### Version
```
1.0.1
```

### Summary / Short Description (Strict <= 132 character limit)
```
The ultimate Salesforce (SF) extension to generate realistic test data, explore picklists, and bulk-clean records in Lightning.
```
*(Length: 125 characters — fully compliant with Chrome's 132-char maximum)*

### Developer Name
```
Sahil Dholpuria
```

### Category
```
Developer Tools (or Productivity)
```

### Primary Language
```
English
```

---

## 📝 Section 2: Detailed Store Description

*Copy and paste the text below into the "Detailed description" field in the Developer Dashboard:*

```markdown
SF DataForge is a powerful productivity extension designed for Salesforce Administrators, Developers, and QA Teams to streamline test data workflows and sandbox management.

Whether validating validation rules, testing automated flows, conducting user acceptance testing (UAT), or cleaning up test records, SF DataForge enables you to create realistic mock data and perform bulk record cleanups directly from your browser.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 COMPREHENSIVE SOBJECT SUPPORT
• Full compatibility with standard objects (such as Account, Contact, Lead, Opportunity, and Case) as well as any custom object (*__c).
• Automatic schema discovery: detects field types, required fields, and active picklist definitions directly from your org.
• Custom field support: configure generation rules for text, numbers, dates, formulas, and lookups.

🧠 CONTEXTUAL SMART FIELD RECOGNITION
• Physical Addresses: Generates coherent address clusters (matching street, city, state, and postal code).
• Financials & Numeric Ranges: Generates scaled revenue, prices, employee counts, and percentages.
• Date Scheduling: Generates realistic birthdates, future close dates, and historical timestamps.
• Formatted Identifiers: Generates realistic order numbers, tax identifiers, and tracking codes.

🎲 NON-DUPLICATE RECORD GENERATION
• Combinatorial name generator ensures uniqueness across records.
• Generates unique randomized emails and phone numbers to avoid triggering Salesforce Duplicate Rules.
• Intra-batch tracking prevents record collisions during generation.

👁️ INTERACTIVE PICKLIST EXPLORER
• Inspect real active picklist values loaded directly from your org.
• Preview values as interactive pills in the field configuration table.
• Dedicated picklist modal allows searching or selecting random active entries.
• Fully compatible with State and Country picklists.

🧹 DATA CLEANER & BULK RECORD DELETION
• Live record counter displays the total number of records in your org for the selected object.
• Dynamic display field detection shows primary record labels for easy identification.
• Multi-record selection allows selecting all or specific records with visual highlighting.
• Safe composite deletion moves records to your Salesforce Recycle Bin with confirmation prompts.

⚡ DIRECT SALESFORCE INTEGRATION & EXPORT
• Fast batch creation using the official Salesforce Composite SObject Collections REST API.
• Live progress window showing real-time batch insertion status.
• Clickable record ID links open newly created records directly in your Salesforce tab.
• One-click export to CSV or JSON formats for offline analysis.

🎨 CLEAN LIGHT & DARK THEMES
• Modern interface inspired by the Salesforce Lightning Design System.
• Quick theme switcher in the header to alternate between Clean Light and Dark modes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 PRIVACY & SECURITY FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Strict Domain Isolation: Only executes within authorized Salesforce domains.
• 100% Client-Side: Operates entirely in your browser; your credentials and org data are never transmitted to external servers.
• Manifest V3 Compliant: Fully audited against cross-site scripting and unauthorized data access.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 GETTING STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Install SF DataForge from the Chrome Web Store.
2. Open any active Salesforce tab in your browser.
3. Click the SF DataForge extension icon in the toolbar or open it in the Chrome Side Panel.
4. Choose an object, customize your field rules, and generate or clean your records.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💻 DEVELOPER & SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developed by Sahil Dholpuria for the global Salesforce community.
```

---

## 🛡️ Section 3: Privacy Practices Tab Declarations

*Google requires explicit justifications for every permission requested by the extension. Copy and paste these exact responses:*

### Single Purpose Description
```
SF DataForge is a specialized developer tool with the single purpose of allowing Salesforce administrators, developers, and QA engineers to generate mock test records and perform bulk record cleanup directly within their authorized Salesforce organizations.
```

### Permission Justifications

#### 1. `cookies`
```
Required to read the authenticated session cookie ('sid') from the user's active Salesforce browser tab so the extension can automatically connect to the Salesforce REST API without requiring the user to manually copy and paste tokens.
```

#### 2. `storage`
```
Required to persist user-defined field configuration templates, generation history, and settings locally on the user's computer using chrome.storage.local.
```

#### 3. `activeTab`
```
Required to verify that the user's active browser tab is an authorized Salesforce domain before initiating any connection or API requests.
```

#### 4. `tabs`
```
Required to detect when the user switches tabs, update the extension's active Salesforce indicator badge, and allow 1-click switching to open Salesforce tabs.
```

#### 5. `sidePanel`
```
Required to allow the user to open the extension inside Google Chrome's native Side Panel, enabling a docked side-by-side workflow alongside Salesforce records.
```

#### 6. Host Permissions (`https://*.salesforce.com/*`, `https://*.force.com/*`, etc.)
```
Required to communicate directly with the user's authenticated Salesforce organization REST API endpoints (/services/data/v60.0/) for schema describe metadata, record batch creation, and record deletion.
```

### Data Usage Declarations (Checkboxes in Developer Console)
- **Do you collect personal data?** → **No** (The extension does not collect or transmit user data to external servers).
- **Authentication information** → Check: **Yes**, used solely to authenticate API requests directly to the user's designated Salesforce instance. Not stored on external servers.
- **Data transfer** → Select: **"I certify that my extension does not sell user data, does not use or transfer user data for purposes unrelated to the extension's core functionality, and does not use or transfer user data for creditworthiness or lending purposes."**

### Privacy Policy URL
```
https://your-username.github.io/sf-test-data-tool/privacy_policy.html
```
*(Or link to your hosted PRIVACY_POLICY.md on GitHub)*

---

## 🎨 Section 4: Required Store Graphics & Assets

| Asset Type | Required Dimensions | Format | Notes |
|---|---|---|---|
| **Store Icon** | 128 x 128 px | PNG | Located at `icons/icon128.png` |
| **Small Promo Tile** | 440 x 280 px | PNG / JPEG | Located at `promo/promo_small_440x280.png` |
| **Marquee Promo Tile** | 1400 x 560 px | PNG / JPEG | Located at `promo/promo_marquee_1400x560.png` |
| **Screenshot 1 (Generator)** | 1280 x 800 px (or 640 x 400) | PNG | Generator Tab with fields & preview |
| **Screenshot 2 (Data Cleaner)**| 1280 x 800 px (or 640 x 400) | PNG | Data Cleaner Tab with total count & deletion |
| **Screenshot 3 (Picklist)** | 1280 x 800 px (or 640 x 400) | PNG | Picklist Explorer & Addresses |

---

## 📦 Section 5: Packaging for Upload

A clean production ZIP file has been created at:
```
dist/sf-dataforge-v1.0.0.zip
```
This package excludes all development scratch files, test scripts, and internal documentation, containing strictly the Manifest V3 production bundle ready for instant Chrome Web Store review.
