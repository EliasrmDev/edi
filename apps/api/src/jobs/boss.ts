/**
 * pg-boss stub for Cloudflare Workers.
 *
 * Delayed jobs (credential expiration reminders, deletion workflows) are no
 * longer scheduled here. They are picked up by the daily cron triggers in
 * the `apps/workers-cf` Cloudflare Worker.
 *
 * All callers already wrap getBoss() with `.catch(() => null)` so this throw
 * is silently ignored — the job is simply skipped in the API and handled
 * asynchronously by the cron worker.
 */

/** Minimal interface matching the pg-boss methods used by CredentialService. */
export interface JobBoss {
  send(
    name: string,
    data: unknown,
    options?: { startAfter?: Date | string },
  ): Promise<string | null>;
}

export async function getBoss(): Promise<JobBoss> {
  throw new Error(
    'pg-boss is not available in Cloudflare Workers. ' +
      'Scheduled jobs are handled by the workers-cf cron triggers.',
  );
}

