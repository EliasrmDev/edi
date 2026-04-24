/// <reference types="chrome" />

import type { TransformationType, TransformationWarning, ToneType } from '@edi/shared';
import { ToneEngine } from '../tone-engine/ToneEngine';
import { createModalHTML, setModalTextSafe } from './modal-template';
import { createModalStyles } from './modal-styles';

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
  isExpired: boolean;
  selectedModel: string | null;
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

    // Tone transform buttons — route to local ToneEngine or AI depending on toneMode
    const toneButtons: Array<[string, TransformationType]> = [
      ['#btn-voseo', 'tone-voseo-cr'],
      ['#btn-tuteo', 'tone-tuteo'],
      ['#btn-ustedeo', 'tone-ustedeo'],
    ];
    for (const [selector, transformation] of toneButtons) {
      modal.querySelector(selector)?.addEventListener('click', () => {
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

    // Keep currentText in sync with manual edits
    modal
      .querySelector<HTMLTextAreaElement>('#edi-text')
      ?.addEventListener('input', (e) => {
        this.currentText = (e.target as HTMLTextAreaElement).value;
      });

    // Sync toggle UI (toneMode persists across opens within the page session)
    this.updateToneModeUI();
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

  private async requestAIToneTransformation(transformation: TransformationType): Promise<void> {
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

  private setAIToneLoadingState(loading: boolean, message?: string): void {
    const toneSelectors = ['#btn-voseo', '#btn-tuteo', '#btn-ustedeo', '#btn-tone-mode-local', '#btn-tone-mode-ai'];
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
    try {
      const stored = await chrome.storage.local.get(['authToken']) as { authToken?: string };
      if (!stored.authToken) return;

      const response = await chrome.runtime.sendMessage({
        type: 'PROXY_API_CALL',
        payload: { endpoint: '/api/credentials', method: 'GET' },
      }) as { error?: string; status?: number; data?: { data?: CredentialItem[] } };

      if (response?.error || !response?.data?.data) return;

      const creds = response.data.data;
      this.renderCredentialBar(creds);
    } catch {
      // Non-blocking — credential bar simply won't render if the service worker
      // is unavailable (e.g. extension just reloaded).
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
