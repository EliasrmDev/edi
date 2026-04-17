/// <reference types="chrome" />

import { ModalController } from '../modal/ModalController';
import {
  InputFieldHandler,
  ContentEditableHandler,
  ReadOnlyHandler,
} from './TextFieldHandler';
import type { TextFieldHandler } from './TextFieldHandler';

let modalController: ModalController | null = null;
let activeHandler: TextFieldHandler | null = null;

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender) => {
  // SECURITY: only accept messages from our own extension
  if (sender.id !== chrome.runtime.id) return;

  if (
    message !== null &&
    typeof message === 'object' &&
    (message as { type?: unknown }).type === 'OPEN_MODAL'
  ) {
    const payload = (message as { type: string; payload: { selectedText: string } }).payload;
    handleOpenModal(payload.selectedText);
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
      modalController?.close();
      activeHandler = null;
    },
  });
}
