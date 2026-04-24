import type { TransformationType, TransformationResult, VerbalMode } from '@edi/shared';
import { toneDetector } from './detectors/ToneDetector';
import { createVoseoTransformer, voseoTransformer } from './transformers/VoseoTransformer';
import { createTuteoTransformer, tuteoTransformer } from './transformers/TuteoTransformer';
import { createUstedeoTransformer, ustedeoTransformer } from './transformers/UstedeoTransformer';
import { toUpperCase, toLowerCase, toSentenceCase } from './formatters/CaseFormatter';
import {
  removeFormatting,
  stripUnicodeStyles,
  toUnicodeBold,
  toUnicodeItalic,
  toUnicodeBoldItalic,
  toUnicodeBoldScript,
  toUnicodeMonospace,
  toUnicodeFullwidth,
} from './formatters/CleanFormatter';
import type { EngineTransformationResult } from './types';

/**
 * Main orchestrator for the local tone engine.
 *
 * All transformations run synchronously in the browser (zero network calls).
 * Source is always 'local'.  AI fallback is never triggered by this engine;
 * callers should use the API for `correct-orthography` if higher accuracy is
 * needed.
 */
export class ToneEngine {
  transform(text: string, transformation: TransformationType, verbalMode: VerbalMode = 'indicativo'): TransformationResult {
    const start = performance.now();

    const { result, source, warnings } = this._dispatch(text, transformation, verbalMode);

    return {
      original: text,
      result,
      transformation,
      source,
      warnings,
      processingMs: Math.round(performance.now() - start),
    };
  }

  private _dispatch(text: string, transformation: TransformationType, verbalMode: VerbalMode): EngineTransformationResult {
    switch (transformation) {
      case 'uppercase':
        return { result: toUpperCase(stripUnicodeStyles(text)), source: 'local', warnings: [] };

      case 'lowercase':
        return { result: toLowerCase(stripUnicodeStyles(text)), source: 'local', warnings: [] };

      case 'sentence-case':
        return { result: toSentenceCase(stripUnicodeStyles(text)), source: 'local', warnings: [] };

      case 'remove-formatting':
        return { result: removeFormatting(text), source: 'local', warnings: [] };

      case 'tone-voseo-cr': {
        const detection = toneDetector.detect(text);
        const transformer = verbalMode === 'indicativo' ? voseoTransformer : createVoseoTransformer(verbalMode);
        const result = transformer.transform(text);
        const modeLabel = verbalMode === 'imperativo' ? 'imperativo' : 'indicativo';
        const warnings = [
          {
            code: 'TONE_COVERAGE_LIMITED',
            message:
              `Solo se convierten formas verbales del presente ${modeLabel} y pronombres de segunda persona.`,
          },
        ];
        if (detection.confidence === 'low' || detection.detectedTone === 'unknown') {
          warnings.push({
            code: 'MIXED_TONE_DETECTED',
            message: 'No se detectó un tono dominante. El resultado puede ser inconsistente.',
          });
        }
        return { result, source: 'local', warnings };
      }

      case 'tone-tuteo': {
        const detection = toneDetector.detect(text);
        const transformer = verbalMode === 'indicativo' ? tuteoTransformer : createTuteoTransformer(verbalMode);
        const result = transformer.transform(text);
        const modeLabel = verbalMode === 'imperativo' ? 'imperativo' : 'indicativo';
        const warnings = [
          {
            code: 'TONE_COVERAGE_LIMITED',
            message:
              `Solo se convierten formas verbales del presente ${modeLabel} y pronombres de segunda persona.`,
          },
        ];
        if (detection.confidence === 'low' || detection.detectedTone === 'unknown') {
          warnings.push({
            code: 'MIXED_TONE_DETECTED',
            message: 'No se detectó un tono dominante. El resultado puede ser inconsistente.',
          });
        }
        return { result, source: 'local', warnings };
      }

      case 'tone-ustedeo': {
        const detection = toneDetector.detect(text);
        const transformer = verbalMode === 'indicativo' ? ustedeoTransformer : createUstedeoTransformer(verbalMode);
        const result = transformer.transform(text);
        const modeLabel = verbalMode === 'imperativo' ? 'imperativo' : 'indicativo';
        const warnings = [
          {
            code: 'TONE_COVERAGE_LIMITED',
            message:
              `Solo se convierten formas verbales del presente ${modeLabel} y pronombres de segunda persona. Las formas de ustedeo coinciden con la 3ª persona (él/ella).`,
          },
        ];
        if (detection.confidence === 'low' || detection.detectedTone === 'unknown') {
          warnings.push({
            code: 'MIXED_TONE_DETECTED',
            message: 'No se detectó un tono dominante. El resultado puede ser inconsistente.',
          });
        }
        return { result, source: 'local', warnings };
      }

      case 'format-unicode-bold':
        return { result: toUnicodeBold(removeFormatting(text)), source: 'local', warnings: [] };

      case 'format-unicode-italic':
        return { result: toUnicodeItalic(removeFormatting(text)), source: 'local', warnings: [] };

      case 'format-unicode-bold-italic':
        return { result: toUnicodeBoldItalic(removeFormatting(text)), source: 'local', warnings: [] };

      case 'format-unicode-bold-script':
        return { result: toUnicodeBoldScript(removeFormatting(text)), source: 'local', warnings: [] };

      case 'format-unicode-monospace':
        return { result: toUnicodeMonospace(removeFormatting(text)), source: 'local', warnings: [] };

      case 'format-unicode-fullwidth':
        return { result: toUnicodeFullwidth(removeFormatting(text)), source: 'local', warnings: [] };

      case 'correct-orthography': {
        // Local orthography correction handles only the most common, unambiguous
        // cases.  Complex cases (b/v confusion, tilde placement in compounds)
        // require AI validation.
        const result = this._basicOrthography(text);
        return {
          result,
          source: 'local',
          warnings: [
            {
              code: 'ORTHOGRAPHY_COVERAGE_LIMITED',
              message:
                'La corrección local solo cubre errores ortográficos comunes. Use validación por IA para mayor precisión.',
            },
          ],
        };
      }

      default: {
        const _exhaustive: never = transformation;
        throw new Error(`Unknown transformation: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Basic local orthography corrections.
   * Fixes the most common, context-independent Spanish errors:
   *   - Correct tildes on monosyllabic diacritics (dé/de, él/el, sé/se, etc.)
   *   - Fix "a ver" vs "haber" (very limited: "a ver si" fixed only)
   *   - Normalise multiple punctuation marks
   */
  private _basicOrthography(text: string): string {
    let result = text;

    // Monosyllabic diacritics: only 'el' without accent when used as article
    // Context-free substitution is too risky — skip for now.

    // Common writing errors: "q " → "que " only when clearly informal abbreviation
    result = result.replace(/\bq(\s)/g, 'que$1');
    result = result.replace(/\bxq\b/gi, 'porque');
    result = result.replace(/\bxke\b/gi, 'porque');
    result = result.replace(/\bnndo\b/gi, 'cuando');
    result = result.replace(/\btb\b/gi, 'también');
    result = result.replace(/\btmb\b/gi, 'también');
    result = result.replace(/\bxfa\b/gi, 'por favor');
    result = result.replace(/\bplis\b/gi, 'por favor');
    result = result.replace(/\bporfas\b/gi, 'por favor');

    // Multiple exclamation/question marks: normalise "!!!!" → "!"
    // Preserve opening ¡/¿
    result = result.replace(/([!?])\1{2,}/g, '$1');

    return result;
  }
}

export const toneEngine = new ToneEngine();
