/// <reference types="chrome" />

import type { TransformationType, TransformationWarning, ToneType, VerbalMode, CopyConfig } from '@edi/shared';
import { ToneEngine } from '../tone-engine/ToneEngine';
import { createModalHTML, setModalTextSafe } from './modal-template';
import { createModalStyles } from './modal-styles';
import { renderDiff } from './DiffRenderer';

// Reverse the HTML escaping applied by renderDiff's escapeHtml so that
// characters can be appended to DOM Text/mark nodes directly (no XSS risk).
function unescapeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export interface ModalOptions {
  initialText: string;
  onApply: (text: string) => void;
  onClose: () => void;
}

interface CredentialItem {
  id: string;
  provider: string;
  label: string;
  isActive: boolean;
  isEnabled: boolean;
  isExpired: boolean;
  selectedModel: string | null;
}

interface ProxyResponse<T = unknown> {
  error?: string;
  status?: number;
  data?: T;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  'google-ai': 'Google AI',
};

const AI_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  'google-ai': 'gemini-1.5-flash',
};

export class ModalController {
  private readonly shadowHost: HTMLElement;
  private readonly shadowRoot: ShadowRoot;
  private readonly toneEngine: ToneEngine;
  private currentText: string = '';
  private keydownHandler: EventListener | null = null;
  private toneMode: 'local' | 'ai' = 'local';
  private verbalMode: VerbalMode = 'indicativo';
  private activeToneTarget: 'voseo' | 'tuteo' | 'ustedeo' = 'voseo';
  private readonly COPY_LS_KEY = 'edi-copy-config-default';
  private copyConfigDefaults: Pick<CopyConfig, 'contexto' | 'objetivo'> = {
    contexto: 'anuncio',
    objetivo: 'convertir',
  };
  /** ID of the running typewriter timeout, or null when idle. */
  private diffAnimationId: ReturnType<typeof setTimeout> | null = null;
  /** Full HTML strings preserved so collapsing mid-animation can finish instantly. */
  private pendingOrigHtml: string = '';
  private pendingTransHtml: string = '';

  constructor() {
    this.toneEngine = new ToneEngine();

    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'edi-modal-host';
    this.shadowHost.setAttribute('role', 'none');

    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = createModalStyles();
    this.shadowRoot.appendChild(style);

    document.body.appendChild(this.shadowHost);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  open(options: ModalOptions): void {
    this.currentText = options.initialText;

    // Remove any previous modal element
    this.shadowRoot.querySelector('#edi-modal')?.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = createModalHTML(options.initialText); // structural only — no user content
    this.shadowRoot.appendChild(wrapper);

    // Set initial text XSS-safely via .value (after DOM insertion)
    setModalTextSafe(this.shadowRoot, this.currentText);

    this.bindEvents(options);
    this.trapFocus();

    // Auto-clean formatting silently on open
    this.runLocalPreprocess();

    this.shadowRoot.querySelector<HTMLTextAreaElement>('#edi-text')?.focus();

    // Reset diff panel from any previous session
    this.clearDiff();

    // Load credentials for the AI bar (non-blocking)
    void this.loadCredentials();
  }

  close(): void {
    this.shadowRoot.querySelector('#edi-modal')?.remove();
    this.releaseFocusTrap();
  }

  showFallbackNotice(): void {
    this.showError(
      'No se pudo aplicar al campo original. El texto fue copiado al portapapeles.',
    );
  }

  // ── Event binding ───────────────────────────────────────────────────────────

  private bindEvents(options: ModalOptions): void {
    const modal = this.shadowRoot.querySelector('#edi-modal');
    if (!modal) return;

    // Close button
    modal.querySelector('#edi-close')?.addEventListener('click', options.onClose);

    // Escape key
    modal.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Escape') options.onClose();
    });

    // Apply button
    modal.querySelector('#edi-apply')?.addEventListener('click', () => {
      const textarea = modal.querySelector<HTMLTextAreaElement>('#edi-text');
      if (textarea) options.onApply(textarea.value);
    });

    // Copy button
    modal.querySelector('#edi-copy')?.addEventListener('click', () => {
      void this.copyCurrentText();
    });

    // Local transformation buttons (formatting + case — never use AI)
    const localButtons: Array<[string, TransformationType]> = [
      ['#btn-uppercase', 'uppercase'],
      ['#btn-lowercase', 'lowercase'],
      ['#btn-sentence', 'sentence-case'],
      ['#btn-clean', 'remove-formatting'],
      ['#btn-fmt-bold', 'format-unicode-bold'],
      ['#btn-fmt-italic', 'format-unicode-italic'],
      ['#btn-fmt-bold-italic', 'format-unicode-bold-italic'],
      ['#btn-fmt-bold-script', 'format-unicode-bold-script'],
      ['#btn-fmt-mono', 'format-unicode-monospace'],
      ['#btn-fmt-wide', 'format-unicode-fullwidth'],
    ];

    for (const [selector, transformation] of localButtons) {
      modal.querySelector(selector)?.addEventListener('click', () => {
        this.applyLocalTransformation(transformation);
      });
    }

    // Tone mode toggle
    modal.querySelector('#btn-tone-mode-local')?.addEventListener('click', () => {
      this.setToneMode('local');
    });
    modal.querySelector('#btn-tone-mode-ai')?.addEventListener('click', () => {
      this.setToneMode('ai');
    });

    // Verbal mode toggle
    modal.querySelector('#btn-mode-ind')?.addEventListener('click', () => {
      this.setVerbalMode('indicativo');
    });
    modal.querySelector('#btn-mode-imp')?.addEventListener('click', () => {
      this.setVerbalMode('imperativo');
    });

    // Tone transform buttons — route to local ToneEngine or AI depending on toneMode
    const toneButtons: Array<[string, TransformationType, 'voseo' | 'tuteo' | 'ustedeo']> = [
      ['#btn-voseo', 'tone-voseo-cr', 'voseo'],
      ['#btn-tuteo', 'tone-tuteo', 'tuteo'],
      ['#btn-ustedeo', 'tone-ustedeo', 'ustedeo'],
    ];
    for (const [selector, transformation, toneTarget] of toneButtons) {
      modal.querySelector(selector)?.addEventListener('click', () => {
        this.activeToneTarget = toneTarget;
        if (this.toneMode === 'ai') {
          void this.requestAIToneTransformation(transformation);
        } else {
          this.applyLocalTransformation(transformation);
        }
      });
    }

    // AI orthography button
    modal.querySelector('#btn-ortografia')?.addEventListener('click', () => {
      void this.requestAICorrection();
    });

    // Copy CR button
    modal.querySelector('#btn-copy-cr')?.addEventListener('click', () => {
      void this.requestCopyCR();
    });

    // Keep currentText in sync with manual edits
    modal
      .querySelector<HTMLTextAreaElement>('#edi-text')
      ?.addEventListener('input', (e) => {
        this.currentText = (e.target as HTMLTextAreaElement).value;
      });

    // Diff panel toggle
    const diffToggle = this.shadowRoot.querySelector<HTMLButtonElement>('#edi-diff-toggle');
    const diffPanel = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-panel');
    diffToggle?.addEventListener('click', () => {
      if (!diffPanel || !diffToggle) return;
      const isExpanded = diffToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        // Collapsing: if animation is mid-flight, finish it instantly first
        this.finishDiffAnimation();
        diffPanel.hidden = true;
        diffToggle.setAttribute('aria-expanded', 'false');
        diffToggle.textContent = 'Ver cambios ▾';
      } else {
        diffPanel.hidden = false;
        diffToggle.setAttribute('aria-expanded', 'true');
        diffToggle.textContent = 'Ver cambios ▴';
      }
    });

    // Sync toggle UI (toneMode/verbalMode persist across opens within the page session)
    this.updateToneModeUI();
    this.updateVerbalModeUI();
  }

  // ── Transformations ─────────────────────────────────────────────────────────

  private applyLocalTransformation(transformation: TransformationType): void {
    const originalText = this.currentText;
    const { result, warnings } = this.toneEngine.transform(this.currentText, transformation, this.verbalMode);
    this.currentText = result;
    this.updateTextarea(result);
    this.showDiff(originalText, result);

    if (warnings.length > 0) {
      this.showWarnings(warnings);
    } else {
      // Clear any previous status message
      const status = this.shadowRoot.querySelector('#edi-status');
      if (status) status.textContent = '';
    }
  }

  private async requestAICorrection(): Promise<void> {
    const originalText = this.currentText;
    this.setLoadingState(true, 'Corrigiendo con IA…');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROXY_API_CALL',
        payload: {
          endpoint: '/api/transform',
          method: 'POST',
          body: {
            text: this.currentText,
            transformation: 'correct-orthography',
            locale: 'es-CR',
            requestAIValidation: true,
          },
        },
      }) as {
        error?: string;
        status?: number;
        data?: {
          data?: {
            result?: string;
            source?: string;
            warnings?: Array<{ code: string; message: string }>;
          };
          error?: { code?: string; message?: string };
        };
      };

      // Proxy-level error (network, not authenticated to proxy, etc.)
      if (!response) {
        this.showError('El service worker no respondió. Recargá la página e intentá de nuevo.');
        return;
      }

      if (response.error) {
        this.showError(this.friendlyError(response.error));
        return;
      }

      // API-level error returned in the response body
      const apiErrorCode = response.data?.error?.code;
      if (apiErrorCode) {
        this.showError(this.friendlyError(apiErrorCode));
        return;
      }

      const transformResult = response.data?.data;
      const corrected = transformResult?.result;
      if (typeof corrected === 'string') {
        this.showDiff(originalText, corrected);
        this.currentText = corrected;
        this.updateTextarea(corrected);

        // If AI fell back (provider error), surface the warning so the user knows
        if (transformResult?.source === 'ai-fallback') {
          const warning = transformResult.warnings?.[0]?.message ?? 'El proveedor de IA no está disponible.';
          this.showError(`El servicio de IA devolvió un error: ${warning}`);
        }
      } else {
        this.showError('No se recibió resultado del servicio. Intentá de nuevo.');
      }
    } catch {
      this.showError(
        'No se pudo conectar con el servicio de IA. Las transformaciones locales siguen disponibles.',
      );
    } finally {
      this.setLoadingState(false);
    }
  }

  private async requestCopyCR(): Promise<void> {
    const originalText = this.currentText;
    this.setLoadingState(true, 'Generando copy con IA…');

    // Read contexto/objetivo from the modal selects; fall back to stored defaults
    const contextoEl = this.shadowRoot.querySelector<HTMLSelectElement>('#edi-copy-contexto');
    const objetivoEl = this.shadowRoot.querySelector<HTMLSelectElement>('#edi-copy-objetivo');
    const contexto = (contextoEl?.value ?? this.copyConfigDefaults.contexto) as CopyConfig['contexto'];
    const objetivo = (objetivoEl?.value ?? this.copyConfigDefaults.objetivo) as CopyConfig['objetivo'];

    // Read formalidad + intensidad from localStorage (persisted by web editor or default)
    let formalidad: CopyConfig['formalidad'] = 'medio';
    let intensidadCambio: CopyConfig['intensidadCambio'] = 'moderada';
    let canal: CopyConfig['canal'] = 'web';
    try {
      const saved = localStorage.getItem(this.COPY_LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CopyConfig>;
        if (parsed.formalidad) formalidad = parsed.formalidad;
        if (parsed.intensidadCambio) intensidadCambio = parsed.intensidadCambio;
        if (parsed.canal) canal = parsed.canal;
      }
    } catch { /* ignore */ }

    const copyConfig: CopyConfig = {
      tratamiento: this.activeToneTarget,
      modoVerbal: this.verbalMode,
      contexto,
      objetivo,
      canal,
      formalidad,
      intensidadCambio,
    };

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROXY_API_CALL',
        payload: {
          endpoint: '/api/transform',
          method: 'POST',
          body: {
            text: this.currentText,
            transformation: 'copy-writing-cr',
            locale: 'es-CR',
            requestAIValidation: true,
            copyConfig,
          },
        },
      }) as {
        error?: string;
        status?: number;
        data?: {
          data?: {
            result?: string;
            source?: string;
            warnings?: Array<{ code: string; message: string }>;
          };
          error?: { code?: string; message?: string };
        };
      };

      if (!response) {
        this.showError('El service worker no respondió. Recargá la página e intentá de nuevo.');
        return;
      }

      if (response.error) {
        this.showError(this.friendlyError(response.error));
        return;
      }

      const apiErrorCode = response.data?.error?.code;
      if (apiErrorCode) {
        this.showError(this.friendlyError(apiErrorCode));
        return;
      }

      const transformResult = response.data?.data;
      const generated = transformResult?.result;
      if (typeof generated === 'string') {
        this.showDiff(originalText, generated);
        this.currentText = generated;
        this.updateTextarea(generated);

        if (transformResult?.source === 'ai-fallback') {
          const warning = transformResult.warnings?.[0]?.message ?? 'El proveedor de IA no está disponible.';
          this.showError(`El servicio de IA devolvió un error: ${warning}`);
        }
      } else {
        this.showError('No se recibió resultado del servicio. Intentá de nuevo.');
      }
    } catch {
      this.showError(
        'No se pudo conectar con el servicio de IA. Las transformaciones locales siguen disponibles.',
      );
    } finally {
      this.setLoadingState(false);
    }
  }

  // ── Tone mode ────────────────────────────────────────────────────────────────

  private setToneMode(mode: 'local' | 'ai'): void {
    this.toneMode = mode;
    this.updateToneModeUI();
  }

  private updateToneModeUI(): void {
    const localBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#btn-tone-mode-local');
    const aiBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#btn-tone-mode-ai');
    const toneGroup = this.shadowRoot.querySelector<HTMLElement>('#edi-tone-btns');
    if (localBtn) localBtn.setAttribute('aria-pressed', String(this.toneMode === 'local'));
    if (aiBtn) aiBtn.setAttribute('aria-pressed', String(this.toneMode === 'ai'));
    if (toneGroup) toneGroup.dataset['mode'] = this.toneMode;
  }

  // ── Verbal mode ──────────────────────────────────────────────────────────────

  private setVerbalMode(mode: VerbalMode): void {
    this.verbalMode = mode;
    this.updateVerbalModeUI();
  }

  private updateVerbalModeUI(): void {
    const indBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#btn-mode-ind');
    const impBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#btn-mode-imp');
    if (indBtn) indBtn.setAttribute('aria-pressed', String(this.verbalMode === 'indicativo'));
    if (impBtn) impBtn.setAttribute('aria-pressed', String(this.verbalMode === 'imperativo'));
  }

  private async requestAIToneTransformation(transformation: TransformationType): Promise<void> {
    const originalText = this.currentText;
    const TONE_MAP: Partial<Record<TransformationType, ToneType>> = {
      'tone-voseo-cr': 'voseo-cr',
      'tone-tuteo': 'tuteo',
      'tone-ustedeo': 'ustedeo',
    };
    const TONE_LABELS: Partial<Record<TransformationType, string>> = {
      'tone-voseo-cr': 'voseo costarricense',
      'tone-tuteo': 'tuteo',
      'tone-ustedeo': 'ustedeo',
    };

    const tone = TONE_MAP[transformation];
    const label = TONE_LABELS[transformation] ?? 'tono';

    this.setAIToneLoadingState(true, `Adaptando a ${label} con IA…`);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROXY_API_CALL',
        payload: {
          endpoint: '/api/transform',
          method: 'POST',
          body: {
            text: this.currentText,
            transformation,
            tone,
            verbalMode: this.verbalMode,
            locale: 'es-CR',
            requestAIValidation: true,
          },
        },
      }) as {
        error?: string;
        status?: number;
        data?: {
          data?: {
            result?: string;
            source?: string;
            warnings?: Array<{ code: string; message: string }>;
          };
          error?: { code?: string; message?: string };
        };
      };

      if (!response) {
        this.showError('El service worker no respondió. Recargá la página e intentá de nuevo.');
        return;
      }

      if (response.error) {
        this.showError(this.friendlyError(response.error));
        return;
      }

      const apiErrorCode = response.data?.error?.code;
      if (apiErrorCode) {
        this.showError(this.friendlyError(apiErrorCode));
        return;
      }

      const transformResult = response.data?.data;
      const adapted = transformResult?.result;
      if (typeof adapted === 'string') {
        this.showDiff(originalText, adapted);
        this.currentText = adapted;
        this.updateTextarea(adapted);

        if (transformResult?.source === 'ai-fallback') {
          const warning = transformResult.warnings?.[0]?.message ?? 'El proveedor de IA no está disponible.';
          this.showError(`Error del proveedor de IA: ${warning}`);
        } else {
          const status = this.shadowRoot.querySelector('#edi-status');
          if (status) {
            status.textContent = '';
            status.setAttribute('role', 'status');
          }
        }
      } else {
        this.showError('No se recibió resultado del servicio. Intentá de nuevo.');
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error('[edi] requestAIToneTransformation error:', err);
      this.showError(`Error al conectar: ${detail}`);
    } finally {
      this.setAIToneLoadingState(false);
    }
  }

  private runLocalPreprocess(): void {
    const { result } = this.toneEngine.transform(this.currentText, 'remove-formatting');
    if (result !== this.currentText) {
      this.currentText = result;
      this.updateTextarea(result);
    }
  }

  // ── DOM helpers ─────────────────────────────────────────────────────────────

  private updateTextarea(text: string): void {
    const textarea = this.shadowRoot.querySelector<HTMLTextAreaElement>('#edi-text');
    if (textarea) textarea.value = text;
  }

  private showDiff(original: string, transformed: string): void {
    if (original === transformed) {
      this.clearDiff();
      return;
    }

    const { originalHtml, transformedHtml } = renderDiff(original, transformed);

    const origEl = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-original');
    const transEl = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-transformed');
    const toggleBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#edi-diff-toggle');
    const panel = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-panel');

    if (!origEl || !transEl) return;

    // Store full HTML so collapsing mid-animation can finish instantly
    this.pendingOrigHtml = originalHtml;
    this.pendingTransHtml = transformedHtml;

    // Cancel any previous animation
    this.cancelDiffAnimation();

    // Clear current content and mark both panels as animating
    origEl.innerHTML = '';
    transEl.innerHTML = '';
    origEl.classList.add('edi-animating');
    transEl.classList.add('edi-animating');

    // Auto-expand panel and show toggle button in expanded state
    if (toggleBtn) {
      toggleBtn.hidden = false;
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.textContent = 'Ver cambios ▴';
    }
    if (panel) panel.hidden = false;

    // Start typewriter animation
    this.animateDiffContent(
      origEl,
      transEl,
      this.parseHtmlToCharTokens(originalHtml),
      this.parseHtmlToCharTokens(transformedHtml),
    );
  }

  private clearDiff(): void {
    this.finishDiffAnimation();

    const origEl = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-original');
    const transEl = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-transformed');
    const toggleBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#edi-diff-toggle');
    const panel = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-panel');

    if (origEl) { origEl.innerHTML = ''; origEl.classList.remove('edi-animating'); }
    if (transEl) { transEl.innerHTML = ''; transEl.classList.remove('edi-animating'); }
    if (toggleBtn) {
      toggleBtn.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.textContent = 'Ver cambios ▾';
    }
    if (panel) panel.hidden = true;

    this.pendingOrigHtml = '';
    this.pendingTransHtml = '';
  }

  // ── Diff animation helpers ──────────────────────────────────────────────────

  /**
   * Parses the HTML output of `renderDiff` into a flat array of char tokens.
   * Only `<mark class="diff-del|diff-add">` elements and HTML-escaped plain
   * text are expected — no other tags will ever appear in renderDiff output.
   */
  private parseHtmlToCharTokens(html: string): Array<{ char: string; markClass?: string }> {
    const tokens: Array<{ char: string; markClass?: string }> = [];
    const markRe = /<mark class="(diff-del|diff-add)">([\s\S]*?)<\/mark>/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = markRe.exec(html)) !== null) {
      // Plain text before this mark
      for (const char of unescapeHtml(html.slice(lastIdx, match.index))) {
        tokens.push({ char });
      }
      // Characters inside the mark
      const cls = match[1]!;
      for (const char of unescapeHtml(match[2]!)) {
        tokens.push({ char, markClass: cls });
      }
      lastIdx = match.index + match[0].length;
    }
    // Remaining plain text after last mark
    for (const char of unescapeHtml(html.slice(lastIdx))) {
      tokens.push({ char });
    }
    return tokens;
  }

  /**
   * Typewriter-animates two diff panels in parallel, one char per tick.
   * Speed adapts so the whole animation takes roughly 700–900 ms regardless
   * of text length (min 6 ms/char, max 30 ms/char).
   */
  private animateDiffContent(
    origEl: HTMLElement,
    transEl: HTMLElement,
    origTokens: ReadonlyArray<{ char: string; markClass?: string }>,
    transTokens: ReadonlyArray<{ char: string; markClass?: string }>,
  ): void {
    const maxLen = Math.max(origTokens.length, transTokens.length);
    if (maxLen === 0) {
      origEl.classList.remove('edi-animating');
      transEl.classList.remove('edi-animating');
      return;
    }

    const CHAR_DELAY = Math.max(6, Math.min(30, Math.round(800 / maxLen)));
    let idx = 0;
    // Track the last open <mark> element in each panel to batch consecutive
    // same-class chars into one element (avoids per-char mark proliferation).
    let origMark: HTMLElement | null = null;
    let transMark: HTMLElement | null = null;

    const step = () => {
      if (idx < origTokens.length) {
        origMark = this.appendCharToken(origEl, origTokens[idx]!, origMark);
      }
      if (idx < transTokens.length) {
        transMark = this.appendCharToken(transEl, transTokens[idx]!, transMark);
      }
      idx++;

      if (idx < maxLen) {
        this.diffAnimationId = setTimeout(step, CHAR_DELAY);
      } else {
        // Animation complete — remove cursor
        this.diffAnimationId = null;
        origEl.classList.remove('edi-animating');
        transEl.classList.remove('edi-animating');
      }
    };

    step();
  }

  /**
   * Appends a single char token to an element, reusing the current open mark
   * element when the class matches (avoids one `<mark>` per character).
   * Returns the current open mark element (or null for plain text).
   */
  private appendCharToken(
    el: HTMLElement,
    token: { char: string; markClass?: string },
    currentMark: HTMLElement | null,
  ): HTMLElement | null {
    if (token.markClass) {
      if (currentMark?.className === token.markClass) {
        // Reuse existing mark — append char to its text node
        const last = currentMark.lastChild;
        if (last?.nodeType === 3 /* TEXT_NODE */) {
          last.textContent = (last.textContent ?? '') + token.char;
        } else {
          currentMark.appendChild(document.createTextNode(token.char));
        }
        return currentMark;
      }
      // New mark class — create a fresh <mark> element
      const mark = document.createElement('mark');
      mark.className = token.markClass;
      mark.appendChild(document.createTextNode(token.char));
      el.appendChild(mark);
      return mark;
    }

    // Plain text — append to last direct text node or create one
    const last = el.lastChild;
    if (last?.nodeType === 3 /* TEXT_NODE */) {
      last.textContent = (last.textContent ?? '') + token.char;
    } else {
      el.appendChild(document.createTextNode(token.char));
    }
    return null;
  }

  /** Cancels the running animation timeout without writing final content. */
  private cancelDiffAnimation(): void {
    if (this.diffAnimationId !== null) {
      clearTimeout(this.diffAnimationId);
      this.diffAnimationId = null;
    }
  }

  /**
   * Cancels any running animation and instantly renders the full diff HTML.
   * Called when the user collapses the panel mid-animation.
   */
  private finishDiffAnimation(): void {
    if (this.diffAnimationId === null) return;
    clearTimeout(this.diffAnimationId);
    this.diffAnimationId = null;

    const origEl = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-original');
    const transEl = this.shadowRoot.querySelector<HTMLElement>('#edi-diff-transformed');
    if (origEl) { origEl.innerHTML = this.pendingOrigHtml; origEl.classList.remove('edi-animating'); }
    if (transEl) { transEl.innerHTML = this.pendingTransHtml; transEl.classList.remove('edi-animating'); }
  }

  private setLoadingState(loading: boolean, message?: string): void {
    const btn = this.shadowRoot.querySelector<HTMLButtonElement>('#btn-ortografia');
    if (btn) {
      btn.disabled = loading;
      btn.setAttribute('aria-busy', String(loading));
    }

    const status = this.shadowRoot.querySelector('#edi-status');
    if (status) {
      if (loading) {
        // Show the loading message and remove any error role
        status.textContent = message ?? '';
        status.removeAttribute('role');
      } else if (status.getAttribute('role') !== 'alert') {
        // Only clear the status text if it is NOT showing an error message.
        // Error messages are set with role="alert" by showError(); we must not
        // overwrite them here so that users actually see the feedback.
        status.textContent = '';
        status.setAttribute('role', 'status');
      }
    }
  }

  private showError(message: string): void {
    const status = this.shadowRoot.querySelector('#edi-status');
    if (status) {
      status.textContent = message;
      status.setAttribute('role', 'alert');
    }
  }

  private showStatus(message: string): void {
    const status = this.shadowRoot.querySelector('#edi-status');
    if (status) {
      status.textContent = message;
      status.setAttribute('role', 'status');
    }
  }

  private async copyCurrentText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.currentText);
      this.showStatus('Texto copiado al portapapeles.');
      return;
    } catch {
      // Fallback for pages where navigator.clipboard is blocked.
    }

    const textarea = this.shadowRoot.querySelector<HTMLTextAreaElement>('#edi-text');
    if (!textarea) {
      this.showError('No se pudo copiar el texto. Intentá de nuevo.');
      return;
    }

    const previousStart = textarea.selectionStart;
    const previousEnd = textarea.selectionEnd;

    try {
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      if (copied) {
        this.showStatus('Texto copiado al portapapeles.');
      } else {
        this.showError('No se pudo copiar el texto. Intentá de nuevo.');
      }
    } catch {
      this.showError('No se pudo copiar el texto. Intentá de nuevo.');
    } finally {
      if (previousStart !== null && previousEnd !== null) {
        textarea.setSelectionRange(previousStart, previousEnd);
      }
    }
  }

  private setAIToneLoadingState(loading: boolean, message?: string): void {
    const toneSelectors = ['#btn-voseo', '#btn-tuteo', '#btn-ustedeo', '#btn-tone-mode-local', '#btn-tone-mode-ai', '#btn-mode-ind', '#btn-mode-imp'];
    for (const sel of toneSelectors) {
      const btn = this.shadowRoot.querySelector<HTMLButtonElement>(sel);
      if (btn) btn.disabled = loading;
    }

    const status = this.shadowRoot.querySelector('#edi-status');
    if (status) {
      if (loading) {
        status.textContent = message ?? '';
        status.removeAttribute('role');
      } else if (status.getAttribute('role') !== 'alert') {
        status.textContent = '';
        status.setAttribute('role', 'status');
      }
    }
  }

  private showWarnings(warnings: TransformationWarning[]): void {
    const status = this.shadowRoot.querySelector('#edi-status');
    if (status) {
      status.textContent = warnings.map((w) => w.message).join(' ');
      status.setAttribute('role', 'status');
    }
  }

  private friendlyError(code: string): string {
    const messages: Record<string, string> = {
      NOT_AUTHENTICATED: 'Debés iniciar sesión en EDI para usar la corrección con IA.',
      UNAUTHORIZED: 'Debés iniciar sesión en EDI para usar la corrección con IA.',
      QUOTA_EXCEEDED: 'Alcanzaste tu límite diario de correcciones con IA.',
      NETWORK_ERROR: 'Sin conexión. Las transformaciones locales siguen disponibles.',
      ENDPOINT_NOT_ALLOWED: 'Error de configuración.',
      NO_ACTIVE_CREDENTIAL:
        'No tenés una clave de IA configurada. Agregá tu API key en Credenciales en la web de EDI.',
      PROVIDER_ERROR: 'El proveedor de IA devolvió un error. Verificá tu API key.',
      QUOTA_LIMIT_EXCEEDED: 'Alcanzaste tu límite diario de correcciones con IA.',
    };
    return messages[code] ?? `Error: ${code}. Intentá de nuevo.`;
  }

  // ── Focus trap ──────────────────────────────────────────────────────────────

  private trapFocus(): void {
    const focusableSelectors =
      'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(
      this.shadowRoot.querySelectorAll<HTMLElement>(focusableSelectors),
    );
    if (focusable.length === 0) return;

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    this.keydownHandler = (evt: Event) => {
      const e = evt as KeyboardEvent;
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (this.shadowRoot.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (this.shadowRoot.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Attach to the panel element (HTMLElement supports full addEventListener overloads)
    const panel = this.shadowRoot.querySelector<HTMLElement>('#edi-panel');
    panel?.addEventListener('keydown', this.keydownHandler);
  }

  private releaseFocusTrap(): void {
    if (this.keydownHandler) {
      const panel = this.shadowRoot.querySelector<HTMLElement>('#edi-panel');
      panel?.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  // ── AI credential picker ────────────────────────────────────────────────────

  async loadCredentials(): Promise<void> {
    const statusText = this.shadowRoot.querySelector<HTMLElement>('#edi-ai-status-text');
    if (statusText) statusText.textContent = 'Cargando claves de IA…';

    try {
      const stored = await chrome.storage.local.get(['authToken', 'tokenExpiresAt']) as {
        authToken?: string;
        tokenExpiresAt?: number;
      };

      if (!stored.authToken) {
        this.showCredentialAccessMessage('Iniciá sesión para usar claves de IA.');
        return;
      }

      if (!stored.tokenExpiresAt || Date.now() > stored.tokenExpiresAt) {
        await chrome.storage.local.remove(['authToken', 'tokenExpiresAt']);
        this.showCredentialAccessMessage('Tu sesión expiró. Volvé a iniciar sesión.');
        return;
      }

      const authCheck = await this.proxyGet<{ data?: { user?: { id?: string } } }>('/api/auth/me');
      const unauthorized = authCheck?.error === 'NOT_AUTHENTICATED' || authCheck?.status === 401 || authCheck?.status === 403;
      if (!authCheck || unauthorized) {
        this.showCredentialAccessMessage('No hay acceso a tus claves de IA. Iniciá sesión de nuevo.');
        return;
      }

      let response: ProxyResponse<{ data?: CredentialItem[] }> | null = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        response = await this.proxyGet<{ data?: CredentialItem[] }>('/api/credentials');
        const shouldRetry = !response || response.error === 'NETWORK_ERROR';
        if (!shouldRetry) break;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (!response || response.error) {
        this.showCredentialAccessMessage('No se pudieron cargar tus claves de IA. Intentá de nuevo.');
        return;
      }

      if (!response.data?.data) {
        this.renderCredentialBar([]);
        return;
      }

      const creds = response.data.data.filter((cred) => cred.isEnabled !== false);
      this.renderCredentialBar(creds);
    } catch {
      this.showCredentialAccessMessage('No se pudieron verificar las claves de IA en este momento.');
    }
  }

  private async proxyGet<T>(endpoint: string): Promise<ProxyResponse<T> | null> {
    try {
      return await chrome.runtime.sendMessage({
        type: 'PROXY_API_CALL',
        payload: { endpoint, method: 'GET' },
      }) as ProxyResponse<T>;
    } catch {
      return null;
    }
  }

  private showCredentialAccessMessage(message: string): void {
    const statusText = this.shadowRoot.querySelector<HTMLElement>('#edi-ai-status-text');
    const picker = this.shadowRoot.querySelector<HTMLElement>('#edi-cred-picker');
    const toggleBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#edi-ai-toggle');

    if (statusText) statusText.textContent = message;
    if (picker) {
      picker.hidden = true;
      picker.innerHTML = '';
    }
    if (toggleBtn) {
      toggleBtn.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  private renderCredentialBar(creds: CredentialItem[]): void {
    const statusText = this.shadowRoot.querySelector<HTMLElement>('#edi-ai-status-text');
    const picker = this.shadowRoot.querySelector<HTMLElement>('#edi-cred-picker');
    const toggleBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#edi-ai-toggle');

    if (!statusText || !picker || !toggleBtn) return;

    const active = creds.find((c) => c.isActive && !c.isExpired) ?? null;

    // Update status text
    if (active) {
      const provLabel = PROVIDER_LABELS[active.provider] ?? active.provider;
      const model = active.selectedModel ?? AI_MODELS[active.provider] ?? '';
      statusText.textContent = `${provLabel} · ${active.label}${model ? ` · ${model}` : ''}`;
    } else {
      statusText.textContent = 'Sin clave de IA activa';
    }

    // Only show "Cambiar" if there are multiple credentials
    toggleBtn.hidden = creds.length <= 1;

    // Build picker items
    picker.innerHTML = '';
    for (const cred of creds) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'edi-cred-item';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(cred.isActive));
      if (cred.isExpired) btn.disabled = true;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'edi-cred-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'edi-cred-name';
      nameSpan.textContent = `${PROVIDER_LABELS[cred.provider] ?? cred.provider} · ${cred.label}`;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'edi-cred-meta';
      metaSpan.textContent = cred.isExpired
        ? 'Expirada'
        : (cred.selectedModel ?? AI_MODELS[cred.provider] ?? '');

      infoDiv.appendChild(nameSpan);
      infoDiv.appendChild(metaSpan);

      const activateBtn = document.createElement('button');
      activateBtn.type = 'button';
      activateBtn.className = 'edi-cred-activate';
      activateBtn.textContent = cred.isActive ? 'Activa' : 'Usar';
      activateBtn.disabled = cred.isActive || cred.isExpired;

      activateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!cred.isActive && !cred.isExpired) {
          void this.activateCredential(cred.id, creds);
        }
      });

      btn.appendChild(infoDiv);
      btn.appendChild(activateBtn);
      picker.appendChild(btn);
    }

    // Toggle button
    toggleBtn.addEventListener('click', () => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!expanded));
      picker.hidden = expanded;
    });
  }

  private async activateCredential(credentialId: string, currentCreds: CredentialItem[]): Promise<void> {
    const statusText = this.shadowRoot.querySelector<HTMLElement>('#edi-ai-status-text');
    if (statusText) statusText.textContent = 'Cambiando…';

    const response = await chrome.runtime.sendMessage({
      type: 'PROXY_API_CALL',
      payload: {
        endpoint: `/api/credentials/${credentialId}/activate`,
        method: 'PATCH',
      },
    }) as { error?: string; status?: number; data?: { data?: CredentialItem } };

    if (response.error || !response.data?.data) {
      if (statusText) statusText.textContent = 'Error al cambiar la clave';
      return;
    }

    // Update local creds state and re-render
    const updated = currentCreds.map((c) => ({
      ...c,
      isActive: c.id === credentialId,
    }));

    // Close the picker after activating
    const picker = this.shadowRoot.querySelector<HTMLElement>('#edi-cred-picker');
    const toggleBtn = this.shadowRoot.querySelector<HTMLButtonElement>('#edi-ai-toggle');
    if (picker) picker.hidden = true;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');

    this.renderCredentialBar(updated);
  }
}
