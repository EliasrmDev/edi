import type { TransformationType, TransformationResult } from '@edi/shared';
import { ToneEngine } from './ToneEngine';
import { ToneDetector } from './detectors/ToneDetector';

export type { TransformationType, TransformationResult };
export type { ToneClass, DetectionResult, EngineTransformationResult } from './types';

/** Singleton engine instance. */
const _engine = new ToneEngine();

/**
 * Transform `text` using the local tone engine.
 * All 8 TransformationType values are handled locally — no network calls.
 */
export function transformText(
  text: string,
  transformation: TransformationType,
): TransformationResult {
  return _engine.transform(text, transformation);
}

export { ToneEngine, ToneDetector };
