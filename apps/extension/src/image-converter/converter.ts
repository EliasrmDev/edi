/**
 * Image converter — core conversion library
 * Works in both DOM contexts (popup) and service worker contexts via OffscreenCanvas.
 */

import type { Format, ConvertOptions, ConvertResult } from './types';

const DEFAULT_MAX_MB = 10;

// ─── Core conversion ───────────────────────────────────────────────────────

export async function convertFromBlob(
  input: Blob,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const { format, quality = 0.92, maxSizeMB = DEFAULT_MAX_MB } = options;
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (input.size > maxBytes) {
    throw new Error(
      `File size (${formatBytes(input.size)}) exceeds the ${maxSizeMB} MB local limit.`,
    );
  }

  const bitmap = await createImageBitmap(input);
  const { width, height } = bitmap;

  let resultBlob: Blob;

  if (typeof OffscreenCanvas !== 'undefined') {
    resultBlob = await convertViaOffscreen(bitmap, width, height, format, quality);
  } else {
    resultBlob = await convertViaCanvas(bitmap, width, height, format, quality);
  }

  bitmap.close();

  return {
    blob: resultBlob,
    width,
    height,
    originalSize: input.size,
    convertedSize: resultBlob.size,
    format,
  };
}

export async function convertFromUrl(
  url: string,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  }
  const blob = await res.blob();

  if (!blob.type.startsWith('image/')) {
    throw new Error(`URL did not return an image (got: ${blob.type || 'unknown'})`);
  }

  return convertFromBlob(blob, options);
}

// ─── Canvas helpers ────────────────────────────────────────────────────────

async function convertViaOffscreen(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  format: Format,
  quality: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error('Could not acquire OffscreenCanvas 2D context');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(bitmap, 0, 0);
  return canvas.convertToBlob({ type: format, quality });
}

async function convertViaCanvas(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  format: Format,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire Canvas 2D context');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(bitmap, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error('canvas.toBlob() returned null — unsupported format?')),
      format,
      quality,
    );
  });
}

// ─── Utilities ─────────────────────────────────────────────────────────────

export function getExtension(format: Format): string {
  return format === 'image/jpeg' ? 'jpg' : 'png';
}

export function stemName(urlOrPath: string): string {
  try {
    const u = new URL(urlOrPath);
    urlOrPath = u.pathname;
  } catch {
    // Not a full URL — use as-is
  }
  const base = urlOrPath.split('/').pop() ?? 'image';
  return base.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_\-. ]/g, '_') || 'image';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 * 1000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${(bytes / 1000 / 1000).toFixed(1)} MB`;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
