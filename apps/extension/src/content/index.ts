/// <reference types="chrome" />

/**
 * EDI Text Intelligence — Content script
 * Detects text selections and provides transformation UI trigger.
 */

function getSelectedText(): string {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

function showTransformButton(x: number, y: number): void {
  removeTransformButton();

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

  button.addEventListener('click', () => {
    const text = getSelectedText();
    if (text) {
      chrome.runtime.sendMessage({ type: 'OPEN_MODAL', payload: { text } });
    }
    removeTransformButton();
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

export {};
