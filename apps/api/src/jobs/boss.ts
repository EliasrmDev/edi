import PgBoss from 'pg-boss';

let _boss: PgBoss | null = null;
let _startPromise: Promise<PgBoss> | null = null;

/**
 * Returns the shared pg-boss instance for the API process.
 * Starts the instance lazily on first call and caches it.
 * Used by services that need to schedule background jobs.
 */
export async function getBoss(): Promise<PgBoss> {
  if (_boss) return _boss;

  if (_startPromise) return _startPromise;

  _startPromise = (async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for job scheduling');
    }

    const boss = new PgBoss({ connectionString });
    await boss.start();

    boss.on('error', (err) => {
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'pg_boss_error',
          error: err.message,
          timestamp: new Date().toISOString(),
        }),
      );
    });

    _boss = boss;
    return boss;
  })();

  return _startPromise;
}
