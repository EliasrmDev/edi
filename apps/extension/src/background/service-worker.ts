/// <reference types="chrome" />
/// <reference types="vite/client" />

import type { ExtensionMessage, StoreAuthTokenMessage, ProxyAPIMessage } from '../types/messages';

// ── Install ───────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'edi-edit',
    title: 'Editar con EDI',
    contexts: ['selection'],
  });
});

// ── Context menu click → forward to content script ────────────────────────────

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'edi-edit' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_MODAL',
      payload: { selectedText: info.selectionText ?? '' },
    } satisfies ExtensionMessage);
  }
});

// ── Incoming messages from content script ─────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    // SECURITY: only accept messages from our own extension
    if (sender.id !== chrome.runtime.id) return;

    switch (message.type) {
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
    }
  },
);

// ── Handlers ──────────────────────────────────────────────────────────────────

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
  const ALLOWED_ENDPOINTS = ['/api/transform', '/api/transform/quota', '/api/auth/me'];
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
  await chrome.storage.local.set({
    authToken: payload.token,
    tokenExpiresAt: payload.expiresAt,
  });
  sendResponse({ ok: true });
}

async function handleClearAuthToken(sendResponse: (r: unknown) => void) {
  await chrome.storage.local.remove(['authToken', 'tokenExpiresAt']);
  sendResponse({ ok: true });
}
