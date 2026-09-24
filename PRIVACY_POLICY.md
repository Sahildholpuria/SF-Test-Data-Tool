# Privacy Policy for SF DataForge

**Last Updated**: September 2026  
**Extension**: SF DataForge - Salesforce Test Data Generator & Cleaner  
**Developer & Data Controller**: Sahil Dholpuria  

---

## 1. Overview

**SF DataForge** ("we", "our", or "the extension") is a developer tool designed to assist Salesforce professionals in generating realistic test data and managing data cleanup within their authorized Salesforce organizations.

We are committed to user privacy. **SF DataForge does not collect, track, transmit, or sell any personal data, Salesforce data, or browsing history to external servers or third parties.** All operations are performed locally within your browser directly against your authorized Salesforce environment.

---

## 2. Information We Access and Process

To function as a Salesforce productivity tool, SF DataForge accesses the following information locally on your device:

### A. Salesforce Session & Authentication Data
- **What We Access**: The authenticated session cookie (`sid`) or user-supplied access token for your active Salesforce tab.
- **Why We Access It**: To authenticate API calls to your Salesforce organization's REST API (`/services/data/v60.0/`) for schema inspection, test record insertion, and record deletion.
- **How It Is Handled**: 
  - Automatically discovered session cookies are held in memory during the browser session and used solely to construct standard `Authorization: Bearer <token>` headers.
  - Manual tokens are stored locally within the browser's sandboxed storage (`chrome.storage.local`).
  - **No credentials or tokens are ever sent to any server other than your designated Salesforce instance.**

### B. Salesforce Schema & Metadata
- **What We Access**: Standard describe metadata (object labels, field names, data types, picklist choices, validation rules).
- **Why We Access It**: To dynamically generate accurate fields, format picklist values, and construct valid API payloads.
- **How It Is Handled**: Processed entirely in client-side memory to render the field configuration interface.

### C. Generated Test Data & Deletion Requests
- **What We Process**: Synthetic test data (names, simulated addresses, numbers, picklist selections) created by the user.
- **How It Is Handled**: Transmitted directly to your Salesforce instance via the official Salesforce Composite REST API. Record IDs returned by Salesforce are displayed in your browser and optionally stored in local generation history.

---

## 3. Chrome Extension Permissions Justification

In compliance with the Chrome Web Store Developer Program Policies, SF DataForge requests only the minimum permissions necessary:

| Permission | Purpose |
|---|---|
| `cookies` | Required to read the active Salesforce session cookie (`sid`) from your authorized Salesforce domain so you do not need to manually generate and paste tokens. |
| `storage` | Used exclusively to persist your custom field templates, saved presets, and generation history locally on your device. |
| `activeTab` | Used to verify that your active browser tab is an authorized Salesforce domain before initiating connections. |
| `tabs` | Used to detect tab navigation, update the icon status badge, and allow 1-click switching to open Salesforce tabs. |
| `sidePanel` | Allows the extension to open in Google Chrome's native side panel for a docked, side-by-side workflow alongside Salesforce records. |
| `host_permissions` (`https://*.salesforce.com/*`, etc.) | Required to send HTTP requests directly to your Salesforce instance REST APIs for schema describe, record creation, and record deletion. |

---

## 4. Data Storage & Retention

- **Local Storage Only**: All user configurations, saved field templates, and generation logs are stored strictly on your local machine using Chrome's built-in `chrome.storage.local` API.
- **No Remote Databases**: We do not maintain any cloud databases, telemetry backends, user tracking services, or external analytics (e.g. Google Analytics or Mixpanel).
- **User Control & Deletion**: You can permanently purge all stored templates, tokens, and history at any time by clicking the **"Reset Storage"** button in the extension's Settings tab, or by uninstalling the extension.

---

## 5. Third-Party Sharing

We **do not**:
- Sell, rent, or trade any user information.
- Share data with advertising platforms or data brokers.
- Transmit any customer data or Salesforce records to third parties.

All network requests made by the extension are directed **strictly and exclusively** to your own Salesforce domain (`*.salesforce.com`, `*.force.com`, `*.cloudforce.com`).

---

## 6. Limited Use Policy & Chrome Web Store Compliance

**The use of information received from Google APIs will adhere to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the Limited Use requirements.**

Specifically, SF DataForge affirms that:
1. **Single Purpose Restriction**: Data accessed through Chrome APIs is used solely to provide and improve the user-facing test data generation and data cleanup features disclosed in our documentation.
2. **No Data Transfers**: We do not transfer or sell user data to any third party, advertising network, data broker, or information reseller.
3. **No Advertising**: User data is never used or transferred for personalized advertising, retargeting, or interest-based profiling.
4. **No Creditworthiness Evaluation**: User data is never used or transferred to determine creditworthiness or for lending purposes.
5. **No Human Access**: We do not permit humans to read user data. All operations, schema analyses, and token handshakes occur programmatically and locally within the user's browser runtime.

---

## 7. Security

SF DataForge is engineered to enterprise security standards:
- Fully compliant with **Chrome Manifest V3** Content Security Policies (`script-src 'self'; object-src 'none'; base-uri 'self'`).
- Enforces strict input validation to prevent SOQL injection and Cross-Site Scripting (XSS).
- Uses encrypted HTTPS connections exclusively for all direct Salesforce REST API communications.
- Contains zero remote script tags, zero external CDN dependencies, and zero dynamic code execution (`eval()` or `new Function()`).

---

## 8. Trademark Disclaimer

Salesforce, Sales Cloud, Service Cloud, Lightning, and other Salesforce marks are registered trademarks of Salesforce, Inc. 

**SF DataForge is an independent productivity extension created by Sahil Dholpuria and is not produced, affiliated with, sponsored by, or endorsed by Salesforce, Inc.**

---

## 9. Contact & Inquiries

If you have questions regarding this Privacy Policy or the security practices of SF DataForge, please contact:

- **Developer**: Sahil Dholpuria
- **Email**: dholpuria1999@gmail.com
- **Repository**: [https://github.com/sahildholpuria/SF-Test-Data-Tool](https://github.com/sahildholpuria/SF-Test-Data-Tool)
