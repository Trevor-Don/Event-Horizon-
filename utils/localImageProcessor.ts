import { NewsEvent } from '../types';
import { getEditorialImage } from './editorialMedia';

const resolvedUrlCache = new Map<string, string | null>();
const processedImageCache = new Map<string, string>();

/**
 * Resolves a real article image URL (from RSS metadata or server-side OpenGraph extraction)
 * without invoking any external generative AI image APIs.
 */
export async function resolveRealEventImage(event: NewsEvent): Promise<string | null> {
  if (event.imageUrl) {
    return `/api/image-proxy?url=${encodeURIComponent(event.imageUrl)}`;
  }

  const articleUrl = event.sources?.[0]?.url;
  if (!articleUrl) return null;

  if (resolvedUrlCache.has(articleUrl)) {
    const cached = resolvedUrlCache.get(articleUrl);
    return cached ? `/api/image-proxy?url=${encodeURIComponent(cached)}` : null;
  }

  try {
    const res = await fetch(`/api/resolve-image?url=${encodeURIComponent(articleUrl)}`);
    if (!res.ok) {
      resolvedUrlCache.set(articleUrl, null);
      return null;
    }
    const data = await res.json();
    const foundUrl = typeof data.imageUrl === 'string' ? data.imageUrl : null;
    resolvedUrlCache.set(articleUrl, foundUrl);
    return foundUrl ? `/api/image-proxy?url=${encodeURIComponent(foundUrl)}` : null;
  } catch {
    resolvedUrlCache.set(articleUrl, null);
    return null;
  }
}

/**
 * Local client-side Canvas "Oldies" Vintage Press Processor:
 * Transforms modern article photos and archival plates into cohesive 1920s broadsheet
 * photography using warm sepia duotone toning, lifted charcoal black-point, aged newsprint
 * cream highlights, subtle halftone dot-screen modulation, film grain, and lens vignette.
 */
export function applyLocalVintagePrintEffect(src: string, seedOffset = 0): Promise<string> {
  const cacheKey = `oldies::${src}::${seedOffset % 6}`;
  const cached = processedImageCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        const maxWidth = 780;
        const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const halfW = width * 0.5;
        const halfH = height * 0.5;
        const maxDistSq = halfW * halfW + halfH * halfH;

        for (let y = 0; y < height; y++) {
          const dy = y - halfH;
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Luminance projection into warm archival silver-gelatin sepia
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            const normLuma = luma / 255;

            // Gentle S-curve press contrast + lifted espresso shadows
            const contrasted = Math.max(0, Math.min(1, (normLuma - 0.5) * 1.18 + 0.5));
            const agedTone = 0.09 + contrasted * 0.88; // Lift shadows to ~23/255, cap highlights to aged cream

            // 1920s sepia ink-on-newsprint palette mapping
            const sepR = agedTone * 246;
            const sepG = agedTone * 228;
            const sepB = agedTone * 194;

            // Blend 85% vintage sepia with 15% muted original pigment
            const outR = sepR * 0.85 + r * 0.15;
            const outG = sepG * 0.85 + g * 0.15;
            const outB = sepB * 0.85 + b * 0.15;

            // Subtle vintage lens corner vignette
            const dx = x - halfW;
            const distRatio = (dx * dx + dy * dy) / maxDistSq;
            const vignette = 1 - Math.min(0.26, distRatio * 0.24);

            // Subtle broadsheet halftone screen + deterministic film/paper grain
            const halftone = Math.sin(x * 0.95) * Math.sin(y * 0.95) * 4.5;
            const hash = Math.sin((x + seedOffset * 17) * 12.9898 + y * 78.233) * 43758.5453;
            const grain = (hash - Math.floor(hash) - 0.5) * 13;

            data[idx] = Math.max(24, Math.min(248, outR * vignette + halftone + grain));
            data[idx + 1] = Math.max(18, Math.min(238, outG * vignette + halftone + grain));
            data[idx + 2] = Math.max(12, Math.min(218, outB * vignette + halftone + grain));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const resultUrl = canvas.toDataURL('image/jpeg', 0.86);
        processedImageCache.set(cacheKey, resultUrl);
        resolve(resultUrl);
      } catch {
        resolve(src);
      }
    };

    img.onerror = () => reject(new Error('Failed to decode image for local vintage filter'));
    img.src = src;
  });
}

/**
 * Selects real article imagery when reachable and applies local oldies processing,
 * otherwise applies the same local archival plate fallback across the 6 curated plates.
 */
export async function getProcessedEditorialImage(event: NewsEvent, index = 0): Promise<string> {
  const fallbackPlate = getEditorialImage(event, index);
  const realSrc = await resolveRealEventImage(event);

  if (realSrc) {
    try {
      return await applyLocalVintagePrintEffect(realSrc, index);
    } catch {
      // Fall back to local archival plate
    }
  }

  try {
    return await applyLocalVintagePrintEffect(fallbackPlate, index);
  } catch {
    return fallbackPlate;
  }
}
