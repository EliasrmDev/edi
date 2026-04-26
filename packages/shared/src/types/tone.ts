export type ToneType = 'voseo-cr' | 'tuteo' | 'ustedeo';

export type LocaleCode = 'es-CR' | 'es-419' | 'es';

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
  | 'format-unicode-fullwidth'
  | 'copy-writing-cr';

export type TransformationSource = 'local' | 'ai-validated' | 'ai-fallback';

export interface CopyConfig {
  tratamiento: 'voseo' | 'tuteo' | 'ustedeo';
  modoVerbal: 'indicativo' | 'imperativo';
  contexto: 'boton' | 'formulario' | 'error' | 'landing' | 'anuncio' | 'notificacion';
  canal?: 'web' | 'app' | 'email' | 'meta-ads' | 'display' | 'whatsapp' | 'sms';
  formalidad: 'alto' | 'medio' | 'bajo';
  objetivo: 'informar' | 'convertir' | 'guiar' | 'persuadir';
  intensidadCambio: 'minima' | 'moderada' | 'alta';
  limiteLongitud?: number;
  terminosObligatorios?: string[];
  terminosProhibidos?: string[];
  configuracionGuardada?: string;
  guardarConfiguracion?: boolean;
  nombreConfiguracion?: string;
}

export interface TransformationRequest {
  text: string;
  transformation: TransformationType;
  tone?: ToneType;
  verbalMode?: VerbalMode;
  locale: LocaleCode;
  requestAIValidation: boolean;
  copyConfig?: CopyConfig;
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
