# Chrome Web Store Listing Package & Publisher Guide

Use the copy-paste content below when submitting **SF DataForge** to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).

---

## 📌 Section 1: Store Listing Details

### Extension Name
```
SF DataForge - Salesforce Test Data Generator & Cleaner
```

### Short Name (Header / Tooltip)
```
SF DataForge
```

### Version
```
1.0.0
```

### Summary / Short Description (Strict <= 132 character limit)
```
Generate realistic test data for any Salesforce object with full field control, plus bulk data inspection and cleanup.
```
*(Length: 118 characters — fully compliant with Chrome's 132-char maximum)*

### Developer Name
```
Sahil Dholpuria
```

### Category
```
Developer Tools
```

### Primary Language
```
English
```

---

## 📝 Section 2: Detailed Store Description

*Copy and paste the text below into the "Detailed description" field in the Developer Dashboard:*

```markdown
🚀 SF DataForge is the ultimate Chrome Extension for Salesforce Administrators, Developers, QA Engineers, and Consultants. 

Generate realistic, non-duplicate test data for ANY standard or custom Salesforce object, and easily inspect, filter, and bulk-delete records directly from your browser!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ KEY FEATURES AT A GLANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ANY SOBJECT SUPPORTED
• Standard Objects: Account, Contact, Lead, Opportunity, Case, Task, Event, and more.
• Custom Objects: Instant describe introspection for all custom objects (*__c).
• Custom Fields: Full support for custom picklists, text, numbers, formulas, and lookups.

🧠 DEEP SEMANTIC FIELD RECOGNITION
SF DataForge analyzes field API names and labels to generate contextually accurate data:
• Physical Addresses: Realistic street names, matching cities, valid 5-digit ZIP codes, and standard state codes (CA, NY, TX, US).
• Enterprise Financials: Realistic scaled annual revenues ($500k–$25M), compensation, item costs, and discount percentages.
• Smart Dates: Adult birthdates (22–62 yrs), realistic future target dates (+15 to +120 days), and past milestones.
• Identifiers: Masked SSN (XXX-XX-XXXX), Tax ID / EIN (XX-XXXXXXX), and tracking numbers.

🎲 ZERO DUPLICATE GUARANTEE
• Combinatorial Enterprise Names: 10,800+ permutations with unique numeric salts (e.g. "Quantum Dynamics Corp (842)").
• Realistic Names & Emails: Generates unique randomized emails (jane.doe.7492@sandbox.io) to eliminate Salesforce Duplicate Rule errors.
• Intra-Batch Deduplication: Tracks unique fields within batches to prevent collisions.

👁️ INTERACTIVE PICKLIST VALUES EXPLORER
• Automatically loads real, active picklist choices from your Salesforce org.
• Inline preview pills: Click any value directly in the table to lock it in.
• Picklist Explorer Modal: Search through picklist values or roll a random choice.
• State & Country Picklist compatibility: Guarantees active ISO state/country pairs, eliminating FIELD_INTEGRITY_EXCEPTION errors!

🧹 DATA CLEANER & BULK RECORD DELETION
• Live Total Org Count: Real-time SOQL count badge (SELECT count() FROM Object).
• Dynamic Field Inspection: Automatically detects the primary label field (Name, CaseNumber, Subject, Title, etc.).
• Filter Presets: All Records, Created Today, Created This Week, or Test Data Patterns.
• Multi-Record Selection: Select all or individual records with visual row highlighting.
• Safe Composite Batch Delete: Deletes records in chunks of up to 200 to your Salesforce Recycle Bin with explicit confirmation safeguards.

⚡ DIRECT SALESFORCE INSERTION & EXPORT
• 1-Click Insert: Uses the official Salesforce Composite SObject Collections REST API.
• Live progress modal with real-time status and error messages.
• Clickable record links that open created records directly in Salesforce!
• One-click download as CSV (Salesforce Data Loader ready) or JSON.

💾 PRESETS & GENERATION HISTORY
• Save complex multi-field configurations as named templates for 1-click reuse.
• Historical timeline logs past generation and deletion runs with Record IDs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 PRIVACY & SECURITY FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Strict Domain Isolation: Only executes on authorized Salesforce domains (*.salesforce.com, *.force.com).
• Zero Remote Telemetry: 100% client-side. Your credentials and data are NEVER sent to external servers.
• Manifest V3 CSP Hardened: Fully audited against SOQL injection, XSS, and insecure inline scripts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 HOW TO GET STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Install SF DataForge.
2. Open any tab in your Salesforce org.
3. Click the SF DataForge extension icon (or open in Chrome Side Panel).
4. Select your target object, configure your fields, and start generating or cleaning test data!

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
