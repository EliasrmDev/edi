import { neon } from '@neondatabase/serverless';

export type Sql = ReturnType<typeof neon>;

export function createSql(databaseUrl: string): Sql {
  return neon(databaseUrl);
}
