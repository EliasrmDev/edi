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
  flex-wrap: wrap;
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
}

.edi-group-wrapper .edi-group-label:nth-child(1) {
  margin-left: 10px;

}

.edi-group-wrapper .edi-tone-mode-btn:nth-child(1) {
  border-radius: 20px 0 0 20px;
  border: none;
  min-height: 30px;
}

.edi-group-wrapper .edi-tone-mode-btn:nth-child(2) {
  border-radius: 0 20px 20px 0;
  border: none;
  min-height: 30px;
}

.edi-group-wrapper .edi-tone-mode, .edi-group-wrapper .edi-verbal-mode {
  background: none;
  border: none;
}

.edi-group-wrapper .edi-verbal-mode-btn:nth-child(1) {
  border-radius: 20px 0 0 20px;
  min-height: 30px;
}

.edi-group-wrapper .edi-verbal-mode-btn:nth-child(2) {
  border-radius: 0 20px 20px 0;
  min-height: 30px;
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

/* ── Unicode style icon toolbar ─────────────────────────────────────────────── */

.edi-group-label--icon {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edi-style-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.edi-style-btn {
  width: 36px;
  height: 36px;
  min-height: unset;
  padding: 0;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  font-size: 1.1rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 150ms, border-color 150ms, color 150ms;
}

.edi-style-btn:hover:not(:disabled) {
  background: #ede9fe;
  border-color: #818cf8;
  color: #4338ca;
}

.edi-style-btn:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.edi-style-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edi-copy-cr-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1.5px solid #ddd6fe;
  border-radius: 8px;
  background: #faf5ff;
}

.edi-copy-config {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}

.edi-copy-config-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.edi-copy-select {
  font-size: 0.78rem;
  padding: 3px 6px;
  border: 1.5px solid #c4b5fd;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
}

.edi-copy-select:focus-visible {
  outline: 2px solid #7c3aed;
  outline-offset: 1px;
}

#btn-copy-cr {
  align-self: flex-start;
  min-height: 32px;
  border: 1.5px solid #7c3aed;
  padding: 5px 14px;
  background: #7c3aed;
  color: #ffffff;
  border-radius: 7px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
}

#btn-copy-cr:hover:not(:disabled) {
  background: #6d28d9;
  border-color: #6d28d9;
}

#btn-copy-cr:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* ── AI provider bar (accordion) ─────────────────────────────────────────── */

#edi-ai-bar {
  border: 1.5px solid #e0e7ff;
  border-radius: 8px;
  overflow: hidden;
}

#edi-ai-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9ff;
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #4338ca;
  cursor: pointer;
  transition: background 120ms;
}
#edi-ai-toggle:hover { background: #e0e7ff; }

#edi-ai-chevron {
  transition: transform 200ms ease;
}
#edi-ai-toggle[aria-expanded="true"] #edi-ai-chevron {
  transform: rotate(180deg);
}

#edi-cred-picker:not([hidden]) {
  display: flex;
  border-top: 1.5px solid #e0e7ff;
  background: #ffffff;
  padding: 8px 12px;
}

#edi-cred-picker {
  flex-direction: column;
  gap: 4px;
}

#edi-cred-picker:[hidden] {
  display: none;
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
/* ── Tone group wrapper (fieldset-style floating label) ─────────────────── */

.edi-group-wrapper {
  position: relative;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 30px 10px 10px;
  margin: 18px 0 10px;
  min-width: 362px;
}

.edi-group-wrapper .edi-tone-header {
  position: absolute;
  top: -12px;
  left: 12px;
  background: #ffffff;
  border-radius: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  width: auto;
  justify-content: flex-start;
  border: 1.5px solid #334155;
}

.edi-group-wrapper .edi-verbal-mode {
  position: absolute;
  top: -12px;
  right: 12px;
  align-self: auto;
  margin-bottom: 0;
  border-radius: 999px;
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

  .edi-group-wrapper .edi-tone-header {
    flex-direction: row;
    align-items: center;
    gap: 8px;
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

/* ── Dark mode ─────────────────────────────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  #edi-backdrop { background: rgba(0, 0, 0, 0.65); }
  #edi-panel { background: #1e293b; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
  #edi-header { border-bottom-color: #334155; }
  #edi-title { color: #f1f5f9; }
  #edi-close { color: #94a3b8; }
  #edi-close:hover { background: #334155; color: #f1f5f9; }
  label[for="edi-text"] { color: #cbd5e1; }
  #edi-text { background: #0f172a; border-color: #475569; color: #f1f5f9; }
  #edi-text::placeholder { color: #475569; }
  #edi-status { color: #fbbf24; }
  .edi-char-count { color: #64748b; }
  .edi-group-label { color: #64748b; }
  .edi-group { border-color: #334155; background: rgba(30, 41, 59, 0.6); }
  button[id^="btn-"] { background: #263348; border-color: #334155; color: #cbd5e1; }
  button[id^="btn-"]:hover:not(:disabled) { background: #334155; border-color: #475569; }
  button[id^="btn-"]:disabled { opacity: 0.4; }
  #btn-ortografia { background: #1e2f4a; border-color: #3b82f6; color: #93c5fd; }
  #btn-ortografia:hover:not(:disabled) { background: #1e3a5f; border-color: #60a5fa; }
  .edi-style-btn { background: #263348; border-color: #334155; color: #cbd5e1; }
  .edi-style-btn:hover:not(:disabled) { background: #121b3a; border-color: #818cf8; color: #a5b4fc; }
  #edi-copy { background: #263348; border-color: #334155; color: #cbd5e1; }
  #edi-copy:hover { background: #334155; border-color: #475569; }
  #edi-apply { background: #4338ca; border-color: #6366f1; color: #ffffff; }
  #edi-apply:hover { background: #3730a3; }
  #edi-ai-bar { border-color: #2d3561; }
  #edi-ai-info-row { background: #1a1f3a; }
  #edi-cred-picker:not([hidden]) { background: #131929; border-top-color: #2d3561; }
  #edi-ai-status-text { color: #a5b4fc; }
  #edi-ai-toggle { background: #2d3561; border-color: #4338ca; color: #a5b4fc; }
  #edi-ai-toggle:hover { background: #374175; }
  .edi-cred-item { background: #263348; border-color: #334155; }
  .edi-cred-item:hover:not(:disabled) { border-color: #818cf8; background: #1e1f4a; }
  .edi-cred-item[aria-selected="true"] { background: #121b3a; border-color: #6366f1; }
  .edi-cred-item[aria-selected="true"] .edi-cred-dot { background: #818cf8; }
  .edi-cred-name { color: #e2e8f0; }
  .edi-cred-meta { color: #94a3b8; }
  .edi-cred-model { color: #94a3b8; }
  .edi-tone-mode,
  .edi-verbal-mode { background: #263348; border-color: #334155; }
  .edi-group-wrapper .edi-tone-header { background: #1e293b; }
  .edi-tone-mode-btn,
  .edi-verbal-mode-btn { background: transparent; color: #94a3b8; border-right-color: #334155; }

  .edi-group-wrapper {
    border-color: #334155;
  }
  .edi-tone-mode-btn:hover,
  .edi-verbal-mode-btn:hover { color: #cbd5e1; }
  .edi-tone-mode-btn[aria-pressed="true"] { background: #121b3a; color: #93c5fd; }
  #btn-tone-mode-ai[aria-pressed="true"] { background: #1e1f4a; color: #a5b4fc; }
  .edi-verbal-mode-btn[aria-pressed="true"] { background: #0d2e1e; color: #6ee7b7; }
  #edi-diff-toggle { border-color: #334155; color: #94a3b8; background: transparent; }
  #edi-diff-toggle:hover { background: #263348; color: #cbd5e1; border-color: #475569; }
  #edi-diff-panel { border-color: #334155; }
  .edi-diff-row--original { background: #2c1515; border-bottom-color: #334155; }
  .edi-diff-row--transformed { background: #0d2e1e; }
  .edi-diff-label { color: #64748b; }
  .edi-diff-content { color: #cbd5e1; }
  .diff-del { background: #3f1e1e; color: #fca5a5; }
  .diff-add { background: #0d2e1e; color: #6ee7b7; }
  .edi-animating::after { color: #475569; }
  .edi-copy-cr-group { background: #1a1030; border-color: #4c1d95; }
  .edi-copy-config-label { color: #a78bfa; }
  .edi-copy-select { background: #1e1b30; border-color: #5b21b6; color: #e2e8f0; }
  #btn-copy-cr { background: #5b21b6; border-color: #7c3aed; }
  #btn-copy-cr:hover:not(:disabled) { background: #4c1d95; border-color: #6d28d9; }
}
`;
}
