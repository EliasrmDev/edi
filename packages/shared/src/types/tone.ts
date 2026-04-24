export type ToneType = 'voseo-cr' | 'tuteo' | 'ustedeo';

export type VerbalMode = 'indicativo' | 'imperativo';

export type TransformationType =
  | 'uppercase'
  | 'lowercase'
  | 'sentence-case'
  | 'remove-formatting'
  | 'correct-orthography'
  | 'tone-voseo-cr'
  | 'tone-tuteo'
  | 'tone-ustedeo'
  | 'format-unicode-bold'
  | 'format-unicode-italic'
  | 'format-unicode-bold-italic'
  | 'format-unicode-bold-script'
  | 'format-unicode-monospace'
  | 'format-unicode-fullwidth';

export type TransformationSource = 'local' | 'ai-validated' | 'ai-fallback';

export interface TransformationRequest {
  text: string;
  transformation: TransformationType;
  tone?: ToneType;
  verbalMode?: VerbalMode;
  locale: 'es-CR' | 'es-419' | 'es';
  requestAIValidation: boolean;
}

export interface TransformationResult {
  original: string;
  result: string;
  transformation: TransformationType;
  source: TransformationSource;
  warnings: TransformationWarning[];
  processingMs: number;
}

export interface TransformationWarning {
  code: string;
  message: string;
}
