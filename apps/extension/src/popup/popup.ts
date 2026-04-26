/**
 * popup.ts — Extension popup UI controller (image converter)
 *
 * Architecture:
 *  - Heavy conversion off-loaded to converter.worker.ts via WorkerManager
 *  - Single-file mode: drag-drop + preview flow, worker-backed
 *  - Batch mode: multiple files queued, processed sequentially
 *  - Page image scanner via content script messages
 *  - Settings persistence via chrome.storage.sync
 */

/// <reference types="chrome" />
/// <reference types="vite/client" />

import {
  downloadBlob,
  formatBytes,
  getExtension,
  stemName,
} from '../image-converter/converter';
import type { Format, ConvertRequest, WorkerMsg } from '../image-converter/types';
import { transformText } from '../tone-engine';

// ─── WorkerManager ─────────────────────────────────────────────────────────

interface ConvertResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
}

class WorkerManager {
  private worker: Worker | null = null;
  private pending = new Map<
    string,
    {
      resolve: (r: ConvertResult) => void;
      reject: (e: Error) => void;
      onProgress: (pct: number, stage: string) => void;
    }
  >();

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(
      new URL('../image-converter/converter.worker.ts', import.meta.url),
      { type: 'module' },
    );
    this.worker.onmessage = ({ data }: MessageEvent<WorkerMsg>) => this.route(data);
    this.worker.onerror = (e: ErrorEvent) =>
      this.failAll(e.message ?? 'Worker crashed');
    return this.worker;
  }

  convert(
    blob: Blob,
    format: Format,
    quality: number,
    originalSize: number,
    onProgress: (pct: number, stage: string) => void,
  ): Promise<ConvertResult> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pending.set(id, { resolve, reject, onProgress });
      const req: ConvertRequest = { id, blob, format, quality, originalSize };
      this.ensureWorker().postMessage(req);
    });
  }

  cancel(): void {
    this.worker?.terminate();
    this.worker = null;
    this.failAll('Cancelled');
  }

  private route(data: WorkerMsg): void {
    const p = this.pending.get(data.id);
    if (!p) return;
    if (data.type === 'progress') {
      p.onProgress(data.percent, data.stage);
    } else if (data.type === 'result') {
      this.pending.delete(data.id);
      p.resolve(data);
    } else {
      this.pending.delete(data.id);
      p.reject(new Error(data.message));
    }
  }

  private failAll(message: string): void {
    const err = new Error(message);
    this.pending.forEach(({ reject }) => reject(err));
    this.pending.clear();
    this.worker = null;
  }
}

// ─── Batch state ───────────────────────────────────────────────────────────

interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  resultBlob: Blob | null;
  convertedSize: number;
  error: string | null;
}

// ─── Singleton instances ───────────────────────────────────────────────────

const workerManager = new WorkerManager();
let batchQueue: BatchItem[] = [];
let batchCancelled = false;

// ─── UI state ─────────────────────────────────────────────────────────────

let currentFile: File | null = null;
let currentBlobUrl: string | null = null;
let selectedFormat: Format = 'image/jpeg';
let batchFormat: Format = 'image/jpeg';
let quality = 0.92;
let batchQuality = 0.92;

// ─── DOM refs ─────────────────────────────────────────────────────────────

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const dropzone = $('dropzone');
const dropzoneContent = $('dropzoneContent');
const optionsPanel = $('options');
const preview = $<HTMLImageElement>('preview');
const previewMeta = $('previewMeta');
const qualityGroup = $('qualityGroup');
const qualitySlider = $<HTMLInputElement>('quality');
const qualityValue = $('qualityValue');
const convertBtn = $<HTMLAnchorElement>('convertBtn');
const progressWrap = $('progressWrap');
const progressStage = $('progressStage');
const progressPct = $('progressPct');
const progressFill = $('progressFill');
const resultInfo = $('resultInfo');
const panelConvert = $('panel-convert');
const panelPage = $('panel-page');
const pageImagesContainer = $('pageImagesContainer');
const defaultFormatSel = $<HTMLSelectElement>('defaultFormat');
const saveSettingsBtn = $<HTMLButtonElement>('saveSettings');
const floatingBtnToggle = $<HTMLButtonElement>('floatingBtnToggle');
const qualityPreviewWrap = $('qualityPreviewWrap');
const qualityPreviewImg = $<HTMLImageElement>('qualityPreviewImg');
const qualityPreviewMeta = $('qualityPreviewMeta');

// Batch DOM refs
const batchPanel = $('batchPanel');
const batchCount = $('batchCount');
const batchList = $('batchList');
const batchQualityGroup = $('batchQualityGroup');
const batchQualitySlider = $<HTMLInputElement>('batchQuality');
const batchQualityValue = $('batchQualityValue');
const batchProgressWrap = $('batchProgressWrap');
const batchProgressStage = $('batchProgressStage');
const batchProgressPct = $('batchProgressPct');
const batchProgressFill = $('batchProgressFill');
const batchProgressFile = $('batchProgressFile');
const batchConvertBtn = $<HTMLButtonElement>('batchConvertBtn');
const batchCancelBtn = $<HTMLButtonElement>('batchCancelBtn');
const batchResultInfo = $('batchResultInfo');
const batchClearBtn = $<HTMLButtonElement>('batchClearBtn');

const formatBtns = Array.from(
  document.querySelectorAll<HTMLButtonElement>('#options .format-btn'),
);
const batchFormatBtns = Array.from(
  document.querySelectorAll<HTMLButtonElement>('.batch-format .format-btn'),
);
const tabBtns = Array.from(
  document.querySelectorAll<HTMLButtonElement>('.tab'),
);
const modeBtns = Array.from(
  document.querySelectorAll<HTMLButtonElement>('.mode-btn'),
);
const modeImages = $('mode-images');
const modeText = $('mode-text');

// ─── Text mode DOM refs ────────────────────────────────────────────────────

const textPanelEditor = $('text-panel-editor');
const textPanelSettings = $('text-panel-settings');
const miniEditorTextarea = $<HTMLTextAreaElement>('mini-editor-textarea');
const miniEditorStatus = $('mini-editor-status');
const miniCopyBtn = $<HTMLButtonElement>('mini-copy-btn');
const aiInfoCard = $('ai-info-card');
const aiCredentialList = $('ai-credential-list');
const aiNoCredential = $('ai-no-credential');
const textTabBtns = Array.from(
  document.querySelectorAll<HTMLButtonElement>('.text-tab'),
);

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/webp,image/jpeg,image/png,image/*';
fileInput.multiple = true;

// ─── Boot ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupSaveSettings();

  loadSettings()
    .then(() => {
      setupModeSwitcher();
      setupTabs();
      setupDropzone();
      setupFormatBtns();
      setupQualitySlider();
      setupConvertBtn();
      if (batchPanel) setupBatch();
      setupTextTabs();
      setupMiniEditor();
      setupAuth();

      const imageUrl = new URLSearchParams(location.search).get('imageUrl');
      if (imageUrl) loadImageFromUrl(imageUrl);

      preAnalyzeTab();
    })
    .catch((err) => console.error('[EDI] Settings load error:', err));
});

// ─── Settings ─────────────────────────────────────────────────────────────

async function loadSettings(): Promise<void> {
  const stored = await chrome.storage.sync.get([
    'defaultFormat',
    'defaultQuality',
    'floatingBtnEnabled',
  ]);
  if (stored['defaultFormat']) {
    selectedFormat = batchFormat = stored['defaultFormat'] as Format;
  }
  if (stored['defaultQuality']) {
    quality = batchQuality = stored['defaultQuality'] as number;
    qualitySlider.value = String(Math.round(quality * 100));
    if (batchQualitySlider)
      batchQualitySlider.value = String(Math.round(quality * 100));
    qualityValue.textContent = `${Math.round(quality * 100)}%`;
    if (batchQualityValue)
      batchQualityValue.textContent = `${Math.round(quality * 100)}%`;
  }
  if (stored['defaultFormat']) {
    if (defaultFormatSel) defaultFormatSel.value = stored['defaultFormat'] as string;
  }
  // Floating button toggle — default enabled (undefined → true)
  const floatingEnabled = stored['floatingBtnEnabled'] !== false;
  if (floatingBtnToggle) {
    floatingBtnToggle.setAttribute('aria-checked', String(floatingEnabled));
    floatingBtnToggle.classList.toggle('active', floatingEnabled);
  }
  updateFormatUI();
  if (batchQualityGroup !== null) updateBatchFormatUI();
}

async function loadImageFromUrl(url: string): Promise<void> {
  try {
    let blob: Blob;
    let name: string;
    if (url.startsWith('data:')) {
      // Decode inline data: URL — fetch() is blocked for data: by CSP
      const [, base64 = ''] = url.split(',');
      const mime = url.split(':')[1]?.split(';')[0] ?? 'image/jpeg';
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      blob = new Blob([bytes], { type: mime });
      name = `image.${mime.split('/')[1] ?? 'jpg'}`;
    } else {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      blob = await res.blob();
      name = url.split('/').pop()?.split('?')[0] || 'image';
    }
    handleFile(new File([blob], name, { type: blob.type || 'image/jpeg' }));
  } catch (err) {
    showResult(
      `✗ Could not load image: ${err instanceof Error ? err.message : err}`,
      'error',
    );
  }
}

function setupSaveSettings(): void {
  // Floating button toggle
  floatingBtnToggle?.addEventListener('click', async () => {
    const current = floatingBtnToggle.getAttribute('aria-checked') === 'true';
    const next = !current;
    floatingBtnToggle.setAttribute('aria-checked', String(next));
    floatingBtnToggle.classList.toggle('active', next);
    await chrome.storage.sync.set({ floatingBtnEnabled: next });
    // Notify all tabs so content script reacts immediately
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'FLOATING_BTN_TOGGLE',
        payload: { enabled: next },
      }).catch(() => { /* tab may not have content script */ });
    }
  });

  saveSettingsBtn?.addEventListener('click', async () => {
    const fmt = (defaultFormatSel?.value ?? selectedFormat) as Format;
    selectedFormat = batchFormat = fmt;
    updateFormatUI();
    if (batchQualityGroup) updateBatchFormatUI();
    await chrome.storage.sync.set({
      defaultFormat: fmt,
      defaultQuality: quality,
    });
    if (saveSettingsBtn) {
      saveSettingsBtn.textContent = '✓ Guardado!';
      setTimeout(() => {
        saveSettingsBtn.textContent = 'Guardar ajustes';
      }, 2000);
    }
  });
}

// ─── Mode Switcher ───────────────────────────────────────────────────────

function setupModeSwitcher(): void {
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () =>
      switchMode(btn.dataset['mode'] ?? 'images'),
    );
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

function switchMode(mode: string): void {
  modeBtns.forEach((b) => {
    const active = b.dataset['mode'] === mode;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  modeImages.hidden = mode !== 'images';
  modeText.hidden = mode !== 'text';
}

// ─── Tabs ─────────────────────────────────────────────────────────────────

function setupTabs(): void {
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () =>
      switchTab(btn.dataset['tab'] ?? 'convert'),
    );
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

function switchTab(tab: string): void {
  tabBtns.forEach((b) => {
    const active = b.dataset['tab'] === tab;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });

  panelConvert.hidden = tab !== 'convert';
  panelPage.hidden = tab !== 'page';
  if (tab !== 'convert') {
    optionsPanel.hidden = true;
    dropzone.hidden = true;
  } else {
    dropzone.hidden = batchQueue.length > 0;
    batchPanel.hidden = batchQueue.length === 0;
    if (currentFile) optionsPanel.hidden = false;
  }

  if (tab === 'page') {
    if (pageAnalyzed) {
      pageImagesContainer.innerHTML = '';
      pageImagesRendered = 0;
      pageListEl = null;
      pageMoreBtn = null;
      if (pageImagesList.length > 0) {
        renderPageImagesList();
      } else {
        pageImagesContainer.innerHTML =
          '<p class="page-state">No images found on this page.</p>';
        const btn = document.createElement('button');
        btn.className = 'page-more-btn';
        btn.textContent = 'Search for new images';
        btn.addEventListener('click', () => loadPageImages(true));
        pageImagesContainer.appendChild(btn);
      }
    } else {
      loadPageImages(false);
    }
  }
}

// ─── Dropzone ─────────────────────────────────────────────────────────────

function setupDropzone(): void {
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  dropzone.addEventListener('dragleave', (e) => {
    if (!dropzone.contains(e.relatedTarget as Node))
      dropzone.classList.remove('drag-over');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer?.files.length) handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) handleFiles(fileInput.files);
    fileInput.value = '';
  });
}

function handleFiles(files: FileList): void {
  const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (images.length === 0) {
    showResult('Only image files are supported.', 'error');
    return;
  }
  if (images.length === 1 || !batchPanel) {
    batchQueue = [];
    if (batchPanel) batchPanel.hidden = true;
    dropzone.hidden = false;
    handleFile(images[0]!);
  } else {
    currentFile = null;
    optionsPanel.hidden = true;
    dropzone.hidden = true;
    batchPanel.hidden = false;
    initBatch(images);
  }
}

async function handleFile(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) {
    showResult('Only image files are supported.', 'error');
    return;
  }
  currentFile = file;
  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
  currentBlobUrl = URL.createObjectURL(file);

  const previewWrap = preview.parentElement!;
  previewWrap.hidden = false;
  preview.alt = file.name;
  preview.src = currentBlobUrl;
  await new Promise<void>((res) => {
    preview.onload = () => res();
  });

  previewMeta.textContent = buildOriginalMeta();
  dropzoneContent.hidden = true;
  dropzone.style.minHeight = '0';
  optionsPanel.hidden = false;
  resultInfo.hidden = true;
  if (progressWrap) progressWrap.hidden = true;
  resetConvertBtnLabel();
  updateQualityPreview();
}

function buildOriginalMeta(): string {
  if (!currentFile) return '';
  const origFmt = (currentFile.type.split('/')[1] ?? 'image').toUpperCase();
  const targetLabel =
    selectedFormat === 'image/jpeg'
      ? `JPG · ${Math.round(quality * 100)}% quality`
      : 'PNG';
  return [
    `${preview.naturalWidth}×${preview.naturalHeight}`,
    `${origFmt} · ${formatBytes(currentFile.size)}`,
    `→ ${targetLabel}`,
  ].join('  ·  ');
}

// ─── Format buttons ────────────────────────────────────────────────────────

function setupFormatBtns(): void {
  formatBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedFormat = btn.dataset['format'] as Format;
      updateFormatUI();
    });
  });
}

function updateFormatUI(): void {
  formatBtns.forEach((btn) => {
    const active = btn.dataset['format'] === selectedFormat;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  qualityGroup.hidden = selectedFormat !== 'image/jpeg';
  if (currentFile) previewMeta.textContent = buildOriginalMeta();
  updateQualityPreview();
}

// ─── Quality slider ────────────────────────────────────────────────────────

let qualityPreviewTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleQualityPreview(): void {
  if (qualityPreviewTimer) clearTimeout(qualityPreviewTimer);
  qualityPreviewTimer = setTimeout(updateQualityPreview, 80);
}

function updateQualityPreview(): void {
  if (
    !currentFile ||
    selectedFormat !== 'image/jpeg' ||
    !preview.naturalWidth
  ) {
    qualityPreviewWrap.hidden = true;
    return;
  }

  const MAX = 320;
  const scale = Math.min(
    1,
    MAX / Math.max(preview.naturalWidth, preview.naturalHeight),
  );
  const thumb = document.createElement('canvas');
  thumb.width = Math.round(preview.naturalWidth * scale);
  thumb.height = Math.round(preview.naturalHeight * scale);
  const tCtx = thumb.getContext('2d')!;
  tCtx.fillStyle = '#ffffff';
  tCtx.fillRect(0, 0, thumb.width, thumb.height);
  tCtx.drawImage(preview, 0, 0, thumb.width, thumb.height);
  qualityPreviewImg.src = thumb.toDataURL('image/jpeg', quality);
  qualityPreviewWrap.hidden = false;

  const full = document.createElement('canvas');
  full.width = preview.naturalWidth;
  full.height = preview.naturalHeight;
  const fCtx = full.getContext('2d')!;
  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(0, 0, full.width, full.height);
  fCtx.drawImage(preview, 0, 0, full.width, full.height);
  full.toBlob(
    (blob) => {
      if (!blob) return;
      const kb = (blob.size / 1000).toFixed(1);
      qualityPreviewMeta.textContent = `JPG · ${Math.round(quality * 100)}% quality · ${kb} KB`;
    },
    'image/jpeg',
    quality,
  );
}

function setupQualitySlider(): void {
  qualitySlider.addEventListener('input', () => {
    quality = Number(qualitySlider.value) / 100;
    qualityValue.textContent = `${qualitySlider.value}%`;
    if (currentFile) previewMeta.textContent = buildOriginalMeta();
    scheduleQualityPreview();
  });
}

// ─── Single-file conversion ────────────────────────────────────────────────

let isDownloadReady = false;

function setupConvertBtn(): void {
  convertBtn.addEventListener('click', (e) => {
    if (isDownloadReady) {
      isDownloadReady = false;
      return;
    }
    e.preventDefault();
    handleConvert();
  });
}

function setConverting(active: boolean): void {
  convertBtn.setAttribute('aria-disabled', String(active));
  if (progressWrap) progressWrap.hidden = !active;
  if (!active) setProgress(0, '');
}

function setProgress(pct: number, stage: string): void {
  if (progressFill) {
    progressFill.style.width = `${pct}%`;
    progressFill.setAttribute('aria-valuenow', String(pct));
  }
  if (progressStage) progressStage.textContent = stage;
  if (progressPct) progressPct.textContent = `${pct}%`;
}

function resetConvertBtnLabel(): void {
  convertBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" class="btn-icon">
      <path d="M2 8a6 6 0 1 0 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M5 5.5L8 2l3 3.5" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Convert &amp; Download`;
}

async function handleConvert(): Promise<void> {
  if (!currentFile) return;

  setConverting(true);
  resultInfo.hidden = true;

  try {
    const result = await workerManager.convert(
      currentFile,
      selectedFormat,
      quality,
      currentFile.size,
      (pct, stage) => setProgress(pct, stage),
    );

    const filename = `${stemName(currentFile.name)}.${getExtension(selectedFormat)}`;
    const objectUrl = URL.createObjectURL(result.blob);

    convertBtn.href = objectUrl;
    convertBtn.download = filename;
    resetConvertBtnLabel();

    setConverting(false);
    isDownloadReady = true;
    convertBtn.click();
    URL.revokeObjectURL(objectUrl);
    convertBtn.href = '#';

    const pct = (
      (1 - result.convertedSize / result.originalSize) *
      100
    ).toFixed(1);
    const sizeDiff =
      Number(pct) > 0
        ? ` — ${pct}% smaller`
        : Number(pct) < 0
          ? ` — ${Math.abs(Number(pct))}% larger (try PNG for sharp graphics)`
          : '';
    showResult(
      `✓ Downloaded ${filename} · ${formatBytes(result.convertedSize)}${sizeDiff}`,
      'success',
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Cancelled') return;
    setConverting(false);
    showResult(`✗ ${msg}`, 'error');
    resetConvertBtnLabel();
  }
}

// ─── Batch processing ──────────────────────────────────────────────────────

function setupBatch(): void {
  batchFormatBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      batchFormat = btn.dataset['format'] as Format;
      updateBatchFormatUI();
    });
  });

  batchQualitySlider.addEventListener('input', () => {
    batchQuality = Number(batchQualitySlider.value) / 100;
    batchQualityValue.textContent = `${batchQualitySlider.value}%`;
  });

  batchConvertBtn.addEventListener('click', runBatch);

  batchCancelBtn.addEventListener('click', () => {
    batchCancelled = true;
    workerManager.cancel();
    setBatchConverting(false);
    showBatchResult('Batch cancelled.', 'error');
    batchQueue.forEach((item) => {
      if (item.status === 'pending' || item.status === 'converting') {
        item.status = 'error';
        item.error = 'Cancelled';
      }
    });
    renderBatchItems();
  });

  batchClearBtn.addEventListener('click', clearBatch);
}

function updateBatchFormatUI(): void {
  if (!batchQualityGroup) return;
  batchFormatBtns.forEach((btn) => {
    const active = btn.dataset['format'] === batchFormat;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  batchQualityGroup.hidden = batchFormat !== 'image/jpeg';
}

function initBatch(files: File[]): void {
  batchCancelled = false;
  batchQueue = files.map((file) => ({
    id: crypto.randomUUID(),
    file,
    status: 'pending',
    progress: 0,
    resultBlob: null,
    convertedSize: 0,
    error: null,
  }));
  batchCount.textContent = `${files.length} file${files.length > 1 ? 's' : ''} ready`;
  batchResultInfo.hidden = true;
  batchProgressWrap.hidden = true;
  updateBatchFormatUI();
  renderBatchItems();
  batchConvertBtn.hidden = false;
  batchConvertBtn.disabled = false;
  batchConvertBtn.textContent = `Convert All (${files.length})`;
  batchCancelBtn.hidden = true;
}

function clearBatch(): void {
  batchQueue = [];
  batchPanel.hidden = true;
  dropzone.hidden = false;
  dropzone.style.minHeight = '';
  dropzoneContent.hidden = false;
  resultInfo.hidden = true;
}

async function runBatch(): Promise<void> {
  batchCancelled = false;
  setBatchConverting(true);
  batchResultInfo.hidden = true;

  batchQueue.forEach((item) => {
    if (item.status !== 'done') {
      item.status = 'pending';
      item.progress = 0;
      item.error = null;
    }
  });

  const pending = batchQueue.filter((item) => item.status !== 'done');
  let doneCount = batchQueue.filter((i) => i.status === 'done').length;
  const total = batchQueue.length;

  for (const item of pending) {
    if (batchCancelled) break;

    item.status = 'converting';
    renderBatchItem(item);

    try {
      const result = await workerManager.convert(
        item.file,
        batchFormat,
        batchQuality,
        item.file.size,
        (pct, stage) => {
          item.progress = pct;
          setBatchItemProgress(item.id, pct, stage);
          const overallPct = Math.round(
            ((doneCount + pct / 100) / total) * 100,
          );
          setBatchProgress(overallPct, stage, item.file.name);
        },
      );

      item.status = 'done';
      item.resultBlob = result.blob;
      item.convertedSize = result.convertedSize;
      doneCount++;

      const filename = `${stemName(item.file.name)}.${getExtension(batchFormat)}`;
      downloadBlob(result.blob, filename);
    } catch (err) {
      if (batchCancelled) break;
      item.status = 'error';
      item.error = err instanceof Error ? err.message : String(err);
    }

    renderBatchItem(item);
  }

  setBatchConverting(false);
  if (!batchCancelled) {
    const done = batchQueue.filter((i) => i.status === 'done').length;
    const errors = batchQueue.filter((i) => i.status === 'error').length;
    const msg =
      errors > 0
        ? `✓ ${done} converted, ${errors} failed`
        : `✓ All ${done} files converted & downloaded`;
    showBatchResult(msg, errors > 0 ? 'error' : 'success');
  }
}

function setBatchConverting(active: boolean): void {
  batchConvertBtn.hidden = active;
  batchCancelBtn.hidden = !active;
  batchProgressWrap.hidden = !active;
  if (!active) setBatchProgress(0, '', '');
}

function setBatchProgress(
  pct: number,
  stage: string,
  filename: string,
): void {
  batchProgressFill.style.width = `${pct}%`;
  batchProgressFill.setAttribute('aria-valuenow', String(pct));
  batchProgressStage.textContent = stage;
  batchProgressPct.textContent = `${pct}%`;
  batchProgressFile.textContent = filename ? `File: ${filename}` : '';
}

function setBatchItemProgress(
  id: string,
  pct: number,
  _stage: string,
): void {
  const fill = document.getElementById(`bfill-${id}`);
  const pctEl = document.getElementById(`bpct-${id}`);
  if (fill) fill.style.width = `${pct}%`;
  if (pctEl) pctEl.textContent = `${pct}%`;
}

function renderBatchItems(): void {
  batchList.innerHTML = '';
  batchQueue.forEach((item) => batchList.appendChild(buildBatchItem(item)));
}

function renderBatchItem(item: BatchItem): void {
  const existing = document.getElementById(`bitem-${item.id}`);
  const el = buildBatchItem(item);
  if (existing) existing.replaceWith(el);
  else batchList.appendChild(el);
}

function buildBatchItem(item: BatchItem): HTMLElement {
  const el = document.createElement('div');
  el.id = `bitem-${item.id}`;
  el.className = `batch-item batch-item--${item.status}`;

  const statusIcon: Record<BatchItem['status'], string> = {
    pending: '○',
    converting: '⟳',
    done: '✓',
    error: '✗',
  };

  const sizeInfo =
    item.status === 'done'
      ? ` · ${formatBytes(item.file.size)} → ${formatBytes(item.convertedSize)}`
      : ` · ${formatBytes(item.file.size)}`;

  el.innerHTML = `
    <span class="batch-item-status" aria-hidden="true">${statusIcon[item.status]}</span>
    <div class="batch-item-info">
      <span class="batch-item-name" title="${escHtml(item.file.name)}">${escHtml(stemName(item.file.name))}</span>
      <span class="batch-item-meta">${sizeInfo}${item.error ? ` · ${escHtml(item.error)}` : ''}</span>
      ${
        item.status === 'converting'
          ? `
        <div class="batch-item-progress">
          <div class="batch-item-fill" id="bfill-${item.id}" style="width:${item.progress}%"></div>
        </div>
        <span class="batch-item-pct" id="bpct-${item.id}">${item.progress}%</span>
      `
          : ''
      }
    </div>
    ${
      item.status === 'done' && item.resultBlob
        ? `
      <button class="batch-dl-btn" data-id="${item.id}" type="button"
              aria-label="Download ${escHtml(stemName(item.file.name))}">↓</button>
    `
        : ''
    }
  `;

  const dlBtn = el.querySelector<HTMLButtonElement>('.batch-dl-btn');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      if (!item.resultBlob) return;
      const filename = `${stemName(item.file.name)}.${getExtension(batchFormat)}`;
      downloadBlob(item.resultBlob, filename);
    });
  }

  return el;
}

// ─── Page images ───────────────────────────────────────────────────────────

const PAGE_BATCH = 5;
let pageImagesList: {
  url: string;
  width: number;
  height: number;
  alt: string;
  format: string;
}[] = [];
let pageImagesRendered = 0;
let pageListEl: HTMLDivElement | null = null;
let pageMoreBtn: HTMLButtonElement | null = null;
let pageAnalyzed = false;

async function loadPageImages(rescan = false): Promise<void> {
  pageImagesContainer.setAttribute('aria-busy', 'true');
  if (rescan) {
    pageImagesList = [];
    pageImagesRendered = 0;
    pageListEl = null;
    pageMoreBtn = null;
    pageImagesContainer.innerHTML =
      '<p class="page-state">Scanning page for new images…</p>';
  } else {
    pageImagesContainer.innerHTML =
      '<p class="page-state">Scanning page for images…</p>';
  }

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab?.id) throw new Error('Could not access the current tab.');

    const tabUrl = activeTab.url ?? '';
    if (isRestrictedUrl(tabUrl))
      throw new Error('This page is restricted and cannot be scanned.');

    // Try to reach existing content script
    let contentScriptReady = false;
    try {
      await chrome.tabs.sendMessage(activeTab.id, { type: 'PING' });
      contentScriptReady = true;
    } catch {
      // Content script not loaded on this page
    }

    if (!contentScriptReady) {
      throw new Error(
        'Content script not loaded. Please refresh this page and try again.',
      );
    }

    const response = (await chrome.tabs.sendMessage(activeTab.id, {
      type: 'SCAN_IMAGES',
    })) as {
      images: {
        url: string;
        width: number;
        height: number;
        alt: string;
        format: string;
      }[];
    };

    const knownUrls = new Set(pageImagesList.map((i) => i.url));
    const newImages = response.images.filter((i) => !knownUrls.has(i.url));

    if (rescan && !newImages.length) {
      pageImagesContainer.innerHTML =
        '<p class="page-state">No new images found.</p>';
      if (pageImagesList.length) renderPageImagesList();
      return;
    }
    if (!response.images.length && !pageImagesList.length) {
      pageImagesContainer.innerHTML =
        '<p class="page-state">No images found on this page.</p>';
      return;
    }

    pageImagesList = rescan
      ? [...pageImagesList, ...newImages]
      : response.images;
    pageAnalyzed = true;
    pageImagesContainer.innerHTML = '';
    pageImagesRendered = 0;
    renderPageImagesList();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    pageImagesContainer.innerHTML = `<p class="page-state page-state--error">Could not scan page: ${escHtml(msg)}</p>`;
  } finally {
    pageImagesContainer.setAttribute('aria-busy', 'false');
  }
}

async function preAnalyzeTab(): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab?.id) throw new Error('no tab');
    if (isRestrictedUrl(activeTab.url ?? '')) throw new Error('restricted');

    try {
      await chrome.tabs.sendMessage(activeTab.id, { type: 'PING' });
    } catch {
      throw new Error('no content script');
    }

    const response = (await chrome.tabs.sendMessage(activeTab.id, {
      type: 'SCAN_IMAGES',
    })) as {
      images: {
        url: string;
        width: number;
        height: number;
        alt: string;
        format: string;
      }[];
    };
    pageImagesList = response.images;
    pageAnalyzed = true;
    if (pageImagesList.length === 0) {
      const pageTabBtn = tabBtns.find((b) => b.dataset['tab'] === 'page');
      if (pageTabBtn) {
        pageTabBtn.hidden = true;
        pageTabBtn.setAttribute('aria-hidden', 'true');
      }
    }
  } catch {
    const pageTabBtn = tabBtns.find((b) => b.dataset['tab'] === 'page');
    if (pageTabBtn) {
      pageTabBtn.hidden = true;
      pageTabBtn.setAttribute('aria-hidden', 'true');
    }
  }
}

function isRestrictedUrl(url: string): boolean {
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url === '' ||
    url.startsWith('https://chrome.google.com/webstore')
  );
}

function renderPageImagesList(): void {
  if (!pageListEl) {
    pageListEl = document.createElement('div');
    pageListEl.className = 'page-list';
    pageImagesContainer.appendChild(pageListEl);
  }
  pageMoreBtn?.remove();
  pageMoreBtn = null;

  const end = Math.min(
    pageImagesRendered + PAGE_BATCH,
    pageImagesList.length,
  );
  for (let i = pageImagesRendered; i < end; i++) {
    pageListEl.appendChild(buildPageItem(pageImagesList[i]!));
  }
  pageImagesRendered = end;

  pageMoreBtn = document.createElement('button');
  pageMoreBtn.className = 'page-more-btn';
  const allRendered = pageImagesRendered >= pageImagesList.length;
  if (allRendered) {
    pageMoreBtn.textContent = 'Search for new images';
    pageMoreBtn.addEventListener('click', () => loadPageImages(true));
  } else {
    pageMoreBtn.textContent = `Show more (${pageImagesList.length - pageImagesRendered} remaining)`;
    pageMoreBtn.addEventListener('click', () => renderPageImagesList());
  }
  pageImagesContainer.appendChild(pageMoreBtn);
}

function buildPageItem(img: {
  url: string;
  width: number;
  height: number;
  alt: string;
  format: string;
}): HTMLElement {
  const item = document.createElement('div');
  item.className = 'page-item';

  const thumb = document.createElement('div');
  thumb.className = 'page-thumb';
  const thumbImg = document.createElement('img');
  thumbImg.alt = img.alt || '';
  thumbImg.loading = 'lazy';
  thumbImg.onerror = () => {
    thumbImg.remove();
    const broken = document.createElement('span');
    broken.className = 'page-thumb-broken';
    broken.textContent = '?';
    broken.title = 'Image unavailable';
    thumb.appendChild(broken);
    item
      .querySelectorAll<HTMLButtonElement>('.action-btn')
      .forEach((btn) => {
        btn.disabled = true;
        btn.title = 'Image could not be loaded';
      });
    const dims = item.querySelector('.page-dims');
    if (dims) dims.textContent = 'Unavailable';
  };
  thumbImg.src = img.url;
  thumb.appendChild(thumbImg);

  const info = document.createElement('div');
  info.className = 'page-info';
  const name = document.createElement('p');
  name.className = 'page-name';
  name.textContent = stemName(img.url);
  name.title = img.url;
  const dims = document.createElement('p');
  dims.className = 'page-dims';
  dims.textContent =
    img.width && img.height
      ? `${img.width}×${img.height} · ${img.format}`
      : img.format;
  const actions = document.createElement('div');
  actions.className = 'page-actions';

  (['JPG', 'PNG'] as const).forEach((label) => {
    const fmt: Format = label === 'JPG' ? 'image/jpeg' : 'image/png';
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.textContent = label;
    btn.setAttribute('aria-label', `Convert to ${label}`);
    btn.addEventListener('click', () =>
      convertPageImage(img.url, fmt, btn, label),
    );
    actions.appendChild(btn);
  });

  info.append(name, dims, actions);
  item.append(thumb, info);
  return item;
}

async function convertPageImage(
  url: string,
  format: Format,
  btn: HTMLButtonElement,
  label: string,
): Promise<void> {
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const resp = (await chrome.runtime.sendMessage({
      type: 'FETCH_CONVERT',
      url,
      format,
      quality: format === 'image/jpeg' ? quality : undefined,
    })) as {
      ok: boolean;
      bytes?: number[];
      format?: Format;
      error?: string;
    };

    if (!resp.ok || !resp.bytes) throw new Error(resp.error ?? 'Unknown error');
    const blob = new Blob([new Uint8Array(resp.bytes)], { type: format });
    const filename = `${stemName(url)}.${getExtension(format)}`;
    downloadBlob(blob, filename);
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = label;
      btn.disabled = false;
    }, 2500);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    btn.textContent = '✗';
    btn.title = msg;
    setTimeout(() => {
      btn.textContent = label;
      btn.disabled = false;
      btn.title = '';
    }, 3000);
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function showResult(message: string, type: 'success' | 'error'): void {
  resultInfo.textContent = message;
  resultInfo.setAttribute('data-type', type);
  resultInfo.hidden = false;
}

function showBatchResult(message: string, type: 'success' | 'error'): void {
  batchResultInfo.textContent = message;
  batchResultInfo.setAttribute('data-type', type);
  batchResultInfo.hidden = false;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Auth ──────────────────────────────────────────────────────────────────

const API_BASE: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';

// Locale from the authenticated user's profile — updated on login and refreshed in background.
// Defaults to 'es-CR' so local transforms always work without a network call.
let popupLocale = 'es-CR';

/** Update the voseo card name and subtitle to reflect the user's locale. */
function applyVoseoCardLocale(locale: string): void {
  const card = document.querySelector('[data-transform="tone-voseo-cr"]');
  if (!card) return;
  const nameEl = card.querySelector<HTMLElement>('.mini-tone-card-name');
  const subEl = card.querySelector<HTMLElement>('.mini-tone-card-sub');
  if (nameEl) {
    nameEl.textContent = locale === 'es-419' ? 'Voseo' : locale === 'es' ? 'Voseo ES' : 'Voseo CR';
  }
  if (subEl) {
    subEl.textContent = locale === 'es-CR' ? 'Costa Rica' : `${locale}`;
  }
}

/** Fire-and-forget: record a local transform in the usage DB. */
async function recordLocalTransform(
  transformationType: string,
  processingMs: number,
): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(['authToken']) as { authToken?: string };
    if (!stored.authToken) return;
    await fetch(`${API_BASE}/api/transform/record-local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stored.authToken}`,
      },
      body: JSON.stringify({ transformationType, processingMs, clientHint: 'popup' }),
    });
  } catch {
    // best-effort — never throw
  }
}

// ─── AI provider/model constants ──────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  'google-ai': 'Google AI',
  openrouter: 'OpenRouter',
};

const AI_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  'google-ai': 'gemini-1.5-flash',
  openrouter: 'openai/gpt-4o-mini',
};

// ─── Text sub-tabs ────────────────────────────────────────────────────────

function setupTextTabs(): void {
  textTabBtns.forEach((btn) => {
    btn.addEventListener('click', () =>
      switchTextTab((btn.dataset['textTab'] ?? 'editor') as 'editor' | 'settings'),
    );
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

function switchTextTab(tab: 'editor' | 'settings'): void {
  textTabBtns.forEach((b) => {
    const active = b.dataset['textTab'] === tab;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  textPanelEditor.hidden = tab !== 'editor';
  textPanelSettings.hidden = tab !== 'settings';
}

// ─── Mini editor ─────────────────────────────────────────────────────────

function setMiniStatus(
  message: string,
  type: 'success' | 'error' | 'warning' | '',
): void {
  miniEditorStatus.textContent = message;
  miniEditorStatus.setAttribute('data-type', type);
  miniEditorStatus.hidden = !message;
}

function setupMiniEditor(): void {
  // Local + AI transform buttons
  const transformBtns = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      '#text-panel-editor [data-transform]',
    ),
  );

  const AI_TRANSFORMS = new Set([
    'correct-orthography',
    'copy-writing-cr',
  ]);

  const TONE_TRANSFORMS = new Set([
    'tone-voseo-cr',
    'tone-tuteo',
    'tone-ustedeo',
  ]);

  let popupToneMode: 'local' | 'ai' = 'local';
  let popupVerbalMode: 'indicativo' | 'imperativo' = 'indicativo';

  const toneBtnsContainer = document.querySelector<HTMLElement>('#popup-tone-btns');
  const toneLocalBtn = document.querySelector<HTMLButtonElement>('#btn-popup-tone-local');
  const toneAIBtn = document.querySelector<HTMLButtonElement>('#btn-popup-tone-ai');
  const verbalModeIndBtn = document.querySelector<HTMLButtonElement>('#btn-popup-mode-ind');
  const verbalModeImpBtn = document.querySelector<HTMLButtonElement>('#btn-popup-mode-imp');

  function updatePopupToneModeUI(): void {
    if (toneBtnsContainer) toneBtnsContainer.dataset['mode'] = popupToneMode;
    if (toneLocalBtn) toneLocalBtn.setAttribute('aria-pressed', String(popupToneMode === 'local'));
    if (toneAIBtn) toneAIBtn.setAttribute('aria-pressed', String(popupToneMode === 'ai'));
  }

  function updatePopupVerbalModeUI(): void {
    if (verbalModeIndBtn) verbalModeIndBtn.setAttribute('aria-pressed', String(popupVerbalMode === 'indicativo'));
    if (verbalModeImpBtn) verbalModeImpBtn.setAttribute('aria-pressed', String(popupVerbalMode === 'imperativo'));
  }

  toneLocalBtn?.addEventListener('click', () => {
    popupToneMode = 'local';
    updatePopupToneModeUI();
  });
  toneAIBtn?.addEventListener('click', () => {
    popupToneMode = 'ai';
    updatePopupToneModeUI();
  });
  verbalModeIndBtn?.addEventListener('click', () => {
    popupVerbalMode = 'indicativo';
    updatePopupVerbalModeUI();
  });
  verbalModeImpBtn?.addEventListener('click', () => {
    popupVerbalMode = 'imperativo';
    updatePopupVerbalModeUI();
  });

  transformBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const transformation = btn.dataset['transform'] ?? '';
      const text = miniEditorTextarea.value;

      if (!text.trim()) {
        setMiniStatus('Escribí o pegá texto primero.', 'warning');
        return;
      }

      if (TONE_TRANSFORMS.has(transformation)) {
        if (popupToneMode === 'ai') {
          await runMiniAITransform(btn, transformation, text);
        } else {
          try {
            const start = Date.now();
            const result = transformText(
              text,
              transformation as Parameters<typeof transformText>[1],
              popupVerbalMode,
            );
            miniEditorTextarea.value = result.result;
            setMiniStatus('', '');
            void recordLocalTransform(transformation, Date.now() - start);
          } catch {
            setMiniStatus('Error al transformar el texto.', 'error');
          }
        }
      } else if (AI_TRANSFORMS.has(transformation)) {
        await runMiniAITransform(btn, transformation, text);
      } else {
        try {
          const start = Date.now();
          const result = transformText(
            text,
            transformation as Parameters<typeof transformText>[1],
          );
          miniEditorTextarea.value = result.result;
          setMiniStatus('', '');
          void recordLocalTransform(transformation, Date.now() - start);
        } catch {
          setMiniStatus('Error al transformar el texto.', 'error');
        }
      }
    });
  });

  // Copy button
  miniCopyBtn?.addEventListener('click', () => {
    const text = miniEditorTextarea.value;
    if (!text) return;
    void navigator.clipboard.writeText(text).then(
      () => setMiniStatus('¡Copiado!', 'success'),
      () => setMiniStatus('No se pudo copiar. Usá Ctrl+C.', 'error'),
    );
  });
}

async function runMiniAITransform(
  _btn: HTMLButtonElement,
  transformation: string,
  text: string,
  verbalMode: 'indicativo' | 'imperativo' = 'indicativo',
): Promise<void> {
  const stored = await chrome.storage.local.get(['authToken']) as {
    authToken?: string;
  };

  if (!stored.authToken) {
    setMiniStatus('Iniciá sesión en Ajustes para usar funciones de IA.', 'warning');
    return;
  }

  const allBtns = Array.from(
    document.querySelectorAll<HTMLButtonElement>('#text-panel-editor [data-transform]'),
  );
  allBtns.forEach((b) => { b.disabled = true; });
  setMiniStatus('Transformando con IA…', '');

  // Build copyConfig from localStorage for copy-writing-cr
  let copyConfig: Record<string, unknown> | undefined;
  if (transformation === 'copy-writing-cr') {
    const defaults = {
      tratamiento: 'voseo',
      modoVerbal: 'imperativo',
      contexto: 'anuncio',
      canal: 'web',
      formalidad: 'medio',
      objetivo: 'convertir',
      intensidadCambio: 'moderada',
    };
    try {
      const saved = localStorage.getItem('edi-copy-config-default');
      copyConfig = saved ? { ...defaults, ...(JSON.parse(saved) as Record<string, unknown>) } : defaults;
    } catch {
      copyConfig = defaults;
    }
  }

  try {
    const res = await fetch(`${API_BASE}/api/transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stored.authToken}`,
      },
      body: JSON.stringify({
        text,
        transformation,
        locale: popupLocale,
        requestAIValidation: true,
        verbalMode,
        ...(copyConfig ? { copyConfig } : {}),
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string };
      };
      const code = body.error?.code ?? '';
      const MINI_ERRORS: Record<string, string> = {
        QUOTA_EXCEEDED: 'Límite diario de IA alcanzado.',
        QUOTA_LIMIT_EXCEEDED: 'Límite diario de IA alcanzado.',
        NO_ACTIVE_CREDENTIAL: 'No tenés claves de IA configuradas.',
        UNAUTHORIZED: 'Sesión expirada. Iniciá sesión de nuevo.',
      };
      setMiniStatus(MINI_ERRORS[code] ?? 'Error del servidor. Intentá de nuevo.', 'error');
      return;
    }

    const data = (await res.json()) as {
      data?: { result?: string; warnings?: { message: string }[] };
    };

    const result = data.data?.result;
    if (typeof result === 'string') {
      miniEditorTextarea.value = result;
      const warning = data.data?.warnings?.[0]?.message;
      if (warning) {
        setMiniStatus(warning, 'warning');
      } else {
        setMiniStatus('', '');
      }
    }
  } catch {
    setMiniStatus('Sin conexión. Verificá tu red.', 'error');
  } finally {
    allBtns.forEach((b) => { b.disabled = false; });
  }
}

// ─── AI credential info ───────────────────────────────────────────────────

interface CredentialInfo {
  id: string;
  provider: string;
  label: string;
  isActive: boolean;
  isEnabled: boolean;
  isExpired: boolean;
  selectedModel: string | null;
}

interface ProviderUsageResult {
  provider: string;
  supported: boolean;
  creditsUsed?: number;
  creditsLimit?: number | null;
  creditsRemaining?: number | null;
  isFreeTier?: boolean;
  unavailableUrl?: string;
}

async function loadProviderUsage(credentialId: string): Promise<ProviderUsageResult | null> {
  const stored = (await chrome.storage.local.get(['authToken'])) as { authToken?: string };
  if (!stored.authToken) return null;
  try {
    const res = await fetch(`${API_BASE}/api/credentials/${credentialId}/provider-usage`, {
      headers: { Authorization: `Bearer ${stored.authToken}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: ProviderUsageResult };
    console.log('/provider-usage', body);
    return body.data ?? null;
  } catch {
    return null;
  }
}

function renderUsageBlock(container: HTMLElement, usage: ProviderUsageResult | null): void {
  container.innerHTML = '';

  if (usage === null) {
    const err = document.createElement('span');
    err.className = 'cred-usage-error';
    err.textContent = 'No se pudo cargar el consumo';
    container.appendChild(err);
    return;
  }

  if (!usage.supported) {
    const link = document.createElement('a');
    link.href = usage.unavailableUrl ?? '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'cred-usage-link';
    link.textContent = 'Ver consumo →';
    container.appendChild(link);
    return;
  }

  const usedUsd = (usage.creditsUsed ?? 0).toFixed(4);

  if (usage.isFreeTier) {
    const stat = document.createElement('span');
    stat.className = 'cred-usage-stat';
    stat.textContent = `$${usedUsd} USD · Free tier`;
    container.appendChild(stat);
    return;
  }

  const limit = usage.creditsLimit;
  if (limit !== null && limit !== undefined && limit > 0) {
    const used = usage.creditsUsed ?? 0;
    const pct = Math.min(100, (used / limit) * 100);
    const remaining = usage.creditsRemaining ?? Math.max(0, limit - used);

    const barWrap = document.createElement('div');
    barWrap.className = 'cred-usage-bar-wrap';
    const barFill = document.createElement('div');
    barFill.className = 'cred-usage-bar-fill';
    barFill.style.width = `${pct}%`;
    barWrap.appendChild(barFill);
    container.appendChild(barWrap);

    const stat = document.createElement('span');
    stat.className = 'cred-usage-stat';
    stat.textContent = `$${usedUsd} / $${limit.toFixed(2)} USD · Disponible: $${remaining.toFixed(4)}`;
    container.appendChild(stat);
  } else {
    const stat = document.createElement('span');
    stat.className = 'cred-usage-stat';
    stat.textContent = `$${usedUsd} USD gastado este mes`;
    container.appendChild(stat);
  }
}

function renderCredentialList(creds: CredentialInfo[]): void {
  // Update active provider chip in the editor panel
  const chip = document.getElementById('active-provider-chip');
  const chipText = document.getElementById('active-provider-chip-text');
  const activeCred = creds.find((c) => c.isActive && !c.isExpired);
  if (chip && chipText) {
    if (activeCred) {
      const providerLabel = PROVIDER_LABELS[activeCred.provider] ?? activeCred.provider;
      const model = activeCred.selectedModel ?? AI_MODELS[activeCred.provider] ?? activeCred.label;
      chipText.textContent = `${providerLabel} · ${model}`;
      chip.hidden = false;
    } else {
      chip.hidden = true;
    }
  }

  if (creds.length === 0) {
    aiInfoCard.hidden = true;
    aiNoCredential.hidden = false;
    return;
  }

  aiNoCredential.hidden = true;
  aiInfoCard.hidden = false;

  if (!aiCredentialList) return;
  aiCredentialList.innerHTML = '';

  for (const cred of creds) {
    const item = document.createElement('div');
    item.className = 'ai-cred-item'
      + (cred.id === activeCred?.id ? ' ai-cred-item--active' : '')
      + (cred.isExpired ? ' ai-cred-item--expired' : '');

    const info = document.createElement('div');
    info.className = 'ai-cred-info';

    const name = document.createElement('span');
    name.className = 'ai-cred-name';
    name.textContent = `${PROVIDER_LABELS[cred.provider] ?? cred.provider} · ${cred.label}`;

    const meta = document.createElement('span');
    meta.className = 'ai-cred-meta';
    meta.textContent = cred.isExpired
      ? 'Expirada'
      : (cred.selectedModel ?? AI_MODELS[cred.provider] ?? '');

    info.appendChild(name);
    info.appendChild(meta);
    item.appendChild(info);

    if (cred.isActive && !cred.isExpired && cred.id === activeCred?.id) {
      const badge = document.createElement('span');
      badge.className = 'ai-cred-active-badge';
      badge.textContent = '✓ En uso';
      item.appendChild(badge);
    } else if (!cred.isExpired) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ai-cred-activate-btn';
      btn.textContent = 'Usar';
      btn.setAttribute('aria-label', `Usar ${PROVIDER_LABELS[cred.provider] ?? cred.provider} · ${cred.label}`);
      btn.addEventListener('click', () => {
        void activateCredential(cred.id, creds, btn);
      });
      item.appendChild(btn);
    }

    // Usage block — filled asynchronously
    const usageBlock = document.createElement('div');
    usageBlock.className = 'cred-usage-block';
    const usageLoading = document.createElement('span');
    usageLoading.className = 'cred-usage-loading';
    usageLoading.textContent = 'Cargando…';
    usageBlock.appendChild(usageLoading);
    item.appendChild(usageBlock);

    aiCredentialList.appendChild(item);

    loadProviderUsage(cred.id).then((usage) => {
      renderUsageBlock(usageBlock, usage);
    }).catch(() => {
      renderUsageBlock(usageBlock, null);
    });
  }
}

async function activateCredential(
  credentialId: string,
  currentCreds: CredentialInfo[],
  triggerBtn?: HTMLButtonElement,
): Promise<void> {
  const stored = await chrome.storage.local.get(['authToken']) as { authToken?: string };
  if (!stored.authToken) return;

  if (triggerBtn) {
    triggerBtn.textContent = '…';
    triggerBtn.disabled = true;
  }
  // Disable all other Usar buttons while request is in flight
  aiCredentialList?.querySelectorAll<HTMLButtonElement>('.ai-cred-activate-btn')
    .forEach((b) => { b.disabled = true; });

  try {
    const res = await fetch(`${API_BASE}/api/credentials/${credentialId}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${stored.authToken}` },
    });
    if (!res.ok) {
      if (triggerBtn) {
        triggerBtn.textContent = 'Error';
        setTimeout(() => {
          triggerBtn.textContent = 'Usar';
          triggerBtn.disabled = false;
          aiCredentialList?.querySelectorAll<HTMLButtonElement>('.ai-cred-activate-btn')
            .forEach((b) => { b.disabled = false; });
        }, 2000);
      }
      return;
    }

    const updated = currentCreds.map((c) => ({ ...c, isActive: c.id === credentialId }));
    renderCredentialList(updated);
  } catch {
    if (triggerBtn) {
      triggerBtn.textContent = 'Usar';
      triggerBtn.disabled = false;
    }
    aiCredentialList?.querySelectorAll<HTMLButtonElement>('.ai-cred-activate-btn')
      .forEach((b) => { b.disabled = false; });
  }
}

/** @deprecated kept for call-sites that pass null to clear */
function renderAIInfo(_cred: null): void {
  renderCredentialList([]);
}

async function loadAICredential(token: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/credentials`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      renderAIInfo(null);
      return;
    }
    const body = (await res.json()) as {
      data?: { id?: string; provider?: string; label?: string; isActive?: boolean; isEnabled?: boolean; isExpired?: boolean; selectedModel?: string | null }[];
    };
    const creds: CredentialInfo[] = (body.data ?? [])
      .filter((c): c is Required<typeof c> => !!c.id && !!c.provider && !!c.label)
      .filter((c) => c.isEnabled !== false)
      .map((c) => ({
        id: c.id,
        provider: c.provider,
        label: c.label,
        isActive: c.isActive ?? false,
        isEnabled: c.isEnabled ?? true,
        isExpired: c.isExpired ?? false,
        selectedModel: c.selectedModel ?? null,
      }));
    renderCredentialList(creds);
  } catch {
    renderAIInfo(null);
  }
}

interface MeResponse {
  data?: {
    user?: { email?: string; displayName?: string | null };
    profile?: { preferredLocale?: string };
  };
}

interface LoginResponse {
  data?: { token?: string; expiresAt?: number };
  error?: { message?: string };
}

interface QuotaResponse {
  data?: {
    // Normal quota record
    dailyUsed?: number;
    dailyLimit?: number;
    monthlyUsed?: number;
    monthlyLimit?: number;
    resetDailyAt?: string;
    resetMonthlyAt?: string;
    // Returned when no quota record exists
    unlimited?: boolean;
    message?: string;
  };
}

function setupAuth(): void {
  const form = document.getElementById('auth-form') as HTMLFormElement | null;
  const logoutBtn = document.getElementById('auth-logout');
  const openWebBtn = document.getElementById('auth-open-web');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (document.getElementById('auth-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('auth-password') as HTMLInputElement).value;
    void doLogin(email, password);
  });

  logoutBtn?.addEventListener('click', () => void doLogout());

  openWebBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const extId = chrome.runtime.id;
    const webUrl = import.meta.env['VITE_WEB_URL'] ?? 'http://localhost:3000';
    const authUrl = `${webUrl}/extension-auth?extId=${encodeURIComponent(extId)}`;

    void chrome.tabs.create({ url: authUrl }, (tab) => {
      // Listen for the token being stored — the web page sends STORE_AUTH_TOKEN
      // via chrome.runtime.sendMessage (externally_connectable), which the service
      // worker stores in chrome.storage.local, which fires onChanged here.
      const onTokenStored = (
        changes: Record<string, chrome.storage.StorageChange>,
        area: string,
      ) => {
        if (area !== 'local' || !('authToken' in changes)) return;
        if (!changes['authToken']?.newValue) return;

        chrome.storage.onChanged.removeListener(onTokenStored);

        // Close the auth tab (the web page also calls window.close(), but belt-and-suspenders)
        if (tab?.id) {
          chrome.tabs.remove(tab.id).catch(() => { /* already closed */ });
        }

        void checkAndRenderAuth();
      };

      chrome.storage.onChanged.addListener(onTokenStored);
    });
  });

  void checkAndRenderAuth();
}

async function checkAndRenderAuth(): Promise<void> {
  // Read local storage only — no network call on popup open.
  // The token expiry is set by the server at login time; trust it locally
  // (same approach as the service worker's GET_AUTH_TOKEN handler).
  const stored = await chrome.storage.local.get([
    'authToken', 'tokenExpiresAt', 'authUserEmail', 'authUserName', 'preferredLocale',
  ]) as {
    authToken?: string;
    tokenExpiresAt?: number;
    authUserEmail?: string;
    authUserName?: string | null;
    preferredLocale?: string;
  };

  if (!stored.authToken || !stored.tokenExpiresAt || Date.now() > stored.tokenExpiresAt) {
    await chrome.storage.local.remove(['authToken', 'tokenExpiresAt', 'authUserEmail', 'authUserName', 'preferredLocale']);
    renderAIInfo(null);
    showAuthState('logged-out');
    return;
  }

  // Apply cached locale immediately so the card subtitle is correct on popup open.
  if (stored.preferredLocale) {
    popupLocale = stored.preferredLocale;
    applyVoseoCardLocale(stored.preferredLocale);
  }

  renderLoggedIn(stored.authUserName ?? null, stored.authUserEmail ?? '', stored.authToken);
}

async function doLogin(email: string, password: string): Promise<void> {
  const submitBtn = document.getElementById('auth-submit') as HTMLButtonElement | null;
  const errorEl = document.getElementById('auth-error');

  if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Iniciando sesión…'; }

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = (await res.json()) as LoginResponse;

    if (!res.ok) {
      const msg = body.error?.message ?? 'Correo o contraseña incorrectos.';
      if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; }
      return;
    }

    const token = body.data?.token;
    const expiresAt = body.data?.expiresAt;

    if (!token || !expiresAt) {
      if (errorEl) { errorEl.textContent = 'Respuesta inesperada del servidor.'; errorEl.hidden = false; }
      return;
    }

    await chrome.storage.local.set({ authToken: token, tokenExpiresAt: expiresAt, authUserEmail: email });

    // Clear the form
    (document.getElementById('auth-email') as HTMLInputElement).value = '';
    (document.getElementById('auth-password') as HTMLInputElement).value = '';

    // Show logged-in state immediately with the email we already have
    renderLoggedIn(null, email, token);

    // Fetch display name in the background and update the UI if available
    void fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) return;
        const meBody = (await res.json()) as MeResponse;
        const displayName = meBody.data?.user?.displayName ?? null;
        if (displayName) {
          await chrome.storage.local.set({ authUserName: displayName });
          const nameEl = document.getElementById('auth-user-name');
          const avatarEl = document.getElementById('auth-avatar');
          if (nameEl) nameEl.textContent = displayName;
          if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
        }
      })
      .catch(() => { /* display name is non-critical */ });
  } catch {
    if (errorEl) { errorEl.textContent = 'Sin conexión. Verificá tu red e intentá de nuevo.'; errorEl.hidden = false; }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Iniciar sesión'; }
  }
}

async function doLogout(): Promise<void> {
  const stored = await chrome.storage.local.get(['authToken']) as { authToken?: string };

  // Best-effort server logout
  if (stored.authToken) {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stored.authToken}` },
    }).catch(() => { /* ignore */ });
  }

  await chrome.storage.local.remove(['authToken', 'tokenExpiresAt', 'authUserEmail', 'authUserName', 'preferredLocale']);
  popupLocale = 'es-CR';
  applyVoseoCardLocale('es-CR');
  renderAIInfo(null);
  showAuthState('logged-out');
}

function renderLoggedIn(displayName: string | null, email: string, token: string): void {
  const nameEl = document.getElementById('auth-user-name');
  const emailEl = document.getElementById('auth-user-email');
  const avatarEl = document.getElementById('auth-avatar');

  const label = displayName ?? email;
  const initial = label.charAt(0).toUpperCase();

  if (nameEl) nameEl.textContent = displayName ?? email;
  if (emailEl) emailEl.textContent = displayName ? email : '';
  if (avatarEl) avatarEl.textContent = initial;

  showAuthState('logged-in');

  // Load quota in background
  void loadQuota(token);
  // Load AI credential info in background
  void loadAICredential(token);
  // Refresh locale from profile in background (updates voseo card subtitle + API calls)
  void loadAndApplyLocale(token);
}

async function loadAndApplyLocale(token: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const body = (await res.json()) as MeResponse;
    const locale = body.data?.profile?.preferredLocale;
    if (locale && locale !== popupLocale) {
      popupLocale = locale;
      applyVoseoCardLocale(locale);
      await chrome.storage.local.set({ preferredLocale: locale });
    }
  } catch {
    // best-effort — locale defaults to 'es-CR'
  }
}

async function loadQuota(token: string): Promise<void> {
  const quotaEl = document.getElementById('auth-quota');
  const loadingEl = document.getElementById('usage-loading');
  const errorEl = document.getElementById('usage-error');
  const dataEl = document.getElementById('usage-data');

  if (!quotaEl || !loadingEl || !errorEl || !dataEl) return;

  // Show the section in loading state
  quotaEl.hidden = false;
  loadingEl.hidden = false;
  errorEl.hidden = true;
  dataEl.hidden = true;

  try {
    const res = await fetch(`${API_BASE}/api/transform/quota`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      loadingEl.hidden = true;
      errorEl.hidden = false;
      return;
    }

    const body = (await res.json()) as QuotaResponse;
    const d = body.data;

    loadingEl.hidden = true;

    // Unlimited / no quota record
    if (!d || d.unlimited) {
      const periodEl = document.getElementById('usage-period');
      const dailyText = document.getElementById('usage-daily-text');
      const monthlyText = document.getElementById('usage-monthly-text');
      if (periodEl) periodEl.textContent = 'Sin límite';
      if (dailyText) dailyText.textContent = 'Ilimitado';
      if (monthlyText) monthlyText.textContent = 'Ilimitado';
      const dailyFill = document.getElementById('usage-daily-fill') as HTMLElement | null;
      const monthlyFill = document.getElementById('usage-monthly-fill') as HTMLElement | null;
      if (dailyFill) dailyFill.style.width = '0%';
      if (monthlyFill) monthlyFill.style.width = '0%';
      const dailyReset = document.getElementById('usage-daily-reset');
      const monthlyReset = document.getElementById('usage-monthly-reset');
      if (dailyReset) dailyReset.textContent = '';
      if (monthlyReset) monthlyReset.textContent = '';
      dataEl.hidden = false;
      return;
    }

    // Normal quota data
    const dailyUsed = d.dailyUsed ?? 0;
    const dailyLimit = d.dailyLimit ?? 0;
    const monthlyUsed = d.monthlyUsed ?? 0;
    const monthlyLimit = d.monthlyLimit ?? 0;

    const dailyPct = dailyLimit > 0 ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 100)) : 0;
    const monthlyPct = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100)) : 0;

    const dailyText = document.getElementById('usage-daily-text');
    const monthlyText = document.getElementById('usage-monthly-text');
    const dailyFill = document.getElementById('usage-daily-fill') as HTMLElement | null;
    const monthlyFill = document.getElementById('usage-monthly-fill') as HTMLElement | null;
    const dailyReset = document.getElementById('usage-daily-reset');
    const monthlyReset = document.getElementById('usage-monthly-reset');
    const periodEl = document.getElementById('usage-period');

    if (dailyText) dailyText.textContent = `${dailyUsed} / ${dailyLimit}`;
    if (monthlyText) monthlyText.textContent = `${monthlyUsed} / ${monthlyLimit}`;
    if (dailyFill) {
      dailyFill.style.width = `${dailyPct}%`;
      dailyFill.style.background = dailyPct >= 90 ? 'var(--c-error)' : '';
    }
    if (monthlyFill) {
      monthlyFill.style.width = `${monthlyPct}%`;
    }

    if (d.resetDailyAt) {
      const resetDate = new Date(d.resetDailyAt);
      if (dailyReset) dailyReset.textContent = `Reinicia ${fmtResetDate(resetDate)}`;
      if (periodEl) periodEl.textContent = fmtShortDate(resetDate);
    }
    if (d.resetMonthlyAt && monthlyReset) {
      monthlyReset.textContent = `Reinicia ${fmtResetDate(new Date(d.resetMonthlyAt))}`;
    }

    dataEl.hidden = false;
  } catch {
    loadingEl.hidden = true;
    errorEl.hidden = false;
  }
}

/** Format a reset date as "hoy HH:MM" or "DD MMM" */
function fmtResetDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `hoy ${date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
}

/** Format a date as "DD MMM" for the period label */
function fmtShortDate(date: Date): string {
  return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
}

function showAuthState(state: 'loading' | 'logged-out' | 'logged-in'): void {
  const loading = document.getElementById('auth-loading');
  const loggedOut = document.getElementById('auth-logged-out');
  const loggedIn = document.getElementById('auth-logged-in');

  if (loading) loading.hidden = state !== 'loading';
  if (loggedOut) loggedOut.hidden = state !== 'logged-out';
  if (loggedIn) loggedIn.hidden = state !== 'logged-in';
}
