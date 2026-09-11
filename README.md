# ⚡ SF DataForge — Salesforce Test Data Generator & Data Cleaner

[![Chrome Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Salesforce API](https://img.shields.io/badge/Salesforce_REST_API-v60.0-00A1E0?logo=salesforce&logoColor=white)](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm)
[![Zero Duplicates](https://img.shields.io/badge/Generation_Engine-Zero_Duplicates-059669?logo=checkmarx&logoColor=white)]()
[![Security Audited](https://img.shields.io/badge/Security-Audited_%26_Hardened-7C3AED?logo=auth0&logoColor=white)]()

A modern, high-performance **Manifest V3 Chrome Extension** designed for Salesforce Admins, Developers, QA Engineers, and Consultants. Generate realistic, non-duplicate test data for **any** standard or custom Salesforce object with deep semantic field recognition, and clean, inspect, and bulk-delete records directly from your browser.

---

## 🌟 Key Capabilities

### 1. 🎲 Smart Test Data Generator (Any SObject)
- **Standard & Custom Objects**: Full support for `Account`, `Contact`, `Lead`, `Opportunity`, `Case`, and custom objects (`*__c`).
- **Zero-Duplicate Combinatorial Engine**: Uses 10,800+ adjective/noun permutations, unique numeric salts, and intra-batch collision tracking so successive runs never trigger Salesforce Duplicate Rules.
- **Deep Semantic Field Recognition**: Analyzes field API names and labels to generate context-perfect data (e.g. enterprise revenue, adult birthdates, future close dates, tax IDs, SIC codes).
- **Interactive Picklist Values Explorer**: Inspect active picklist values from your org, preview choices as clickable inline pills, and filter values with 1 click.
- **Geographic Address Coherence**: Generates matching physical addresses across 20 major US metropolitan areas with valid 5-digit ZIP codes and ISO state/country codes (`CA`, `NY`, `TX`, `US`), completely eliminating `FIELD_INTEGRITY_EXCEPTION` errors.
- **Direct Salesforce Insertion**: Batches records using Salesforce's Composite SObject Collections REST API (`POST /services/data/v60.0/composite/sobjects`) with live progress and clickable record links.
- **Data Export**: Export generated datasets as **CSV** (Salesforce Data Loader ready) or **JSON**.

### 2. 🧹 Data Cleaner & Bulk Record Deletion
- **Live Total in Org**: Real-time SOQL count badge (`SELECT count() FROM Object`) displaying the total number of records currently in Salesforce.
- **Dynamic Display Fields**: Automatically identifies the primary label field (`Name`, `CaseNumber`, `Subject`, `Title`, `DeveloperName`, etc.) for any object.
- **Flexible Multi-Record Selection**: Select records individually, by filter, or all together via the tri-state header checkbox.
- **Filter Presets & Instant Search**: Filter by `All Records`, `Created Today`, `Created This Week`, or `Test Data Patterns`, with instant client-side search.
- **Composite Batch Delete**: Moves records in batches of up to 200 to the Salesforce **Recycle Bin** via the Composite API.
- **Confirmation Safeguards**: Danger-themed confirmation modal with record count warnings and cascading delete reminders.

### 3. 🛡️ Enterprise Security & Strict Domain Isolation
- **Salesforce-Only Barrier**: Active tab verification restricts execution exclusively to Salesforce domains (`*.salesforce.com`, `*.force.com`, `*.site.com`, etc.).
- **Multi-Tab Org Detection**: Automatically detects open Salesforce tabs across other windows with 1-click switching.
- **Manifest V3 CSP Hardened**: Zero inline event handlers (`onclick`), fully strict Content Security Policy, and defensive DOM escaping.
- **SOQL Injection Defense**: Whitelist validation on all SObject names (`/^[a-zA-Z0-9_]+$/`) and field identifiers.

---

## 🚀 Quickstart & Installation

1. Clone or download this repository to your computer:
   ```bash
   git clone https://github.com/your-repo/sf-dataforge.git
   ```
2. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions
   ```
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner and select the project folder:
   ```
   /Users/sahildholpuria/Documents/SF Test Data Tool
   ```
5. Open your Salesforce org in a browser tab.
6. Click the **SF DataForge** extension icon in your Chrome toolbar to begin!

> **Pro Tip**: Right-click the extension icon and select **Open side panel** to dock SF DataForge side-by-side with your Salesforce workspace!

---

## 📖 Feature Comparison

| Feature | SF DataForge | Standard Data Loader | Mockaroo / Scripts |
|---|:---:|:---:|:---:|
| Runs inside Chrome directly on active tab | ✅ Yes | ❌ No (Desktop App) | ❌ No (External Site) |
| Dynamic Schema Describe from Org | ✅ Live API | ❌ Manual Mapping | ❌ Manual Entry |
| Non-Duplicate Combinatorial Generation | ✅ Built-in | ❌ No | ⚠️ Partial |
| State/Country Picklist Coherence | ✅ Automatic | ❌ Manual | ❌ Manual |
| Direct 1-Click Salesforce Insertion | ✅ Composite API | ⚠️ CSV Upload | ❌ Manual Import |
| Live Org Record Count & Cleaner | ✅ Real-time SOQL | ❌ Manual Queries | ❌ No |
| Recycle Bin Safe Batch Deletion | ✅ Built-in | ⚠️ Complex Setup | ❌ No |
| Offline Sandbox / Demo Mode | ✅ Built-in | ❌ No | ❌ No |

---

## 🧩 Dynamic Pattern Tokens

When choosing the **Pattern / Formula** mode on text fields, you can use the following tokens:

| Token | Description | Example Output |
|---|---|---|
| `{{batch}}` | Unique 6-character batch code | `B7X2K9` |
| `{{index}}` | 1-based record index | `1`, `2`, `3` |
| `{{seq:1000}}` | Sequential counter starting from N | `1000`, `1001`, `1002` |
| `{{random}}` | 6-digit random number | `849201` |
| `{{random:4}}` | N-digit random number | `0381` |
| `{{date}}` | Current date (`YYYY-MM-DD`) | `2026-09-09` |
| `{{timestamp}}` | Unix millisecond timestamp | `1788954200000` |
| `{{uuid}}` | Short random UUID | `a3f9-4b21-9e12` |

---

## 📁 Repository Structure

```
SF Test Data Tool/
├── manifest.json              # Chrome Manifest V3 configuration & CSP
├── background.js              # Service worker (session discovery & proxy)
├── popup.html                 # Main extension UI markup
├── popup.css                  # Dark glassmorphic design system
├── popup.js                   # Application controller & event management
├── icons/                     # Extension branding icons (16px, 32px, 48px, 128px)
├── DOCUMENTATION.md           # Comprehensive feature & technical guide
├── src/
│   └── services/
│       ├── generatorEngine.js # Smart data generator & address cluster algorithm
│       ├── salesforceService.js # REST API client, SOQL count, describe, & composite batch
│       └── storageService.js  # Persistence manager for presets & history
└── test/
    └── generatorEngine.test.js # Test suite
```

---

## 📦 Packaging & Releasing Updates

To build a production zip bundle ready for the **Chrome Web Store Developer Dashboard**:

1. Bump `"version"` in [`manifest.json`](manifest.json) and [`popup.html`](popup.html).
2. Run the packaging script:
   ```bash
   ./scripts/package.sh
   ```
3. Upload the generated zip file from `dist/sf-dataforge-v<VERSION>.zip` directly to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).

For the complete release lifecycle guide, see [Section 9 in DOCUMENTATION.md](DOCUMENTATION.md#9-releasing-updates--creating-new-packages).

---

## 📚 Complete Documentation

For detailed technical explanations, address clustering algorithms, picklist explorer guides, and troubleshooting FAQs, see:
👉 [**DOCUMENTATION.md**](DOCUMENTATION.md)

---

## 👨‍💻 Author & Developer

Created and maintained with precision by **Sahil Dholpuria**.
- **GitHub**: [@sahildholpuria](https://github.com/sahildholpuria)
- **Email**: dholpuria1999@gmail.com

---

## 📄 License

MIT License — free for personal, commercial, and enterprise Salesforce consulting use. Copyright © 2026 Sahil Dholpuria.
