/// <reference types="chrome" />

import type { TransformationType, TransformationWarning } from '@edi/shared';
import { ToneEngine } from '../tone-engine/ToneEngine';
import { createModalHTML, setModalTextSafe } from './modal-template';
import { createModalStyles } from './modal-styles';

export interface ModalOptions {
  initialText: string;
  onApply: (text: string) => void;
  onClose: () => void;
}

export class ModalController {
  private readonly shadowHost: HTMLElement;
  private readonly shadowRoot: ShadowRoot;
  private readonly toneEngine: ToneEngine;
  private currentText: string = '';
  private keydownHandler: EventListener | null = null;

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

    // Local transformation buttons
    const localButtons: Array<[string, TransformationType]> = [
      ['#btn-uppercase', 'uppercase'],
      ['#btn-lowercase', 'lowercase'],
      ['#btn-sentence', 'sentence-case'],
      ['#btn-clean', 'remove-formatting'],
      ['#btn-voseo', 'tone-voseo-cr'],
      ['#btn-tuteo', 'tone-tuteo'],
      ['#btn-ustedeo', 'tone-ustedeo'],
    ];

    for (const [selector, transformation] of localButtons) {
      modal.querySelector(selector)?.addEventListener('click', () => {
        this.applyLocalTransformation(transformation);
      });
    }

    // AI orthography button
    modal.querySelector('#btn-ortografia')?.addEventListener('click', () => {
      void this.requestAICorrection();
    });

    // Keep currentText in sync with manual edits
    modal
      .querySelector<HTMLTextAreaElement>('#edi-text')
      ?.addEventListener('input', (e) => {
        this.currentText = (e.target as HTMLTextAreaElement).value;
      });
  }

  // ── Transformations ─────────────────────────────────────────────────────────

  private applyLocalTransformation(transformation: TransformationType): void {
    const { result, warnings } = this.toneEngine.transform(this.currentText, transformation);
    this.currentText = result;
    this.updateTextarea(result);

    if (warnings.length > 0) {
      this.showWarnings(warnings);
    } else {
      // Clear any previous status message
      const status = this.shadowRoot.querySelector('#edi-status');
      if (status) status.textContent = '';
    }
  }

  private async requestAICorrection(): Promise<void> {
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
      }) as { error?: string; data?: { data?: { result?: string } } };

      if (response.error) {
        this.showError(this.friendlyError(response.error));
        return;
      }

      const corrected = response.data?.data?.result;
      if (typeof corrected === 'string') {
        this.currentText = corrected;
        this.updateTextarea(corrected);
      }
    } catch {
      this.showError(
        'No se pudo conectar con el servicio de IA. Las transformaciones locales siguen disponibles.',
      );
    } finally {
      this.setLoadingState(false);
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

  private setLoadingState(loading: boolean, message?: string): void {
    const btn = this.shadowRoot.querySelector<HTMLButtonElement>('#btn-ortografia');
    const status = this.shadowRoot.querySelector('#edi-status');

    if (btn) {
      btn.disabled = loading;
      btn.setAttribute('aria-busy', String(loading));
    }
    if (status) {
      status.textContent = loading ? (message ?? '') : '';
      if (loading) {
        status.removeAttribute('role');
      } else {
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
      QUOTA_EXCEEDED: 'Alcanzaste tu límite diario de correcciones con IA.',
      NETWORK_ERROR: 'Sin conexión. Las transformaciones locales siguen disponibles.',
      ENDPOINT_NOT_ALLOWED: 'Error de configuración.',
    };
    return messages[code] ?? 'Error desconocido. Intentá de nuevo.';
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
}
