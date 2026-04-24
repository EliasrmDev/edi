/**
 * Modal HTML template.
 *
 * XSS safety contract:
 *   - NO user-supplied content is ever embedded in the returned HTML string.
 *   - The `_initialText` parameter is intentionally unused here; callers MUST
 *     set the textarea value via `setModalTextSafe()` or `textarea.value`.
 */
export function createModalHTML(_initialText: string): string {
  return `
<div id="edi-modal" role="dialog" aria-modal="true" aria-labelledby="edi-title">
  <div id="edi-backdrop" aria-hidden="true"></div>
  <div id="edi-panel">
    <header id="edi-header">
      <h2 id="edi-title">EDI — Editor de Texto</h2>
      <button id="edi-close" aria-label="Cerrar editor" type="button">&#215;</button>
    </header>

    <div id="edi-body">
      <!-- AI provider bar -->
      <div id="edi-ai-bar">
        <div id="edi-ai-info-row">
          <span id="edi-ai-status-text">Sin clave de IA</span>
          <button id="edi-ai-toggle" type="button" aria-expanded="false"
                  aria-controls="edi-cred-picker">Cambiar</button>
        </div>
        <div id="edi-cred-picker" hidden role="listbox" aria-label="Seleccionar proveedor de IA">
          <!-- populated by ModalController -->
        </div>
      </div>

      <label for="edi-text" id="edi-text-label">Texto a editar</label>
      <textarea
        id="edi-text"
        aria-labelledby="edi-text-label"
        aria-describedby="edi-status"
        rows="6"
        spellcheck="true"
        lang="es"
      ></textarea>

      <div id="edi-status" role="status" aria-live="polite" aria-atomic="true"></div>

      <div id="edi-diff-container">
        <button id="edi-diff-toggle" type="button" aria-expanded="false"
                aria-controls="edi-diff-panel" hidden>Ver cambios ▾</button>
        <div id="edi-diff-panel" role="region" aria-label="Comparación de cambios" hidden>
          <div class="edi-diff-row edi-diff-row--original">
            <span class="edi-diff-label">Original</span>
            <div id="edi-diff-original" class="edi-diff-content"></div>
          </div>
          <div class="edi-diff-row edi-diff-row--transformed">
            <span class="edi-diff-label">Transformado</span>
            <div id="edi-diff-transformed" class="edi-diff-content"></div>
          </div>
        </div>
      </div>

      <div id="edi-actions" role="group" aria-label="Transformaciones de texto">
        <div class="edi-action-group">
          <span class="edi-group-label" id="grp-format">Formato</span>
          <div role="group" aria-labelledby="grp-format" class="edi-style-group">
            <button id="btn-uppercase" class="edi-style-btn" type="button" title="Mayúsculas" aria-label="Convertir a mayúsculas"><span aria-hidden="true">AA</span></button>
            <button id="btn-lowercase" class="edi-style-btn" type="button" title="Minúsculas" aria-label="Convertir a minúsculas"><span aria-hidden="true">aa</span></button>
            <button id="btn-sentence" class="edi-style-btn" type="button" title="Tipo oración" aria-label="Convertir a tipo oración"><span aria-hidden="true">Aa</span></button>
            <button id="btn-clean" class="edi-style-btn" type="button" title="Quitar formato" aria-label="Quitar formato de texto">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
                <path d="M9.5 2L12 4.5 5.5 11H3V8.5L9.5 2Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="edi-action-group">
          <span class="edi-group-label edi-group-label--icon" id="grp-unicode">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
              <path d="M8.5 1.5a1.5 1.5 0 012.12 2.12l-7 7L1 11l.38-2.62 7.12-6.88z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Estilo
          </span>
          <div role="group" aria-labelledby="grp-unicode" class="edi-style-group">
            <button id="btn-fmt-bold" class="edi-style-btn" type="button" title="Negrita (Unicode)" aria-label="Aplicar negrita Unicode"><span aria-hidden="true">𝐁</span></button>
            <button id="btn-fmt-italic" class="edi-style-btn" type="button" title="Cursiva (Unicode)" aria-label="Aplicar cursiva Unicode"><span aria-hidden="true">𝐼</span></button>
            <button id="btn-fmt-bold-italic" class="edi-style-btn" type="button" title="Negrita Cursiva (Unicode)" aria-label="Aplicar negrita cursiva Unicode"><span aria-hidden="true">𝑩</span></button>
            <button id="btn-fmt-bold-script" class="edi-style-btn" type="button" title="Caligrafía Script (Unicode)" aria-label="Aplicar caligrafía script Unicode"><span aria-hidden="true">𝓢</span></button>
            <button id="btn-fmt-mono" class="edi-style-btn" type="button" title="Monoespacio (Unicode)" aria-label="Aplicar monoespacio Unicode"><span aria-hidden="true">𝙼</span></button>
            <button id="btn-fmt-wide" class="edi-style-btn" type="button" title="Ancho Completo (Unicode)" aria-label="Aplicar ancho completo Unicode"><span aria-hidden="true">Ａ</span></button>
          </div>
        </div>

        <div class="edi-action-group">
          <div class="edi-tone-header">
            <span class="edi-group-label" id="grp-tone">Tono</span>
            <div class="edi-tone-mode" role="group" aria-label="Motor de transformación de tono">
              <button id="btn-tone-mode-local" type="button" class="edi-tone-mode-btn"
                      aria-pressed="true" title="Transformación local (rápida, sin IA)">Local</button>
              <button id="btn-tone-mode-ai" type="button" class="edi-tone-mode-btn"
                      aria-pressed="false" title="IA especializada para publicidad en Costa Rica">IA ✶</button>
            </div>
          </div>
          <div id="edi-verbal-mode-toggle" class="edi-verbal-mode" role="group" aria-label="Modo verbal">
            <button id="btn-mode-ind" type="button" class="edi-verbal-mode-btn"
                    aria-pressed="true" data-mode="indicativo">Indicativo</button>
            <button id="btn-mode-imp" type="button" class="edi-verbal-mode-btn"
                    aria-pressed="false" data-mode="imperativo">Imperativo</button>
          </div>
          <div role="group" aria-labelledby="grp-tone" id="edi-tone-btns">
            <button id="btn-voseo" type="button">Voseo (CR)</button>
            <button id="btn-tuteo" type="button">Tuteo</button>
            <button id="btn-ustedeo" type="button">Ustedeo</button>
          </div>
        </div>

        <div class="edi-action-group-actions">
          <div role="group" aria-labelledby="grp-ai">
            <span class="edi-group-label" id="grp-ai">Inteligencia Artificial</span>
            <button id="btn-ortografia" type="button" aria-busy="false">Corregir ortografía</button>
          </div>
          <footer id="edi-footer">
            <button id="edi-copy" type="button" aria-label="Copiar texto editado">Copiar texto</button>
            <button id="edi-apply" type="button">Aplicar al texto original</button>
          </footer>
        </div>
      </div>
    </div>

  </div>
</div>
`;
}

/**
 * Sets the modal textarea value safely via `.value` (XSS-safe — not innerHTML).
 * Call this immediately after `createModalHTML()` result has been inserted into
 * the shadow DOM.
 */
export function setModalTextSafe(shadowRoot: ShadowRoot, text: string): void {
  const textarea = shadowRoot.querySelector<HTMLTextAreaElement>('#edi-text');
  if (textarea) textarea.value = text;
}
