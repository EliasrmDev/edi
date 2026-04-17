/// <reference types="chrome" />

/**
 * EDI Text Intelligence — Background service worker
 * Handles message routing and extension lifecycle events.
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      defaultLocale: 'es-CR',
      defaultTone: 'voseo-cr',
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TRANSFORM_TEXT') {
    handleTransformRequest(message.payload)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: String(err) }));
    return true; // Keep message channel open for async response
  }
  return false;
});

async function handleTransformRequest(payload: {
  text: string;
  transformation: string;
}): Promise<{ result: string } | { error: string }> {
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/api/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      return {
        error:
          typeof errorData === 'object' && errorData !== null && 'error' in errorData
            ? String((errorData as { error: { message: string } }).error.message)
            : 'Transform request failed',
      };
    }

    const data = (await response.json()) as { data: { result: string } };
    return { result: data.data.result };
  } catch (err) {
    return { error: `Network error: ${String(err)}` };
  }
}

async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.local.get('apiUrl');
  return (result.apiUrl as string) || 'http://localhost:3001';
}

export {};
