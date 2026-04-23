/** Returns the CSS string to inject into the modal's shadow root. */
export function createModalStyles(): string {
  return `
/* EDI Modal — Shadow DOM isolated styles */
:host { all: initial; }

#edi-modal {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

#edi-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

#edi-panel {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: min(560px, 95vw);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

/* Focus visible — WCAG 2.4.11 */
*:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}

#edi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

#edi-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

#edi-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
}

#edi-close:hover { background: #f3f4f6; color: #111827; }

#edi-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label[for="edi-text"] {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

#edi-text {
  width: 100%;
  min-height: 120px;
  padding: 10px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  color: #111827;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.6;
}

#edi-text:focus-visible {
  border-color: #0066cc;
  outline: 3px solid #0066cc;
  outline-offset: 0;
}

#edi-status {
  min-height: 1.25rem;
  font-size: 0.8125rem;
  color: #b45309; /* amber-700 — AA contrast on white */
  padding: 0 2px;
}

#edi-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edi-action-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edi-group-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  width: 100%
}

.edi-action-group > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.edi-action-group-actions {
  display: flex;
  gap: 6px;
}

.edi-action-group-actions div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 50%;
}

button[id^="btn-"] {
  padding: 7px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  color: #374151;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
  white-space: nowrap;
}

button[id^="btn-"]:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

button[id^="btn-"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

#btn-ortografia {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

#btn-ortografia:hover:not(:disabled) {
  background: #dbeafe;
}

#edi-footer {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  width: 100%;
}

#edi-apply {
  border: 1.5px solid #3b82f6;
  padding: 7px 14px;
  background: #1d4ed8;
  color: #ffffff;
  border-radius: 8px;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background 150ms;
}

#edi-apply:hover { background: #1e40af; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}

/* High contrast mode */
@media (forced-colors: active) {
  * { border-color: ButtonText; }
}
`;
}
