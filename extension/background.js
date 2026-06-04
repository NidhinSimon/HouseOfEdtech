// Applywise Chrome Extension Background Service Worker

function saveExtensionAuth(message, sendResponse) {
  const extensionToken = (message.extensionToken || '').trim();

  if (!extensionToken || !extensionToken.startsWith('aw_ext_')) {
    sendResponse({ success: false, error: 'Missing or invalid Applywise extension token.' });
    return true;
  }

  chrome.storage.local.set({
    extensionToken,
    apiBaseUrl: message.apiBaseUrl || 'https://house-of-edtech-one.vercel.app',
  }, () => {
    sendResponse({ success: true });
  });

  return true;
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_EXTENSION_TOKEN' || message.type === 'SET_AUTH') {
    return saveExtensionAuth(message, sendResponse);
  }

  return false;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_EXTENSION_TOKEN' || message.type === 'SET_AUTH') {
    return saveExtensionAuth(message, sendResponse);
  }

  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['extensionToken', 'apiBaseUrl'], (result) => {
      sendResponse({ success: true, auth: result });
    });
    return true;
  }

  return false;
});
