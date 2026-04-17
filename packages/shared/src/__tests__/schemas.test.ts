import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  TransformationRequestSchema,
  CredentialSubmissionSchema,
} from '../schemas/transformation.js';

// ---------------------------------------------------------------------------
// TransformationRequestSchema
// ---------------------------------------------------------------------------

describe('TransformationRequestSchema', () => {
  it('validates a complete valid request', () => {
    const result = TransformationRequestSchema.safeParse({
      text: 'Hola, ¿cómo estás?',
      transformation: 'tone-voseo-cr',
      locale: 'es-CR',
      requestAIValidation: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe('Hola, ¿cómo estás?');
      expect(result.data.transformation).toBe('tone-voseo-cr');
    }
  });

  it('applies default locale es-CR when omitted', () => {
    const result = TransformationRequestSchema.safeParse({
      text: 'texto',
      transformation: 'uppercase',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe('es-CR');
    }
  });

  it('applies default requestAIValidation=false when omitted', () => {
    const result = TransformationRequestSchema.safeParse({
      text: 'texto',
      transformation: 'lowercase',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requestAIValidation).toBe(false);
    }
  });

  it('rejects empty text', () => {
    const result = TransformationRequestSchema.safeParse({
      text: '',
      transformation: 'uppercase',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('text');
    }
  });

  it('rejects text longer than 10,000 characters', () => {
    const result = TransformationRequestSchema.safeParse({
      text: 'a'.repeat(10_001),
      transformation: 'uppercase',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('text');
    }
  });

  it('accepts text of exactly 10,000 characters', () => {
    const result = TransformationRequestSchema.safeParse({
      text: 'a'.repeat(10_000),
      transformation: 'lowercase',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown transformation type', () => {
    const result = TransformationRequestSchema.safeParse({
      text: 'hola',
      transformation: 'pig-latin',
    });

    expect(result.success).toBe(false);
  });

  it('accepts all valid transformation types', () => {
    const types = [
      'uppercase',
      'lowercase',
      'sentence-case',
      'remove-formatting',
      'correct-orthography',
      'tone-voseo-cr',
      'tone-tuteo',
      'tone-ustedeo',
    ] as const;

    for (const transformation of types) {
      const result = TransformationRequestSchema.safeParse({ text: 'hola', transformation });
      expect(result.success).toBe(true, `Expected "${transformation}" to be valid`);
    }
  });

  it('rejects an unknown locale', () => {
    const result = TransformationRequestSchema.safeParse({
      text: 'hola',
      transformation: 'uppercase',
      locale: 'en-US',
    });

    expect(result.success).toBe(false);
  });

  it('parses correctly with locale es-419', () => {
    const result = TransformationRequestSchema.safeParse({
      text: 'hola',
      transformation: 'uppercase',
      locale: 'es-419',
    });

    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CredentialSubmissionSchema
// ---------------------------------------------------------------------------

describe('CredentialSubmissionSchema', () => {
  it('validates a valid OpenAI key', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'openai',
      rawKey: 'sk-proj-abcdefghijklmnopqrstuvwxyz1234567890',
      label: 'Mi clave de producción',
    });

    expect(result.success).toBe(true);
  });

  it('validates a valid Anthropic key', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'anthropic',
      rawKey: 'sk-ant-api03-validkeywouldbehere',
      label: 'Anthropic prod',
    });

    expect(result.success).toBe(true);
  });

  it('validates a valid Google AI key', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'google-ai',
      rawKey: 'AIzaValidGoogleKeyHere12345678901',
      label: 'Google AI Studio',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a key with spaces', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'openai',
      rawKey: 'sk-with spaces-inside',
      label: 'test',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ZodError);
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('rawKey');
    }
  });

  it('rejects a key with special characters not in allowlist', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'openai',
      rawKey: 'sk-key<with>angle&brackets',
      label: 'test',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a key shorter than 20 characters', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'openai',
      rawKey: 'too-short',
      label: 'test',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty label', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'openai',
      rawKey: 'sk-validkeyabcdefghij12345',
      label: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a label longer than 64 characters', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'openai',
      rawKey: 'sk-validkeyabcdefghij12345',
      label: 'x'.repeat(65),
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unknown provider', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'cohere',
      rawKey: 'validkeyabcdefghijklmnop',
      label: 'Cohere key',
    });

    expect(result.success).toBe(false);
  });

  it('accepts an optional expiresAt date string', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'openai',
      rawKey: 'sk-validkeyabcdefghij12345',
      label: 'Expiring key',
      expiresAt: '2027-01-01',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiresAt).toBeInstanceOf(Date);
    }
  });

  it('allows hyphens, underscores, and dots in keys (per regex)', () => {
    const result = CredentialSubmissionSchema.safeParse({
      provider: 'anthropic',
      rawKey: 'sk-ant.api03_valid-key-here1234',
      label: 'test',
    });

    expect(result.success).toBe(true);
  });
});
