// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { ToneEngine } from '../ToneEngine.js';

const engine = new ToneEngine();

// ---------------------------------------------------------------------------
// Case formatters
// ---------------------------------------------------------------------------

describe('uppercase transformation', () => {
  it('converts text to uppercase', () => {
    const { result } = engine.transform('hola mundo', 'uppercase');
    expect(result).toBe('HOLA MUNDO');
  });

  it('preserves accented characters in uppercase', () => {
    const { result } = engine.transform('café señor', 'uppercase');
    expect(result).toBe('CAFÉ SEÑOR');
  });
});

describe('lowercase transformation', () => {
  it('converts text to lowercase', () => {
    const { result } = engine.transform('HOLA MUNDO', 'lowercase');
    expect(result).toBe('hola mundo');
  });

  it('preserves accented characters in lowercase', () => {
    const { result } = engine.transform('CAFÉ SEÑOR', 'lowercase');
    expect(result).toBe('café señor');
  });
});

describe('sentence-case transformation', () => {
  it('capitalizes the first letter only for a single sentence', () => {
    const { result } = engine.transform('hola mundo cómo estás', 'sentence-case');
    expect(result.charAt(0)).toBe('H');
    expect(result.slice(1)).toBe('ola mundo cómo estás');
  });

  it('capitalizes after period-space for multiple sentences', () => {
    const { result } = engine.transform('primera oración. segunda oración. tercera.', 'sentence-case');
    expect(result).toContain('Primera');
    expect(result).toContain('. Segunda');
    expect(result).toContain('. Tercera');
  });

  it('capitalizes after exclamation mark', () => {
    const { result } = engine.transform('¡hola! ¿cómo estás?', 'sentence-case');
    // ¡ is preserved; the letter after it is capitalized
    expect(result.charAt(0)).toBe('¡');
    expect(result.charAt(1)).toBe('H');
  });
});

describe('remove-formatting transformation', () => {
  it('collapses multiple spaces into one', () => {
    const { result } = engine.transform('hola   mundo   como  estás', 'remove-formatting');
    expect(result).toBe('hola mundo como estás');
  });

  it('removes zero-width characters', () => {
    const text = 'hola\u200Bmundo\u00ADfin'; // zero-width space + soft hyphen
    const { result } = engine.transform(text, 'remove-formatting');
    expect(result).not.toContain('\u200B');
    expect(result).not.toContain('\u00AD');
  });

  it('produces no empty source or warnings fields', () => {
    const output = engine.transform('hola ', 'remove-formatting');
    expect(output.source).toBe('local');
    expect(output.warnings).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tone: voseo-cr
// ---------------------------------------------------------------------------

describe('tone-voseo-cr transformation', () => {
  it('converts tuteo "tienes" to voseo "tenés"', () => {
    const { result } = engine.transform('tienes razón', 'tone-voseo-cr');
    expect(result).toContain('tenés');
  });

  it('converts tuteo "eres" to voseo "sos"', () => {
    const { result } = engine.transform('eres muy amable', 'tone-voseo-cr');
    expect(result).toContain('sos');
  });

  it('converts ustedeo "usted tiene" to voseo — verb replaced', () => {
    const { result } = engine.transform('usted tiene que venir', 'tone-voseo-cr');
    expect(result).toContain('tenés');
  });

  it('converts ustedeo pronoun "usted" to voseo "vos"', () => {
    const { result } = engine.transform('Esperaba que usted llegara.', 'tone-voseo-cr');
    // Pronoun "usted" → "vos"
    expect(result.toLowerCase()).toContain('vos');
  });

  it('detects voseo imperative "hablá" correctly and preserves it', () => {
    // "hablá" is already voseo → no change expected
    const { result } = engine.transform('Hablá más despacio.', 'tone-voseo-cr');
    expect(result.toLowerCase()).toContain('hablá');
  });

  it('always includes TONE_COVERAGE_LIMITED warning', () => {
    const { warnings } = engine.transform('texto cualquiera', 'tone-voseo-cr');
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain('TONE_COVERAGE_LIMITED');
  });

  it('includes MIXED_TONE_DETECTED warning for mixed input', () => {
    // Both voseo ("tenés") and tuteo ("tienes") markers in same sentence
    // → detector should return low confidence → MIXED_TONE_DETECTED
    const { warnings } = engine.transform('tenés razón y tienes suerte', 'tone-voseo-cr');
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain('MIXED_TONE_DETECTED');
  });

  it('preserves an unknown verb-like word and includes coverage warning', () => {
    // "sphargalate" is not in any lookup table → should pass through unchanged
    const { result, warnings } = engine.transform(
      'Vos sphargalate muy bien.',
      'tone-voseo-cr',
    );
    expect(result).toContain('sphargalate');
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain('TONE_COVERAGE_LIMITED');
  });

  it('preserves Costa Rican vocabulary "mae"', () => {
    const { result } = engine.transform('mae, ¿qué tal?', 'tone-voseo-cr');
    expect(result.toLowerCase()).toContain('mae');
  });

  it('preserves Costa Rican expression "diay"', () => {
    const { result } = engine.transform('diay, no sé', 'tone-voseo-cr');
    expect(result.toLowerCase()).toContain('diay');
  });

  it('preserves Costa Rican phrase "pura vida"', () => {
    const { result } = engine.transform('todo bien, pura vida', 'tone-voseo-cr');
    expect(result.toLowerCase()).toContain('pura vida');
  });

  it('includes TONE_COVERAGE_LIMITED for past tense verbs (not in lookup table)', () => {
    // "hablé" is first-person past → not converted, but warning is present
    const { result, warnings } = engine.transform('hablé con ella ayer', 'tone-voseo-cr');
    expect(result.toLowerCase()).toContain('hablé'); // preserved unchanged
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain('TONE_COVERAGE_LIMITED');
  });
});

// ---------------------------------------------------------------------------
// Tone: tuteo
// ---------------------------------------------------------------------------

describe('tone-tuteo transformation', () => {
  it('converts voseo "tenés" to tuteo "tienes"', () => {
    const { result } = engine.transform('tenés razón', 'tone-tuteo');
    expect(result).toContain('tienes');
  });

  it('converts voseo "sos" to tuteo "eres"', () => {
    const { result } = engine.transform('sos muy amable', 'tone-tuteo');
    expect(result).toContain('eres');
  });

  it('converts voseo pronoun "vos" to tuteo "tú"', () => {
    const { result } = engine.transform('A vos te toca hablar.', 'tone-tuteo');
    expect(result.toLowerCase()).toContain('tú');
  });

  it('always includes TONE_COVERAGE_LIMITED warning', () => {
    const { warnings } = engine.transform('hola mundo', 'tone-tuteo');
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain('TONE_COVERAGE_LIMITED');
  });
});

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

describe('TransformationResult shape', () => {
  it('always returns the original text unchanged', () => {
    const text = 'texto de prueba';
    const output = engine.transform(text, 'uppercase');
    expect(output.original).toBe(text);
  });

  it('always sets source to "local"', () => {
    for (const t of ['uppercase', 'lowercase', 'tone-voseo-cr', 'tone-tuteo'] as const) {
      expect(engine.transform('hola', t).source).toBe('local');
    }
  });

  it('always includes a numeric processingMs', () => {
    const output = engine.transform('hola', 'lowercase');
    expect(typeof output.processingMs).toBe('number');
    expect(output.processingMs).toBeGreaterThanOrEqual(0);
  });
});
