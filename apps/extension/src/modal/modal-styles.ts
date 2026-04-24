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
  width: min(640px, 96vw);
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
  width: 100%;
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
  min-height: 36px;
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
  gap: 8px;
  width: 100%;
}

#edi-copy {
  min-height: 36px;
  border: 1.5px solid #d1d5db;
  padding: 7px 14px;
  background: #ffffff;
  color: #374151;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
}

#edi-copy:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

#edi-apply {
  min-height: 36px;
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

/* ── AI provider bar ──────────────────────────────────────────────────────── */

#edi-ai-bar {
  background: #f8f9ff;
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

#edi-ai-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

#edi-ai-status-text {
  font-size: 0.8125rem;
  color: #4338ca;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

#edi-ai-toggle {
  font-size: 0.75rem;
  padding: 3px 10px;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  background: #eef2ff;
  color: #4338ca;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms;
}
#edi-ai-toggle:hover { background: #e0e7ff; }
#edi-ai-toggle[aria-expanded="true"] { background: #c7d2fe; }

#edi-cred-picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edi-cred-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 120ms, background 120ms;
}
.edi-cred-item:hover:not(:disabled) { border-color: #a5b4fc; background: #f5f3ff; }
.edi-cred-item[aria-selected="true"] {
  border-color: #6366f1;
  background: #eef2ff;
}
.edi-cred-item:disabled { opacity: 0.5; cursor: not-allowed; }

.edi-cred-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.edi-cred-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.edi-cred-meta {
  font-size: 0.6875rem;
  color: #6b7280;
}

.edi-cred-activate {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border: 1px solid #6366f1;
  border-radius: 4px;
  background: #6366f1;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.edi-cred-activate:hover { background: #4f46e5; }
.edi-cred-activate[disabled] {
  background: #c7d2fe;
  border-color: #c7d2fe;
  color: #6366f1;
  cursor: default;
}

/* ── Tone mode toggle ─────────────────────────────────────────────────────── */

.edi-tone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.edi-tone-mode {
  display: flex;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: #f9fafb;
}

.edi-tone-mode-btn {
  min-height: 30px;
  padding: 3px 10px;
  font-size: 0.7rem;
  font-weight: 600;
  border: none;
  border-right: 1px solid #d1d5db;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  transition: background 120ms, color 120ms;
  line-height: 1.4;
}

.edi-tone-mode-btn:last-child { border-right: none; }

.edi-tone-mode-btn[aria-pressed="true"] {
  background: #eff6ff;
  color: #1d4ed8;
}

#btn-tone-mode-ai[aria-pressed="true"] {
  background: #eef2ff;
  color: #4338ca;
}

#edi-tone-btns[data-mode="ai"] button {
  background: #eef2ff;
  border-color: #818cf8;
  color: #4338ca;
}

#edi-tone-btns[data-mode="ai"] button:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #6366f1;
}

/* ── Verbal mode toggle ───────────────────────────────────────────────────── */

.edi-verbal-mode {
  display: flex;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: #f9fafb;
  align-self: flex-start;
}

.edi-verbal-mode-btn {
  min-height: 30px;
  padding: 3px 10px;
  font-size: 0.7rem;
  font-weight: 600;
  border: none;
  border-right: 1px solid #d1d5db;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  transition: background 120ms, color 120ms;
  line-height: 1.4;
}

.edi-verbal-mode-btn:last-child { border-right: none; }

.edi-verbal-mode-btn[aria-pressed="true"] {
  background: #f0fdf4;
  color: #166534;
}

.edi-verbal-mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}

/* High contrast mode */
@media (forced-colors: active) {
  * { border-color: ButtonText; }
}

@media (max-width: 640px) {
  #edi-panel {
    width: calc(100vw - 16px);
    max-height: 94vh;
    border-radius: 10px;
  }

  #edi-header,
  #edi-body {
    padding-left: 12px;
    padding-right: 12px;
  }

  .edi-tone-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .edi-action-group-actions {
    flex-direction: column;
  }

  .edi-action-group-actions div {
    width: 100%;
  }

  #edi-footer {
    width: 100%;
    justify-content: stretch;
    flex-wrap: wrap;
  }

  #edi-copy,
  #edi-apply {
    flex: 1 1 100%;
    justify-content: center;
  }
}

/* ── Visual Diff Panel ─────────────────────────────────────────────────────── */

#edi-diff-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 3px 10px;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  color: #6b7280;
  font-size: 0.78em;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

#edi-diff-toggle:hover {
  background: #f3f4f6;
  color: #374151;
  border-color: #9ca3af;
}

#edi-diff-panel {
  margin-top: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.edi-diff-row {
  padding: 8px 12px;
}

.edi-diff-row--original {
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.edi-diff-row--transformed {
  background: #f9fefb;
}

.edi-diff-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.72em;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9ca3af;
}

.edi-diff-content {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875em;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: #374151;
}

.diff-del {
  background: #ffd7d5;
  text-decoration: line-through;
  border-radius: 2px;
  padding: 0 1px;
  color: #b91c1c;
}

.diff-add {
  background: #d1fae5;
  border-radius: 2px;
  padding: 0 1px;
  color: #065f46;
}

/* ── Diff typewriter animation ─────────────────────────────────────────────── */

/* Blinking cursor shown at the end of each panel while typing */
@keyframes edi-cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.edi-diff-content.edi-animating::after {
  content: '|';
  display: inline;
  color: #9ca3af;
  font-weight: 100;
  animation: edi-cursor-blink 0.6s step-end infinite;
}

/* Subtle pop-in for each <mark> element as it is appended during animation */
@keyframes edi-mark-appear {
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1);    }
}

.edi-diff-content mark {
  display: inline-block;
  animation: edi-mark-appear 0.14s ease-out;
}
`;
}
