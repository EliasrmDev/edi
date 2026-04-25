import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

// Lazily initialised so the module can be imported before process.env is ready.
// In practice, CF Workers populate process.env from bindings before any code runs.
let _sql: ReturnType<typeof neon> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getSql(): ReturnType<typeof neon> {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured');
    _sql = neon(connectionString);
  }
  return _sql;
}

// Use a Proxy so existing `import { db } from '../db/index.js'` calls work unchanged.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    if (!_db) _db = drizzle(getSql(), { schema });
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
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
  const sql = getSql();
  const rawRows = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY(${tableNames})
  `;
  const rows = rawRows as unknown as ColumnRow[];

  const missing = getMissingRequiredColumns(requiredColumns, rows);
  if (missing.length > 0) {
    throw new Error(buildSchemaMismatchErrorMessage(missing));
  }
};
