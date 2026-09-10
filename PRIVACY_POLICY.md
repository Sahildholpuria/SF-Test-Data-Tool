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

## 6. Security

SF DataForge is engineered to enterprise security standards:
- Fully compliant with **Chrome Manifest V3** Content Security Policies.
- Enforces strict input validation to prevent SOQL injection and Cross-Site Scripting (XSS).
- Uses encrypted HTTPS connections for all Salesforce API communications.

---

## 7. Contact & Inquiries

If you have questions regarding this Privacy Policy or the security practices of SF DataForge, please contact:

- **Developer**: Sahil Dholpuria
- **Email**: dholpuria1999@gmail.com
- **Repository**: [https://github.com/sahildholpuria/SF-Test-Data-Tool](https://github.com/sahildholpuria/SF-Test-Data-Tool)
