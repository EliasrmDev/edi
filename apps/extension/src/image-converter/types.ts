/**
 * Image converter — shared types
 * Used by the converter library, worker, scanner, and popup UI.
 */

export type Format = 'image/jpeg' | 'image/png';

export interface ConvertOptions {
  format: Format;
  /** JPEG quality 0.01–1.0. Ignored for PNG. Default: 0.92 */
  quality?: number;
  /** Reject input if it exceeds this size in MB. Default: 10 */
  maxSizeMB?: number;
}

export interface ConvertResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
  format: Format;
}

export interface ImageInfo {
  url: string;
  width: number;
  height: number;
  alt: string;
  format: string;
}

// ─── Worker message protocol ──────────────────────────────────────────────

export interface ConvertRequest {
  id: string;
  blob: Blob;
  format: Format;
  quality: number;
  originalSize: number;
}

export interface ProgressMsg {
  id: string;
  type: 'progress';
  percent: number;
  stage: string;
}

export interface ResultMsg {
  id: string;
  type: 'result';
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
}

export interface ErrorMsg {
  id: string;
  type: 'error';
  message: string;
}

export type WorkerMsg = ProgressMsg | ResultMsg | ErrorMsg;
