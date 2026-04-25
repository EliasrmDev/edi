/// <reference types="chrome" />

import { ModalController } from '../modal/ModalController';
import {
  InputFieldHandler,
  ContentEditableHandler,
  ReadOnlyHandler,
} from './TextFieldHandler';
import type { TextFieldHandler } from './TextFieldHandler';
import { scanImages } from '../image-converter/scanner';

// Only run on real web pages — skip chrome-error://, chrome://, about:, etc.
// Without this guard, Chrome blocks frame navigations attempted from error pages.
if (!location.protocol.startsWith('http')) {
  // Stop module execution on non-HTTP(S) pages
  throw new Error('[EDI] Skipping content script on non-HTTP page.');
}

let modalController: ModalController | null = null;
let activeHandler: TextFieldHandler | null = null;
let floatingBtnEnabled = true; // default on; updated from storage
let modalOpen = false; // true while modal is visible

// Read persisted setting on load
void chrome.storage.sync.get('floatingBtnEnabled').then((s) => {
  if (s['floatingBtnEnabled'] === false) floatingBtnEnabled = false;
});

// ── Floating transform button ─────────────────────────────────────────────────

let capturedText = '';

function getSelectedText(): string {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

function showTransformButton(x: number, y: number): void {
  removeTransformButton();

  // Capture text now — selection may be lost when button is clicked
  capturedText = getSelectedText();

  const button = document.createElement('button');
  button.id = 'edi-transform-btn';
  button.textContent = 'EDI ✏️';
  button.setAttribute('aria-label', 'Transform selected text with EDI');
  button.style.cssText = [
    'position: fixed',
    `top: ${y - 40}px`,
    `left: ${x}px`,
    'z-index: 2147483647',
    'padding: 6px 12px',
    'border: none',
    'border-radius: 6px',
    'background: #2563eb',
    'color: white',
    'font-size: 13px',
    'font-family: system-ui, sans-serif',
    'cursor: pointer',
    'box-shadow: 0 2px 8px rgba(0,0,0,0.2)',
    'transition: opacity 0.15s ease',
  ].join(';');

  button.addEventListener('mousedown', (e) => {
    // Prevent the click from clearing the text selection
    e.preventDefault();
  });

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const text = capturedText || getSelectedText();
    removeTransformButton();
    if (text) {
      handleOpenModal(text);
    }
  });

  document.body.appendChild(button);
}

function removeTransformButton(): void {
  const existing = document.getElementById('edi-transform-btn');
  if (existing) {
    existing.remove();
  }
}

document.addEventListener('mouseup', (event) => {
  // Don't reposition/remove the button when clicking on it
  if ((event.target as HTMLElement)?.id === 'edi-transform-btn') return;

  if (!floatingBtnEnabled || modalOpen) {
    removeTransformButton();
    return;
  }

  const text = getSelectedText();
  if (text.length > 0) {
    showTransformButton(event.clientX, event.clientY);
  } else {
    removeTransformButton();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    removeTransformButton();
  }
});

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // SECURITY: only accept messages from our own extension
  if (sender.id !== chrome.runtime.id) return;

  if (
    message !== null &&
    typeof message === 'object' &&
    (message as { type?: unknown }).type === 'OPEN_MODAL'
  ) {
    const payload = (message as { type: string; payload: { selectedText: string } }).payload;
    handleOpenModal(payload.selectedText);
    return;
  }

  // Image converter: content script PING
  if (
    message !== null &&
    typeof message === 'object' &&
    (message as { type?: unknown }).type === 'PING'
  ) {
    sendResponse({ ok: true });
    return;
  }

  // Image converter: scan page images
  if (
    message !== null &&
    typeof message === 'object' &&
    (message as { type?: unknown }).type === 'SCAN_IMAGES'
  ) {
    sendResponse({ images: scanImages() });
    return;
  }

  // Floating button toggle from popup
  if (
    message !== null &&
    typeof message === 'object' &&
    (message as { type?: unknown }).type === 'FLOATING_BTN_TOGGLE'
  ) {
    const { enabled } = (message as { type: string; payload: { enabled: boolean } }).payload;
    floatingBtnEnabled = enabled;
    if (!enabled) removeTransformButton();
    return;
  }
});

// ── Modal open ────────────────────────────────────────────────────────────────

function handleOpenModal(selectedText: string): void {
  const activeEl = document.activeElement;
  const selection = window.getSelection();

  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    activeHandler = new InputFieldHandler(activeEl);
  } else if (
    activeEl?.getAttribute('contenteditable') === 'true' ||
    activeEl?.getAttribute('contenteditable') === ''
  ) {
    activeHandler = new ContentEditableHandler(activeEl as HTMLElement, selection);
  } else if (selection && selection.rangeCount > 0) {
    // Text selected on a static/read-only element — clipboard fallback
    activeHandler = new ReadOnlyHandler(selection.toString());
  } else {
    activeHandler = null;
  }

  const textToEdit = activeHandler?.getSelectedText() ?? selectedText;

  if (!modalController) {
    modalController = new ModalController();
  }

  modalOpen = true;
  removeTransformButton();
  modalController.open({
    initialText: textToEdit,
    onApply: (transformedText: string) => {
      if (activeHandler) {
        const success = activeHandler.applyText(transformedText);
        if (!success) {
          // Fallback: copy to clipboard and notify the user
          navigator.clipboard.writeText(transformedText).catch(() => {});
          modalController?.showFallbackNotice();
          return;
        }
      }
      modalController?.close();
    },
    onClose: () => {
      modalOpen = false;
      modalController?.close();
      activeHandler = null;
    },
  });
}
