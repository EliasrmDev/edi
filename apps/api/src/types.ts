import type { Hono } from 'hono';

/** Custom context variables set by middleware and read by route handlers. */
export interface AppVariables {
  requestId: string;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
  sessionId: string;
}

/** Hono environment type for the entire app. */
export interface AppEnv {
  Variables: AppVariables;
}

/** Typed Hono app. */
export type App = Hono<AppEnv>;
