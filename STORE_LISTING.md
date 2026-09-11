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
⚡ Looking for the ultimate Salesforce extension to generate mock test data, inspect schemas, or bulk-clean records in seconds?

SF DataForge is the essential Chrome extension built for Salesforce Administrators, Developers, QA Engineers, and Consultants. Whether you are validating validation rules, configuring flows, conducting user acceptance testing (UAT), or cleaning up sandbox data, SF DataForge automates your entire test data lifecycle right from your active Salesforce Lightning tab.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ WHY SALESFORCE PROFESSIONALS CHOOSE SF DATAFORGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 SUPPORTS ANY SALESFORCE OBJECT (STANDARD & CUSTOM)
• Standard SObjects: Account, Contact, Lead, Opportunity, Case, Task, Event, Product, Asset, Contract, and more.
• Custom SObjects (*__c): Automatic instant describe metadata discovery for every custom object in your org.
• Custom Fields: Full field-level control over custom picklists, text, numbers, dates, formulas, and lookups.

🧠 DEEP SEMANTIC FIELD RECOGNITION
SF DataForge analyzes field API names and business labels to automatically generate contextually accurate data:
• Physical Addresses: Coherent US street names, matching cities, valid 5-digit ZIP codes, and standard state codes (CA, NY, TX, etc.).
• Enterprise Financials: Realistic scaled annual revenues ($500k–$25M), compensation, unit costs, and discount percentages.
• Realistic Dates: Adult birthdates (22–62 yrs), realistic future target dates (+15 to +120 days), and past milestones.
• Identifiers & Codes: Masked SSN (XXX-XX-XXXX), Tax ID / EIN (XX-XXXXXXX), PO numbers, and tracking IDs.

🎲 ZERO-DUPLICATE COMBINATORIAL ENGINE
• Enterprise Names: 10,800+ adjective/noun permutations with unique numeric salts (e.g. "Quantum Dynamics Corp (842)").
• Realistic Names & Emails: Generates unique randomized emails (jane.doe.7492@sandbox.io) to completely eliminate Salesforce Duplicate Rule errors.
• Intra-Batch Deduplication: Guarantees zero collisions within batches.

👁️ INTERACTIVE PICKLIST VALUES EXPLORER
• Automatically loads real, active picklist choices from your active Salesforce org.
• Inline preview pills: Click any value directly in the table to lock it in.
• Picklist Explorer Modal: Search through picklist values or roll a random choice.
• State & Country Picklist compatibility: Guarantees active ISO state/country pairs, eliminating FIELD_INTEGRITY_EXCEPTION errors!

🧹 DATA CLEANER & BULK RECORD DELETION
• Live Total in Org: Real-time SOQL count badge (SELECT count() FROM SObject).
• Dynamic Field Inspection: Automatically detects the primary label field (Name, CaseNumber, Subject, Title, etc.).
• Quick Filter Presets: All Records, Created Today, Created This Week, or Test Data Patterns.
• Multi-Record Selection: Select all or individual records with visual row highlighting.
• Safe Composite Batch Delete: Deletes records in chunks of up to 200 directly to your Salesforce Recycle Bin with confirmation safeguards.

⚡ DIRECT SALESFORCE INSERTION & EXPORT
• 1-Click Insert: Direct insertion via the official Salesforce Composite SObject Collections REST API (v60.0).
• Live progress modal with real-time status and error messages.
• Clickable record links that open created records directly in your Salesforce tab!
• One-click export as CSV (Salesforce Data Loader ready) or JSON.

🎨 SIMPLE, CLEAN & MODERN THEME (LIGHT & DARK)
• Beautiful interface inspired by the Salesforce Lightning Design System (SLDS).
• 1-Click Theme Switcher (☀️ Light / 🌙 Dark) with persistent preferences.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 THE PERFECT COMPANION TO YOUR SALESFORCE TOOLBELT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SF DataForge seamlessly complements your favorite Salesforce tools:
• Salesforce Inspector & Salesforce Inspector Reloaded
• Salesforce DevTools & ORGanizer for Salesforce
• Salesforce Data Loader & Workbench
• Salesforce Developer Console & VS Code Extensions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 PRIVACY & SECURITY FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Strict Domain Isolation: Only executes on authorized Salesforce domains (*.salesforce.com, *.force.com).
• Zero Remote Telemetry: 100% client-side execution. Your credentials and Salesforce data are NEVER sent to third-party servers.
• Manifest V3 CSP Hardened: Audited against SOQL injection, XSS, and insecure scripts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 HOW TO GET STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Install SF DataForge from the Chrome Web Store.
2. Open any tab in your Salesforce org (Lightning or Classic).
3. Click the SF DataForge extension icon (or open in Chrome Side Panel).
4. Select your target object, configure your fields, and start generating or cleaning test data!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 FREQUENTLY SEARCHED KEYWORDS / TAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Salesforce, SF, Salesforce Extension, Salesforce Test Data, Salesforce Mock Data, Salesforce Data Generator, Salesforce Data Cleaner, Salesforce Inspector, Salesforce Data Loader, Salesforce Bulk Delete, SOQL, SObject, Lightning Experience, Salesforce Developer, Salesforce Admin, Salesforce QA, Trailhead, Salesforce Tools.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💻 DEVELOPER & SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developed with precision by Sahil Dholpuria for the global Salesforce community.
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
