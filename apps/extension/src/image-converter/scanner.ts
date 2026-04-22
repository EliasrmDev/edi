/**
 * Image scanner — finds images on the current page.
 * Used by the content script to respond to SCAN_IMAGES messages.
 */

import type { ImageInfo } from './types';

export function scanImages(): ImageInfo[] {
  const seen = new Set<string>();
  const results: ImageInfo[] = [];

  function add(url: string, width: number, height: number, alt: string): void {
    if (!url || seen.has(url) || url.startsWith('data:')) return; // skip inline data: URLs
    try {
      new URL(url, location.href);
    } catch {
      return;
    }
    seen.add(url);
    results.push({ url, width, height, alt, format: detectFormat(url) });
  }

  // Standard <img> elements
  document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const src = img.currentSrc || img.src;
    add(src, img.naturalWidth, img.naturalHeight, img.alt);
  });

  // <picture> / <source> elements
  document.querySelectorAll<HTMLSourceElement>('picture source').forEach((src) => {
    const firstUrl = src.srcset.split(/[\s,]+/)[0];
    if (firstUrl) add(firstUrl, 0, 0, '');
  });

  // Inline background-image styles
  document.querySelectorAll<HTMLElement>('[style*="url("]').forEach((el) => {
    const bg = el.style.backgroundImage;
    if (!bg) return;
    const match = bg.match(/url\(['"]?([^'")\s]+)['"]?\)/i);
    if (match?.[1]) add(match[1], 0, 0, '');
  });

  return results;
}

export function detectFormat(url: string): string {
  try {
    const u = new URL(url, location.href);
    const path = u.pathname.toLowerCase();
    const q = (
      u.searchParams.get('format') ??
      u.searchParams.get('f') ??
      ''
    ).toLowerCase();

    if (path.endsWith('.webp') || q === 'webp') return 'WebP';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || q === 'jpeg' || q === 'jpg')
      return 'JPEG';
    if (path.endsWith('.png') || q === 'png') return 'PNG';
    if (path.endsWith('.gif') || q === 'gif') return 'GIF';
    if (path.endsWith('.avif') || q === 'avif') return 'AVIF';
    if (path.endsWith('.bmp') || q === 'bmp') return 'BMP';
    if (path.endsWith('.tiff') || path.endsWith('.tif') || q === 'tiff') return 'TIFF';
    if (path.endsWith('.svg') || q === 'svg') return 'SVG';
  } catch {
    // Invalid URL
  }
  return 'Unknown';
}
