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

      <div id="edi-actions" role="group" aria-label="Transformaciones de texto">
        <div class="edi-action-group">
          <span class="edi-group-label" id="grp-format">Formato</span>
          <div role="group" aria-labelledby="grp-format">
            <button id="btn-uppercase" type="button">MAYÚSCULAS</button>
            <button id="btn-lowercase" type="button">minúsculas</button>
            <button id="btn-sentence" type="button">Tipo oración</button>
            <button id="btn-clean" type="button">Quitar formato</button>
          </div>
        </div>

        <div class="edi-action-group">
          <span class="edi-group-label" id="grp-unicode">Estilo Unicode</span>
          <div role="group" aria-labelledby="grp-unicode">
            <button id="btn-fmt-bold" type="button" title="Negrita Unicode" aria-label="Negrita Unicode">𝐍𝐞𝐠𝐫𝐢𝐭𝐚</button>
            <button id="btn-fmt-italic" type="button" title="Cursiva Unicode" aria-label="Cursiva Unicode">𝐶𝑢𝑟𝑠𝑖𝑣𝑎</button>
            <button id="btn-fmt-bold-italic" type="button" title="Negrita Cursiva Unicode" aria-label="Negrita Cursiva Unicode">𝑵𝒆𝒈.𝑪𝒖𝒓.</button>
            <button id="btn-fmt-bold-script" type="button" title="Caligrafía / Script Unicode" aria-label="Caligrafía Script Unicode">𝓢𝓬𝓻𝓲𝓹𝓽</button>
            <button id="btn-fmt-mono" type="button" title="Monoespacio Unicode" aria-label="Monoespacio Unicode">𝙼𝚘𝚗𝚘</button>
            <button id="btn-fmt-wide" type="button" title="Ancho completo (Fullwidth)" aria-label="Ancho completo Fullwidth Unicode">Ａｎｃｈｏ</button>
          </div>
        </div>

        <div class="edi-action-group">
          <span class="edi-group-label" id="grp-tone">Tono</span>
          <div role="group" aria-labelledby="grp-tone">
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
