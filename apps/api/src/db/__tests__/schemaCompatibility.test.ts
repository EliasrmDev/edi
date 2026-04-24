import { describe, expect, it } from 'vitest';
import {
  buildSchemaMismatchErrorMessage,
  getMissingRequiredColumns,
  type RequiredColumn,
} from '../index.js';

describe('schema compatibility helpers', () => {
  it('returns missing required columns when metadata rows are incomplete', () => {
    const required: RequiredColumn[] = [
      { tableName: 'provider_credentials', columnName: 'is_enabled' },
      { tableName: 'provider_credentials', columnName: 'is_active' },
    ];

    const missing = getMissingRequiredColumns(required, [
      { table_name: 'provider_credentials', column_name: 'is_active' },
    ]);

    expect(missing).toEqual([{ tableName: 'provider_credentials', columnName: 'is_enabled' }]);
  });

  it('builds actionable migration remediation text', () => {
    const message = buildSchemaMismatchErrorMessage([
      { tableName: 'provider_credentials', columnName: 'is_enabled' },
    ]);

    expect(message).toContain('provider_credentials.is_enabled');
    expect(message).toContain('pnpm db:migrate');
    expect(message).toContain('DATABASE_URL');
  });
});
