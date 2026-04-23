/// <reference types="chrome" />
/// <reference types="vite/client" />

import type {
  ExtensionMessage,
  StoreAuthTokenMessage,
  ProxyAPIMessage,
  FetchConvertMessage,
} from '../types/messages';

// ── Install ───────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  // Text editing context menu
  chrome.contextMenus.create({
    id: 'edi-edit',
    title: 'Editar con EDI',
    contexts: ['selection'],
  });

  // Image conversion context menus
  chrome.contextMenus.create({
    id: 'convert-jpg',
    title: 'Convert to JPG',
    contexts: ['image'],
  });
  chrome.contextMenus.create({
    id: 'convert-png',
    title: 'Convert to PNG',
    contexts: ['image'],
  });
  chrome.contextMenus.create({
    id: 'open-in-converter',
    title: 'Open in Converter',
    contexts: ['image'],
  });

  // Set defaults on first install
  if (details.reason === 'install') {
    chrome.storage.local.set({
      defaultLocale: 'es-CR',
      defaultTone: 'voseo-cr',
    });
  }
});

// ── Context menu click ────────────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'edi-edit' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_MODAL',
      payload: { selectedText: info.selectionText ?? '' },
    } satisfies ExtensionMessage).catch(() => {
      // Content script not loaded on this page
    });
    return;
  }

  const srcUrl = info.srcUrl;
  if (!srcUrl) return;

  if (info.menuItemId === 'convert-jpg') {
    handleContextConvert(srcUrl, 'image/jpeg', tab);
    return;
  }

  if (info.menuItemId === 'convert-png') {
    handleContextConvert(srcUrl, 'image/png', tab);
    return;
  }

  if (info.menuItemId === 'open-in-converter') {
    const tabUrl = chrome.runtime.getURL('src/tab/tab.html') + `?imageUrl=${encodeURIComponent(srcUrl)}`;
    chrome.tabs.create({ url: tabUrl });
  }
});

// ── Incoming messages ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    // SECURITY: only accept messages from our own extension
    if (sender.id !== chrome.runtime.id) return;

    switch (message.type) {
      case 'OPEN_MODAL':
        // Forward to the content script in the sender's tab
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, message);
        }
        return;

      case 'GET_AUTH_TOKEN':
        handleGetAuthToken(sendResponse);
        return true; // async

      case 'PROXY_API_CALL':
        handleAPIProxy(message.payload, sendResponse);
        return true; // async

      case 'STORE_AUTH_TOKEN':
        handleStoreAuthToken(message.payload, sendResponse);
        return true; // async

      case 'CLEAR_AUTH_TOKEN':
        handleClearAuthToken(sendResponse);
        return true; // async

      case 'TRANSFORM_TEXT':
        handleTransformRequest(message.payload)
          .then(sendResponse)
          .catch((err) => sendResponse({ error: String(err) }));
        return true; // async

      case 'FETCH_CONVERT':
        handleFetchConvert(message.payload, sendResponse);
        return true; // async
    }
  },
);

// ── External messages (from the web app via externally_connectable) ──────────

const ALLOWED_WEB_ORIGINS = [
  'http://localhost:3000',
  'https://edi.eliasrm.dev',
];

chrome.runtime.onMessageExternal.addListener(
  (message: unknown, sender, sendResponse) => {
    // SECURITY: only accept from our known web origins
    if (!sender.origin || !ALLOWED_WEB_ORIGINS.includes(sender.origin)) return;

    const msg = message as { type?: string; payload?: StoreAuthTokenMessage['payload'] };
    if (msg.type === 'STORE_AUTH_TOKEN' && msg.payload) {
      handleStoreAuthToken(msg.payload, sendResponse);
      return true; // async
    }
  },
);

// ── Auth Handlers ─────────────────────────────────────────────────────────────

async function handleGetAuthToken(sendResponse: (r: unknown) => void) {
  const result = await chrome.storage.local.get(['authToken', 'tokenExpiresAt']);
  const { authToken, tokenExpiresAt } = result as {
    authToken: string | undefined;
    tokenExpiresAt: number | undefined;
  };

  if (!authToken || !tokenExpiresAt) {
    sendResponse({ token: null, reason: 'NOT_FOUND' });
    return;
  }

  if (Date.now() > tokenExpiresAt) {
    await chrome.storage.local.remove(['authToken', 'tokenExpiresAt']);
    sendResponse({ token: null, reason: 'EXPIRED' });
    return;
  }

  sendResponse({ token: authToken });
}

async function handleAPIProxy(
  payload: ProxyAPIMessage['payload'],
  sendResponse: (r: unknown) => void,
) {
  // SECURITY: strict allowlist — only internal EDI endpoints
  console.log('Proxying API call to', payload.endpoint);
  const ALLOWED_ENDPOINTS = ['/api/transform', '/api/transform/quota', '/api/auth/me', '/api/credentials'];
  if (!ALLOWED_ENDPOINTS.some((e) => payload.endpoint.startsWith(e))) {
    sendResponse({ error: 'ENDPOINT_NOT_ALLOWED' });
    return;
  }

  const stored = await chrome.storage.local.get(['authToken']);
  const { authToken } = stored as { authToken: string | undefined };

  if (!authToken) {
    sendResponse({ error: 'NOT_AUTHENTICATED' });
    return;
  }

  const API_BASE: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';

  try {
    const response = await fetch(`${API_BASE}${payload.endpoint}`, {
      method: payload.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    const data: unknown = await response.json();
    sendResponse({ status: response.status, data });
  } catch (err) {
    sendResponse({ error: 'NETWORK_ERROR', message: (err as Error).message });
  }
}

async function handleStoreAuthToken(
  payload: StoreAuthTokenMessage['payload'],
  sendResponse: (r: unknown) => void,
) {
  const data: Record<string, unknown> = {
    authToken: payload.token,
    tokenExpiresAt: payload.expiresAt,
  };
  if (payload.email) data['authUserEmail'] = payload.email;
  if ('displayName' in payload) data['authUserName'] = payload.displayName ?? null;
  await chrome.storage.local.set(data);
  sendResponse({ ok: true });
}

async function handleClearAuthToken(sendResponse: (r: unknown) => void) {
  await chrome.storage.local.remove(['authToken', 'tokenExpiresAt']);
  sendResponse({ ok: true });
}

// ── Text Transform Handler ────────────────────────────────────────────────────

async function handleTransformRequest(payload: {
  text: string;
  transformation: string;
}): Promise<{ result: string } | { error: string }> {
  try {
    const API_BASE: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';
    const response = await fetch(`${API_BASE}/api/transform`, {
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

// ── Image Conversion Handlers ─────────────────────────────────────────────────

async function handleFetchConvert(
  payload: FetchConvertMessage['payload'],
  sendResponse: (r: unknown) => void,
) {
  try {
    // data: URLs cannot be fetched — decode the base64 payload directly
    if (payload.url.startsWith('data:')) {
      const [, base64 = ''] = payload.url.split(',');
      const mime = payload.url.split(':')[1]?.split(';')[0] ?? 'image/jpeg';
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      sendResponse({ data: Array.from(bytes), mime });
      return;
    }
    const res = await fetch(payload.url);
    if (!res.ok) {
      sendResponse({ error: `HTTP ${String(res.status)}` });
      return;
    }
    const blob = await res.blob();
    const buf = await blob.arrayBuffer();
    sendResponse({ data: Array.from(new Uint8Array(buf)), mime: blob.type });
  } catch (err) {
    sendResponse({ error: (err as Error).message });
  }
}

async function handleContextConvert(
  srcUrl: string,
  format: 'image/jpeg' | 'image/png',
  tab: chrome.tabs.Tab | undefined,
) {
  try {
    let blob: Blob;

    if (srcUrl.startsWith('data:')) {
      // Decode inline data: URL directly — fetch() does not support data: URLs
      const [, base64 = ''] = srcUrl.split(',');
      const mime = srcUrl.split(':')[1]?.split(';')[0] ?? 'image/jpeg';
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      blob = new Blob([bytes], { type: mime });
    } else {
      const res = await fetch(srcUrl);
      if (!res.ok) {
        if (tab?.id) showToast(tab.id, 'Failed to download image');
        return;
      }
      blob = await res.blob();
    }
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (tab?.id) showToast(tab.id, 'Canvas not available');
      return;
    }

    // For JPEG: fill white background (no transparency)
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const outBlob = await canvas.convertToBlob({
      type: format,
      quality: format === 'image/jpeg' ? 0.92 : undefined,
    });

    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    const stem = srcUrl.split('/').pop()?.split('?')[0]?.replace(/\.[^.]+$/, '') ?? 'image';
    const fileName = `${stem}.${ext}`;

    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(outBlob);
    });

    if (tab?.id) {
      downloadViaTab(tab.id, dataUrl, fileName);
    }
  } catch (err) {
    if (tab?.id) showToast(tab.id, `Conversion failed: ${(err as Error).message}`);
  }
}

function downloadViaTab(tabId: number, dataUrl: string, fileName: string): void {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: (url: string, name: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
      },
      args: [dataUrl, fileName],
    })
    .catch(() => {
      // Fallback: cannot inject script into this tab
    });
}

function showToast(tabId: number, message: string): void {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: (msg: string) => {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = [
          'position:fixed',
          'bottom:24px',
          'right:24px',
          'z-index:2147483647',
          'padding:12px 20px',
          'border-radius:8px',
          'background:#1e293b',
          'color:#f1f5f9',
          'font:14px/1.4 system-ui,sans-serif',
          'box-shadow:0 4px 12px rgba(0,0,0,.25)',
          'transition:opacity .3s ease',
        ].join(';');
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      },
      args: [message],
    })
    .catch(() => {
      // Fallback: cannot inject toast into this tab
    });
}
