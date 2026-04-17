import PgBoss from 'pg-boss';
import { registerCredentialExpirationHandler } from './credentialExpiration';
import { registerUserDeletionHandler } from './userDeletion';
import { registerCleanupHandlers } from './cleanup';
import { registerEmailHandler } from './email';

export async function registerAllHandlers(boss: PgBoss): Promise<void> {
  await Promise.all([
    registerCredentialExpirationHandler(boss),
    registerUserDeletionHandler(boss),
    registerCleanupHandlers(boss),
    registerEmailHandler(boss),
  ]);
}
