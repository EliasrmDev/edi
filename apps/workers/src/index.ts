import 'dotenv/config';
import PgBoss from 'pg-boss';
import { registerAllHandlers } from './handlers/index';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const boss = new PgBoss({
  connectionString,
  deleteAfterDays: 7,
  monitorStateIntervalSeconds: 30,
});

boss.on('error', (err: Error) => {
  console.error('pg-boss error:', err);
});

boss.on('monitor-states', (states) => {
  console.log('pg-boss job states:', JSON.stringify(states));
});

// ---------------------------------------------------------------------------
// Recurring job schedules (cron — idempotent; safe to call on every start)
// ---------------------------------------------------------------------------
async function scheduleRecurringJobs(): Promise<void> {
  // Daily credential expiration scan at 08:00 UTC
  await boss.schedule('credential.expiration-check', '0 8 * * *', {});

  // Daily expired-session cleanup at 02:00 UTC
  await boss.schedule('cleanup.expired-sessions', '0 2 * * *', {});

  // Monthly audit-log cleanup on the 1st at 03:00 UTC
  await boss.schedule('cleanup.old-logs', '0 3 1 * *', {});
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
async function start(): Promise<void> {
  await boss.start();
  console.log('pg-boss worker started');

  await registerAllHandlers(boss);
  console.log('All job handlers registered');

  await scheduleRecurringJobs();
  console.log('Recurring jobs scheduled');
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown(): Promise<void> {
  console.log('Shutting down pg-boss worker...');
  await boss.stop({ graceful: true, timeout: 30_000 });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});
