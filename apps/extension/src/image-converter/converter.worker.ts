/// <reference lib="webworker" />
/**
 * converter.worker.ts — Off-thread image conversion engine
 *
 * Architecture:
 *  1. Decode via createImageBitmap (efficient, hardware-accelerated)
 *  2. Allocate OffscreenCanvas at full resolution
 *  3. Adaptive tiling: render in tiles to avoid GPU memory spikes
 *  4. Encode via convertToBlob (JPEG or PNG)
 *  5. Report progress at each stage; blob transferred back to popup
 */

import type { ConvertRequest, WorkerMsg } from './types';

// ─── Adaptive tile-size selection ─────────────────────────────────────────
function tileSize(width: number, height: number): number {
  const maxDim = Math.max(width, height);
  if (maxDim > 8000) return 1024;
  if (maxDim > 4000) return 2048;
  return 0; // 0 = draw full image in a single call
}

// ─── Main message handler ─────────────────────────────────────────────────
self.onmessage = async (e: MessageEvent<ConvertRequest>) => {
  const { id, blob, format, quality, originalSize } = e.data;
  const post = (msg: WorkerMsg) =>
    (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg);

  try {
    // Stage 1: Decode
    post({ id, type: 'progress', percent: 5, stage: 'Decoding image…' });
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;

    // Stage 2: Canvas allocation
    post({ id, type: 'progress', percent: 15, stage: 'Allocating canvas…' });
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable in this browser.');

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // Stage 3: Render (tiled or full)
    const tile = tileSize(width, height);

    if (tile === 0) {
      ctx.drawImage(bitmap, 0, 0);
      post({ id, type: 'progress', percent: 70, stage: 'Rendering image…' });
    } else {
      const tilesX = Math.ceil(width / tile);
      const tilesY = Math.ceil(height / tile);
      const total = tilesX * tilesY;
      let done = 0;

      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          const sx = tx * tile;
          const sy = ty * tile;
          const sw = Math.min(tile, width - sx);
          const sh = Math.min(tile, height - sy);
          ctx.drawImage(bitmap, sx, sy, sw, sh, sx, sy, sw, sh);
          done++;

          if (done % 3 === 0 || done === total) {
            const pct = 15 + Math.round((done / total) * 55);
            post({
              id,
              type: 'progress',
              percent: pct,
              stage: `Rendering tile ${done}/${total}…`,
            });
          }
        }
      }
    }

    bitmap.close();

    // Stage 4: Encode
    post({ id, type: 'progress', percent: 75, stage: 'Encoding output…' });
    const output = await canvas.convertToBlob({
      type: format,
      quality: format === 'image/jpeg' ? quality : undefined,
    });

    post({ id, type: 'progress', percent: 100, stage: 'Done' });
    post({
      id,
      type: 'result',
      blob: output,
      width,
      height,
      originalSize,
      convertedSize: output.size,
    });
  } catch (err) {
    post({
      id,
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
