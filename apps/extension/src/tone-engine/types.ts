import type { TransformationSource, TransformationWarning } from '@edi/shared';

export type { TransformationSource, TransformationWarning };

export type ToneClass = 'voseo' | 'tuteo' | 'ustedeo' | 'unknown';

export interface DetectionResult {
  detectedTone: ToneClass;
  confidence: 'high' | 'medium' | 'low';
  scores: { voseo: number; tuteo: number; ustedeo: number };
}

export interface EngineTransformationResult {
  result: string;
  source: TransformationSource;
  warnings: TransformationWarning[];
}

export type TransformationWarningCode =
  | 'TONE_COVERAGE_LIMITED'
  | 'MIXED_TONE_DETECTED'
  | 'ORTHOGRAPHY_COVERAGE_LIMITED'
  | 'TONE_REQUIRES_AI'
  | 'REQUIRES_AI';
