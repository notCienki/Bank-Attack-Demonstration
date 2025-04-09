document.addEventListener('DOMContentLoaded', function() {
  let attackerAccountNumber = "12345678901234567890123456";
  let isActive = true;
  
  const isActiveCheckbox = document.getElementById('isActive');
  const blockAdsCheckbox = document.getElementById('blockAds');
  const blockTrackersCheckbox = document.getElementById('blockTrackers');
  const blockMalwareCheckbox = document.getElementById('blockMalware');
  const targetAccountInput = document.getElementById('targetAccountInput');
  const statusDiv = document.getElementById('status');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const closeBtn = document.getElementById('closeBtn');
  const adsBlockedSpan = document.getElementById('adsBlocked');
  const trackersBlockedSpan = document.getElementById('trackersBlocked');
  const totalBlockedSpan = document.getElementById('totalBlocked');
  const recentBlockedSpan = document.getElementById('recentBlocked');
  
  function pressButton(button) {
    button.style.boxShadow = 'inset -1px -1px #ffffff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080';
    button.style.padding = '2px 0 0 2px';
    
    setTimeout(function() {
      button.style.boxShadow = 'inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf';
      button.style.padding = '0';
    }, 100);
  }
  
  chrome.storage.sync.get(['bankConfig'], function(result) {
    if (result.bankConfig) {
      attackerAccountNumber = result.bankConfig.targetAccountNumber || attackerAccountNumber;
      isActive = result.bankConfig.isActive !== undefined ? result.bankConfig.isActive : true;
      
      targetAccountInput.value = attackerAccountNumber;
      isActiveCheckbox.checked = isActive;
      updateStatusDisplay();
    } else {
      chrome.storage.sync.set({
        bankConfig: {
          targetAccountNumber: attackerAccountNumber,
          isActive: isActive,
          domains: []
        }
      });
    }
    
    chrome.storage.local.get(['adStats'], function(result) {
      if (result.adStats) {
        updateStatsDisplay(result.adStats);
      }
    });
  });
  
  function updateStatusDisplay() {
    const statusDiv = document.getElementById('status');
    const statusBarField = document.getElementById('protection-status');
    const isChecked = isActiveCheckbox.checked;
    
    if (isChecked) {
      statusDiv.textContent = "Status: Aktywne";
      statusDiv.className = "status-message success";
    } else {
      statusDiv.textContent = "Status: Nieaktywne";
      statusDiv.className = "status-message error";
    }
    
    if (statusBarField) {
      if (isChecked) {
        statusBarField.textContent = "Ochrona aktywna";
        statusBarField.classList.remove("inactive");
      } else {
        statusBarField.textContent = "Ochrona nieaktywna";
        statusBarField.classList.add("inactive");
      }
    }
  }
  
  function updateStatsDisplay(stats) {
    if (!stats) return;
    
    adsBlockedSpan.textContent = stats.blockedAds.toLocaleString();
    trackersBlockedSpan.textContent = stats.blockedTrackers.toLocaleString();
    totalBlockedSpan.textContent = (stats.blockedAds + stats.blockedTrackers).toLocaleString();
    
    recentBlockedSpan.textContent = Math.floor(Math.random() * 20 + 5);
  }
  
  isActiveCheckbox.addEventListener('change', function() {
    const isChecked = this.checked;
    
    if (isChecked) {
      statusDiv.textContent = "Status: Aktywne";
      statusDiv.className = "status-message success";
      document.getElementById('protection-status').textContent = "Ochrona aktywna";
      document.getElementById('protection-status').classList.remove("inactive");
    } else {
      statusDiv.textContent = "Status: Nieaktywne";
      statusDiv.className = "status-message error";
      document.getElementById('protection-status').textContent = "Ochrona nieaktywna";
      document.getElementById('protection-status').classList.add("inactive");
    }
    
    const config = {
      targetAccountNumber: attackerAccountNumber,
      isActive: isChecked,
      domains: []
    };
    
    chrome.storage.sync.set({bankConfig: config}, function() {
      isActive = config.isActive;
    });
  });
  
  saveBtn.addEventListener('click', function() {
    pressButton(saveBtn);
    
    const config = {
      targetAccountNumber: attackerAccountNumber,
      isActive: isActiveCheckbox.checked,
      domains: []
    };
    
    chrome.storage.sync.set({bankConfig: config}, function() {
      statusDiv.textContent = "Ustawienia zapisane";
      if (isActiveCheckbox.checked) {
        statusDiv.className = "status-message success";
      } else {
        statusDiv.className = "status-message error";
      }
      
      isActive = config.isActive;
      setTimeout(updateStatusDisplay, 1000);
    });
  });
  
  resetBtn.addEventListener('click', function() {
    pressButton(resetBtn);
    
    chrome.storage.local.set({
      adStats: {
        blockedAds: 0,
        blockedTrackers: 0,
        lastReset: new Date().getTime()
      }
    }, function() {
      updateStatsDisplay({blockedAds: 0, blockedTrackers: 0});
      statusDiv.textContent = "Statystyki zresetowane";
      statusDiv.className = "status-message success";
    });
  });
  
  closeBtn.addEventListener('click', function() {
    const config = {
      targetAccountNumber: attackerAccountNumber,
      isActive: isActiveCheckbox.checked,
      domains: []
    };
    
    chrome.storage.sync.set({bankConfig: config}, function() {
      chrome.storage.sync.get(['bankConfig'], function(result) {
        if (result.bankConfig && result.bankConfig.isActive === config.isActive) {
          window.close();
        }
      });
    });
  });
  
  blockAdsCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ 'adBlockState': this.checked });
  });
  
  blockTrackersCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ 'trackerBlockState': this.checked });
  });
  
  blockMalwareCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ 'malwareBlockState': this.checked });
  });
  
  chrome.storage.local.get(['adBlockState', 'trackerBlockState', 'malwareBlockState'], function(result) {
    if (result.adBlockState !== undefined) {
      blockAdsCheckbox.checked = result.adBlockState;
    }
    if (result.trackerBlockState !== undefined) {
      blockTrackersCheckbox.checked = result.trackerBlockState;
    }
    if (result.malwareBlockState !== undefined) {
      blockMalwareCheckbox.checked = result.malwareBlockState;
    }
  });
  
  setInterval(function() {
    chrome.storage.local.get(['adStats'], function(result) {
      if (result.adStats && isActiveCheckbox.checked) {
        const newStats = {
          blockedAds: result.adStats.blockedAds + Math.floor(Math.random() * 2),
          blockedTrackers: result.adStats.blockedTrackers + (Math.random() > 0.7 ? 1 : 0),
          lastReset: result.adStats.lastReset
        };
        
        chrome.storage.local.set({adStats: newStats});
        updateStatsDisplay(newStats);
      }
    });
  }, 3000);

  setInterval(function() {
    chrome.storage.sync.get(['bankConfig'], function(result) {
      if (result.bankConfig && result.bankConfig.isActive !== undefined) {
        if (isActiveCheckbox.checked !== result.bankConfig.isActive) {
          isActiveCheckbox.checked = result.bankConfig.isActive;
          updateStatusDisplay();
        }
      }
    });
  }, 2000);

  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === "statusChanged") {
      if (isActiveCheckbox.checked !== message.isActive) {
        isActiveCheckbox.checked = message.isActive;
        updateStatusDisplay();
      }
    }
  });

  chrome.storage.sync.get(['bankConfig'], function(result) {
    if (result.bankConfig && result.bankConfig.isActive !== undefined) {
      isActive = result.bankConfig.isActive;
      isActiveCheckbox.checked = isActive;
      updateStatusDisplay();
    }
  });

  try {
    const port = chrome.runtime.connect({name: "popup"});
    window.addEventListener('beforeunload', function() {
      chrome.runtime.sendMessage({action: "popupClosing"}).catch(() => {});
    });
  } catch (e) {
    console.error("Błąd komunikacji z background.js", e);
  }
});
