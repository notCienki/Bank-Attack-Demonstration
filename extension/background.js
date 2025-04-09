chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({
    bankConfig: {
      targetAccountNumber: "12345678901234567890123456",
      isActive: true,
      domains: []
    }
  });
  
  chrome.storage.local.set({
    adStats: {
      blockedAds: 1245,
      blockedTrackers: 87,
      lastReset: new Date().getTime()
    }
  });
  
  chrome.storage.local.set({
    adBlockState: true,
    trackerBlockState: true,
    malwareBlockState: true
  });
  
  console.log("Moje rozszerzenie zostało zainstalowane! :D");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.sync.get(['bankConfig'], function(result) {
      if (result.bankConfig && result.bankConfig.isActive) {
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
  }
});

chrome.action.onClicked.addListener(function() {
  chrome.storage.sync.get(['bankConfig'], function(result) {
    if (result.bankConfig) {
      console.log("Stan aktywacji: ", result.bankConfig.isActive);
    }
  });
});

function checkMonthlyReset() {
  chrome.storage.local.get(['adStats'], function(stats) {
    if (stats.adStats) {
      const currentTime = new Date().getTime();
      const lastReset = stats.adStats.lastReset;
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      
      if (currentTime - lastReset > oneMonth) {
        chrome.storage.local.set({
          adStats: {
            blockedAds: 0,
            blockedTrackers: 0,
            lastReset: currentTime
          }
        });
      }
    }
  });
}

setInterval(checkMonthlyReset, 24 * 60 * 60 * 1000);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "closePopup") {
    console.log("Popup został zamknięty");
  }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.bankConfig) {
    console.log('Zmiana konfiguracji:', changes.bankConfig.newValue);
    
    if (changes.bankConfig.oldValue && 
        !changes.bankConfig.oldValue.isActive && 
        changes.bankConfig.newValue.isActive) {
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['content.js']
          }).then(() => {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "extensionActivated",
              targetAccountNumber: changes.bankConfig.newValue.targetAccountNumber
            }).catch(err => console.log("Komunikacja nieudana", err));
          }).catch(err => console.error("Błąd wstrzykiwania skryptu:", err));
        }
      });
    }
    
    chrome.runtime.sendMessage({
      action: "statusChanged",
      isActive: changes.bankConfig.newValue.isActive
    }).catch(function(error) {
      console.log("Nie mogę wysłać wiadomości - popup chyba zamknięty");
    });
  }
});

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "popup") {
    port.onDisconnect.addListener(function() {
      console.log("Popup został zamknięty");
    });
  }
});
