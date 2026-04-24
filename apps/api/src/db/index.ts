import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

export interface RequiredColumn {
  tableName: string;
  columnName: string;
}

export const CRITICAL_REQUIRED_COLUMNS: RequiredColumn[] = [
  { tableName: 'provider_credentials', columnName: 'is_enabled' },
];

interface ColumnRow {
  table_name: string;
  column_name: string;
}

const toColumnKey = (tableName: string, columnName: string): string =>
  `${tableName}.${columnName}`;

export const getMissingRequiredColumns = (
  required: RequiredColumn[],
  presentRows: ColumnRow[],
): RequiredColumn[] => {
  const present = new Set(
    presentRows.map((row) => toColumnKey(row.table_name, row.column_name)),
  );

  return required.filter((column) => !present.has(toColumnKey(column.tableName, column.columnName)));
};

export const buildSchemaMismatchErrorMessage = (
  missingColumns: RequiredColumn[],
): string => {
  const missingList = missingColumns
    .map((column) => `${column.tableName}.${column.columnName}`)
    .join(', ');

  return [
    `Database schema mismatch detected. Missing required columns: ${missingList}.`,
    'Run `pnpm db:migrate` against the same DATABASE_URL used by this API process and restart the server.',
  ].join(' ');
};

export const assertRequiredSchemaCompatibility = async (
  requiredColumns: RequiredColumn[] = CRITICAL_REQUIRED_COLUMNS,
): Promise<void> => {
  if (requiredColumns.length === 0) return;

  const tableNames = Array.from(new Set(requiredColumns.map((column) => column.tableName)));

  const result = await pool.query<ColumnRow>(
    `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
    `,
    [tableNames],
  );

  const missing = getMissingRequiredColumns(requiredColumns, result.rows);
  if (missing.length > 0) {
    throw new Error(buildSchemaMismatchErrorMessage(missing));
  }
};
