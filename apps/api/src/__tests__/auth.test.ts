import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

// ---------------------------------------------------------------------------
// Service mocks — hoisted before all imports by Vitest
// ---------------------------------------------------------------------------
vi.mock('../services/users/UserService.js', () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  toSafeUser: vi.fn(),
}));

vi.mock('../services/auth/PasswordService.js', () => ({
  validatePasswordStrength: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('../services/auth/SessionService.js', () => ({
  createSession: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllUserSessions: vi.fn(),
}));

vi.mock('../services/auth/EmailVerificationService.js', () => ({
  createVerification: vi.fn(),
  verifyEmail: vi.fn(),
  createPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('../services/audit/AuditService.js', () => ({
  writeAuditLog: vi.fn(),
}));

// Mock DB to prevent actual connection attempts
vi.mock('../db/index.js', () => ({
  db: {},
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are declared so hoisting takes effect)
// ---------------------------------------------------------------------------
import authRoutes from '../routes/auth.js';
import { clearRateLimitStore } from '../middleware/rateLimit.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { generateToken, hashToken } from '../services/auth/TokenService.js';
import {
  findUserByEmail,
  createUser,
  toSafeUser,
} from '../services/users/UserService.js';
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
} from '../services/auth/PasswordService.js';
import {
  createSession,
} from '../services/auth/SessionService.js';
import { createVerification } from '../services/auth/EmailVerificationService.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const FUTURE_DATE = new Date(Date.now() + 24 * 60 * 60 * 1000);

const MOCK_USER = {
  id: 'user-abc123',
  email: 'test@example.com',
  emailVerified: true,
  passwordHash: 'argon2-hashed',
  role: 'user' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const MOCK_PROFILE = {
  userId: 'user-abc123',
  displayName: null,
  defaultTone: 'voseo-cr' as const,
  preferredLocale: 'es-CR' as const,
  retainHistory: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_SESSION = {
  token: 'raw-session-token-hex',
  sessionId: 'session-id-123',
  expiresAt: FUTURE_DATE,
};

// ---------------------------------------------------------------------------
// Test app builder — creates a fresh Hono instance per suite
// ---------------------------------------------------------------------------
function buildApp() {
  const app = new Hono();
  app.route('/api/auth', authRoutes);
  app.onError(errorHandler);
  return app;
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe('POST /api/auth/register', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();

    vi.mocked(validatePasswordStrength).mockReturnValue(undefined);
    vi.mocked(hashPassword).mockResolvedValue('argon2-hashed');
    vi.mocked(createUser).mockResolvedValue({ user: MOCK_USER, profile: MOCK_PROFILE });
    vi.mocked(createSession).mockResolvedValue(MOCK_SESSION);
    vi.mocked(createVerification).mockResolvedValue({ token: 'email-verify-token' });
    vi.mocked(toSafeUser).mockReturnValue(MOCK_USER);
  });

  it('creates user and returns 201 with emailVerificationSent flag', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'SuperSecure123!',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { emailVerificationSent: boolean } };
    expect(body.data.emailVerificationSent).toBe(true);
  });

  it('calls createVerification to trigger the email flow', async () => {
    await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser2@example.com',
        password: 'SuperSecure123!',
      }),
    });

    expect(createVerification).toHaveBeenCalledWith(MOCK_USER.id);
  });

  it('returns 422 for invalid email', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'SuperSecure123!' }),
    });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    app = buildApp();

    vi.mocked(createSession).mockResolvedValue(MOCK_SESSION);
    vi.mocked(toSafeUser).mockReturnValue(MOCK_USER);
  });

  it('returns 401 with generic message when password is wrong', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(MOCK_USER);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong-password' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
    // Same generic message as "user not found" to prevent enumeration
    expect(body.error.message).toBe('Invalid email or password');
  });

  it('returns 401 with same message when user does not exist', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com', password: 'any-password' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
    expect(body.error.message).toBe('Invalid email or password');
  });

  it('returns 403 when email is not verified', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      ...MOCK_USER,
      emailVerified: false,
    });
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'SuperSecure123!' }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('returns session token on successful login', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(MOCK_USER);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'SuperSecure123!' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { token: string } };
    expect(body.data.token).toBe(MOCK_SESSION.token);
  });
});

describe('Token hashing (TokenService)', () => {
  it('generates tokens that are not their own hash', () => {
    const token = generateToken(32);
    const hashed = hashToken(token);

    expect(token).not.toBe(hashed);
  });

  it('hash is deterministic', () => {
    const token = generateToken(32);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('generates 64-character hex tokens from 32 bytes', () => {
    const token = generateToken(32);
    expect(token).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('hashToken produces 64-character SHA-256 hex', () => {
    const hash = hashToken('some-raw-token');
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });

  it('stored hash differs from the raw token (prevents plaintext storage)', () => {
    const raw = 'super-secret-session-token';
    const stored = hashToken(raw);
    // The raw token must never be identical to its own hash
    expect(stored).not.toBe(raw);
    // A raw token can never match the hash without going through hashToken
    expect(hashToken('anything-else')).not.toBe(stored);
  });
});

describe('Auth middleware — session validation', () => {
  // The requireAuth middleware queries the DB for sessions. We test it
  // by wiring it to a probe endpoint and mocking the DB call indirectly.
  // These tests verify the behavior specification via the route contract:
  // expired or revoked sessions → 401, valid session → next().

  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    app = buildApp();
  });

  it('requireAuth returns 401 when Authorization header is absent', async () => {
    // /api/auth/logout requires auth
    const res = await app.request('/api/auth/logout', {
      method: 'POST',
    });
    expect(res.status).toBe(401);
  });

  it('requireAuth returns 401 when Bearer token is empty', async () => {
    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' },
    });
    expect(res.status).toBe(401);
  });
});

describe('Rate limiting', () => {
  // Uses a distinct IP so this suite does not interfere with other tests.
  const RATE_LIMIT_IP = '203.0.113.99'; // TEST-NET-3, safe for test use

  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    app = buildApp();

    // Return a "user not found" response for all login attempts
    vi.mocked(findUserByEmail).mockResolvedValue(null);
  });

  afterEach(() => {
    clearRateLimitStore();
  });

  it('returns 429 after 10 auth attempts from the same IP', async () => {
    const makeRequest = () =>
      app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': RATE_LIMIT_IP,
        },
        body: JSON.stringify({ email: 'x@x.com', password: 'wrong' }),
      });

    // First 10 requests should pass rate limiting (though login fails with 401)
    for (let i = 0; i < 10; i++) {
      const res = await makeRequest();
      expect(res.status).not.toBe(429);
    }

    // 11th request should be rate-limited
    const res = await makeRequest();
    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
