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
                  aria-controls="edi-cred-picker" aria-label="Mostrar proveedores de IA">
            <svg id="edi-ai-chevron" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M3 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div id="edi-cred-picker" hidden role="listbox" aria-label="Seleccionar proveedor de IA">
          <!-- populated by ModalController -->
        </div>
      </div> <!-- /AI provider bar -->
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
        <div class="edi-group-wrapper">
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

        <div role="group" aria-labelledby="grp-tone" id="edi-copy-cr-group">
          <div class="edi-copy-cr-group" role="group" aria-labelledby="grp-copy-cr">
            <span class="edi-group-label" id="grp-copy-cr">✦ Motor de Copy CR</span>
            <div class="edi-copy-config">
              <label class="edi-copy-config-label" for="edi-copy-contexto">Contexto</label>
              <select id="edi-copy-contexto" class="edi-copy-select">
                <option value="anuncio">Anuncio</option>
                <option value="landing">Landing</option>
                <option value="boton">Botón / CTA</option>
                <option value="formulario">Formulario</option>
                <option value="notificacion">Notificación</option>
                <option value="error">Error</option>
              </select>
              <label class="edi-copy-config-label" for="edi-copy-objetivo">Objetivo</label>
              <select id="edi-copy-objetivo" class="edi-copy-select">
                <option value="convertir">Convertir</option>
                <option value="persuadir">Persuadir</option>
                <option value="informar">Informar</option>
                <option value="guiar">Guiar</option>
              </select>
              <label class="edi-copy-config-label" for="edi-copy-formalidad">Formalidad</label>
              <select id="edi-copy-formalidad" class="edi-copy-select">
                <option value="medio">Medio</option>
                <option value="bajo">Informal</option>
                <option value="alto">Formal</option>
              </select>
              <label class="edi-copy-config-label" for="edi-copy-canal">Canal</label>
              <select id="edi-copy-canal" class="edi-copy-select">
                <option value="web">Web</option>
                <option value="meta-ads">Meta Ads</option>
                <option value="email">Email</option>
                <option value="app">App</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="display">Display</option>
                <option value="sms">SMS</option>
              </select>
              <label class="edi-copy-config-label" for="edi-copy-intensidad">Intensidad</label>
              <select id="edi-copy-intensidad" class="edi-copy-select">
                <option value="moderada">Moderada</option>
                <option value="minima">Mínima</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <button id="btn-copy-cr" type="button" aria-busy="false">Generar Copy CR</button>
          </div>
        </div>

        <div class="edi-action-group-actions">
          <footer id="edi-footer">
            <button id="btn-ortografia" type="button" aria-busy="false">Corregir ortografía</button>
            <button id="edi-copy" type="button" aria-label="Copiar texto editado">Copiar texto</button>
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
