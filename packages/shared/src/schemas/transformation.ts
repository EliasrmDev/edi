import { z } from 'zod';

export const TransformationRequestSchema = z.object({
  text: z
    .string()
    .min(1, 'Text cannot be empty')
    .max(10_000, 'Text too long (max 10,000 characters)'),
  transformation: z.enum([
    'uppercase',
    'lowercase',
    'sentence-case',
    'remove-formatting',
    'correct-orthography',
    'tone-voseo-cr',
    'tone-tuteo',
    'tone-ustedeo',
  ]),
  locale: z.enum(['es-CR', 'es-419', 'es']).default('es-CR'),
  requestAIValidation: z.boolean().default(false),
});

export const CredentialSubmissionSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google-ai', 'openrouter']),
  rawKey: z
    .string()
    .min(20)
    .max(256)
    .regex(/^[a-zA-Z0-9_\-.]+$/, 'Invalid key format'),
  label: z.string().min(1).max(64).trim(),
  expiresAt: z.coerce.date().optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type TransformationRequestInput = z.infer<typeof TransformationRequestSchema>;
export type CredentialSubmissionInput = z.infer<typeof CredentialSubmissionSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
