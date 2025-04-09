# Fake AdBlocker - Advanced Banking Form Attack Demonstration

## 📋 Table of Contents
- [Introduction](#introduction)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Detailed Testing Instructions](#detailed-testing-instructions)
- [Attack Verification](#attack-verification)
- [Security and Countermeasures](#security-and-countermeasures)
- [Project Structure](#project-structure)
- [Attack Scenarios](#attack-scenarios)
- [FAQ and Troubleshooting](#faq-and-troubleshooting)
- [Technical Aspects](#technical-aspects)
- [Legal Information](#legal-information)
- [Documentation](#documentation)

## 📚 Introduction

This project was created as part of the "Introduction to Computer Security" course at the University of Wrocław. It demonstrates an advanced attack that involves replacing bank account numbers in online transfer forms while hiding this manipulation from the user.

The attack uses a browser extension that pretends to be a popular ad blocker ("AdGuard Free"). This camouflage technique increases the chances that a user will voluntarily install malicious software.

**⚠️ WARNING: This project is for educational purposes only!**

## ⚙️ How It Works

The extension uses several techniques to conduct an effective attack:

1. **Banking form recognition** - the script analyzes the DOM structure of the page looking for characteristic fields with account numbers
2. **Data interception** - the script saves the original account number entered by the user
3. **Data modification** - when the form is submitted, the account number is replaced with the attacker's number
4. **Attack concealment** - by observing changes in the DOM, the script restores the original account number in the user interface
5. **Camouflage** - the extension pretends to be a legitimate application, generating fictitious ad-blocking statistics

## 💾 Installation

### Prerequisites
- Chromium-based browser (Chrome, Edge, Opera, Brave)
- Local HTTP server for testing the demo (optional)

### Extension Installation
1. Clone the repository or download it as a ZIP and extract it
2. Open your browser and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right corner)
4. Click "Load unpacked" and select the `/extension` folder from the project
5. The extension should appear in the list and be active

### Preparing the Test Environment
1. Open the `/demo/demo.html` file directly in your browser or
2. Run a local HTTP server (e.g., using `python -m http.server` or Live Server in VS Code)
3. Make sure the extension is enabled and shows "Active" status

## 🧪 Detailed Testing Instructions

### 1. Preparing the Test Environment

#### 1.1. Extension Installation
1. Open Chrome/Edge/Opera/Brave browser
2. Go to `chrome://extensions/` (or equivalent in your browser)
3. In the top right corner, enable "Developer mode"
4. Click "Load unpacked"
5. Select the `/extension` folder from the project
6. Make sure the extension appears in the list and is active (the toggle should be in the ON position)
7. Click the extension icon in the toolbar to check if the interface shows up

#### 1.2. Preparing the Demo Page
1. Open the `/demo` folder in the project
2. Open the `demo.html` file directly in your browser (by double-clicking or dragging to the browser window)
   - Alternatively: run a local HTTP server (e.g., `python -m http.server` from the `/demo` folder and go to `http://localhost:8000/demo.html`)
3. Make sure the bank demo page loads correctly and you can see the transfer form

#### 1.3. Preparing Developer Tools
1. Open developer tools in your browser (F12 or Ctrl+Shift+I or right-click -> Inspect)
2. Go to the "Console" tab
3. Make sure the console is clear (no errors) - you can click the "Clear console" icon if there are any messages

### 2. Basic Test Run

#### 2.1. Filling Out the Transfer Form
1. On the demo page, fill out all required fields:
   - **Recipient name**: e.g., "John Smith"
   - **Recipient account number**: e.g., "11223344556677889900112233" (enter 26 digits)
   - **Amount**: e.g., "100.00" (must be less than 8542.65)
   - **Transfer title**: e.g., "Testing account number replacement"

2. **IMPORTANT**: Remember or write down the account number you entered - you'll need it for verification

#### 2.2. Proceeding to Confirmation
1. Click the "Next" button
2. A transfer confirmation screen will appear
3. Check the displayed account number - it should be THE SAME as the one you entered (this is part of the attack camouflage)

#### 2.3. Executing the Transfer and Verification
1. Open the developer console (F12), if it's not already open
2. Type the following code into the console and press Enter:
   ```javascript
   console.log("Number displayed to user:", document.getElementById("summary-account").textContent);
   console.log("Number actually being sent:", document.getElementById("accountNumber").value);
   ```
3. Notice that the numbers are different:
   - The displayed number is the one you entered
   - The number actually being sent is the attacker's number (default: "12345678901234567890123456")
   
4. Click "Execute Transfer"
5. After proceeding to the confirmation screen, you can verify the substitution again:
   ```javascript
   document.getElementById('attack-demonstration-marker').getAttribute('data-displayed-account');
   document.getElementById('attack-demonstration-marker').getAttribute('data-submitted-account');
   ```

### 3. Various Test Scenarios

#### 3.1. Test with Extension Disabled
1. Go to `chrome://extensions/` and disable the extension (toggle to OFF)
2. Refresh the demo page
3. Fill out the form again and proceed to confirmation
4. Check the account numbers in the console - they should be identical (no substitution occurred)

#### 3.2. Test with Target Number Modification
1. Re-enable the extension
2. Click the extension icon in the toolbar
3. In the hidden field (you can reveal it through the developer console), change the target number
   ```javascript
   document.getElementById('targetAccountInput').style.display = 'block';
   document.getElementById('targetAccountInput').value = "99887766554433221100998877";
   ```
4. Click "Save changes"
5. Test the form again - the substitution should now use the new number

#### 3.3. Test with Different Form Types
1. Try different formats for entering the account number:
   - With hyphens (11-2233-4455-...)
   - With spaces (11 2233 4455...)
   - Continuous string of digits (11223344...)
2. The substitution mechanism should work in each case

### 4. Advanced Verification

#### 4.1. Tracking Data Flow in Real-time
1. Open developer tools (F12)
2. Go to the "Sources" tab
3. Find the `content.js` file (in the content scripts section)
4. Set a breakpoint in the function handling the "submit" event:
   ```javascript
   document.addEventListener('submit', function(e) {
   ```
5. Fill out the form and click "Next"
6. The debugger will stop at the breakpoint
7. You can step through the code and observe:
   - Storage of the original number
   - Change of the form field value
   - DOM observer operation

#### 4.2. Hidden DOM Elements Analysis
The attack adds a hidden marker to the page. To find it:
1. After running the test, type in the console:
   ```javascript
   document.getElementById('security-marker')
   ```
2. Expand the object and check its attributes:
   - `data-original` - original account number
   - `data-changed-to` - account number after substitution

#### 4.3. Visual Analysis of MutationObserver
To better understand how the substitution concealment mechanism works:
1. On the confirmation screen, type in the console:
   ```javascript
   // Temporarily show both numbers on screen for demonstration
   document.getElementById('summary-account').innerHTML = `
     <div style="color:green">Displayed: ${document.getElementById('summary-account').textContent}</div>
     <div style="color:red; margin-top:5px">Actual: ${document.getElementById('accountNumber').value}</div>
   `;
   ```
2. Observe how the red text disappears after a few milliseconds - this is the effect of MutationObserver restoring the original number!
3. Repeat the operation with the extension disabled - this time the red text will remain visible

### 5. Troubleshooting Common Issues

#### Problem: Extension doesn't work
1. Check if it was properly installed and is enabled
2. In developer tools, go to the "Console" tab and check for errors
3. Try disabling and re-enabling the extension
4. Check if you have other script blockers enabled (e.g., uBlock Origin)

#### Problem: Substitution doesn't occur
1. Make sure you're entering the account number in a format accepted by the demo
2. Check for errors in the console
3. Verify if the form field has the correct ID/name containing "account" or "konto"
4. As a last resort, refresh the page and try again

#### Problem: Account number displays incorrectly
1. Make sure you're using the latest version of your browser
2. Check if MutationObserver is working correctly:
   ```javascript
   // Check if the observer was created
   document.querySelectorAll('*').length; // Should return a value > 0
   ```

## 🔍 Attack Verification After Enabling a Previously Disabled Extension
1. If you enabled the extension when the demo page was already open, **you need to refresh the page**
2. Refresh the page (F5) after enabling the extension so that the substitution script runs correctly

### Method 1: DOM Inspection
1. On the transfer confirmation page, open developer tools (F12)
2. In the Elements tab, locate the `<input id="accountNumber">` field
3. Check the value of the `value` attribute - it should be the substituted value
4. At the same time, check the `<td id="summary-account">` element - it should contain the original number

```javascript
// Type in console to see both numbers:
console.log("Displayed number: " + document.getElementById("summary-account").innerText);
console.log("Sent number: " + document.getElementById("accountNumber").value);
```

### Method 2: Attack Marker
On the confirmation or success screen, type in the console:
```javascript
const marker = document.getElementById("attack-demonstration-marker");
console.table({
  "Number displayed to user": marker.getAttribute("data-displayed-account"),
  "Number actually being sent": marker.getAttribute("data-submitted-account")
});
```

### Method 3: Browser Storage
1. Open developer tools (F12)
2. Go to the "Application" > "Storage" > "Local Storage" tab
3. Check the saved original account number:

```javascript
chrome.storage.local.get(['originalAccount'], function(result) {
  console.log("Original account number:", result.originalAccount);
});
```

### Method 4: Real-time Debugging
1. Open the `content.js` file through DevTools > Sources
2. Set a breakpoint in the function handling the `submit` event
3. Execute the transfer again and step through the substitution process

### Demonstration Without Page Refresh

To demonstrate the extension's functionality without refreshing the page:

1. Open the demo page with the extension disabled
2. Go through the form, check the console - numbers are identical (no substitution)
3. On the last screen, enable the extension (in the extensions panel)
4. Click "Make a new transfer"
5. Fill out the form again and check the console - this time the numbers will be different

**Note:** In some Chrome versions, it may be necessary to refresh the page after enabling the extension. In such cases, the demonstration should be done using two browser tabs.

## 🔒 Security and Countermeasures

To protect yourself against such attacks:

1. **For users:**
   - Install extensions only from official sources (Chrome Web Store, Firefox Add-ons)
   - Regularly review installed extensions and remove unnecessary ones
   - Use two-factor authentication (2FA) for transfers
   - Check account numbers across multiple devices or channels
  
2. **For banks:**
   - Implement dynamic linking of authorization code with transaction data
   - Use mechanisms to detect DOM manipulation
   - Implement Content Security Policy (CSP)
   - Require multi-level authentication for financial operations

## 📁 Project Structure
- `/demo` - Bank page demo for testing
  - `demo.html` - Main demo file
  - `demo.css` - Demo styles
  - `demo-fix-fonts.css` - Font fixes
  - `img/` - Images and icons for the demo
- `/extension` - Extension code
  - `manifest.json` - Extension configuration
  - `popup.html` - Extension interface
  - `popup.js` - Interface script
  - `content.js` - Main script replacing account numbers
  - `background.js` - Background script
  - `/icons` - Extension icons
- `/docs` - Project documentation
  - `report_and_presentation_en.md` - Detailed technical report and presentation

## Attack Scenarios
This extension demonstrates that the following attacks are possible:
1. **Impersonating popular extensions** - the user thinks they're installing an ad blocker
2. **Manipulating form fields** - even with secure HTTPS connection
3. **Hiding changes from the user** - substituting displayed content
4. **Bypassing visual verification** - the user sees their data, but different data is sent

## How to Defend Yourself
How to protect against such attacks:
1. Install extensions only from official stores
2. Check reviews and number of installations for extensions
3. Carefully verify transfer data (preferably on multiple devices)
4. Use two-factor authentication for transfers
5. Pay attention to account numbers of regular recipients

## Technical Aspects

### Technical Limitations
Browser extensions are subject to certain technical limitations worth knowing:

1. **Content scripts are injected only when the page loads** - If you enable the extension when the page is already open, you need to refresh it
2. **Dynamic script injection** - Chrome allows dynamic injection, but it requires additional permissions and implementation
3. **Execution context isolation** - Extension scripts run in an isolated context, which ensures security but limits some capabilities

**WARNING:** This project was created solely for educational purposes! Using it for real attacks is illegal and unethical!

## Documentation
For more detailed information about the project, including technical aspects and implementation details, please refer to the [complete technical report](docs/report_and_presentation_en.md).

## Legal Information
This software is provided for educational purposes only. The author does not take any responsibility for misuse of this information. Using this software to attack actual banking systems is illegal and may result in criminal charges.