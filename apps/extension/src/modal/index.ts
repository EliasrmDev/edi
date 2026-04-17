/**
 * EDI Text Intelligence — Modal UI entry point
 * Handles the popup action interface for text transformations.
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.querySelector('.status');
  if (statusEl) {
    statusEl.textContent = 'Listo para transformar texto.';
  }
});

export {};
