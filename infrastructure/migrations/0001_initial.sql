-- =============================================================================
-- EDI Text Intelligence — Initial Migration
-- Generated for PostgreSQL 16
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Utility: auto-update updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL UNIQUE,
  email_verified        BOOLEAN NOT NULL DEFAULT false,
  password_hash         TEXT,
  role                  TEXT NOT NULL DEFAULT 'user',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  deletion_requested_at TIMESTAMPTZ,
  deletion_scheduled_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX users_email_idx ON users (email);
CREATE INDEX users_deleted_at_idx ON users (deleted_at);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: user_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE user_profiles (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name     TEXT,
  default_tone     TEXT NOT NULL DEFAULT 'voseo-cr',
  preferred_locale TEXT NOT NULL DEFAULT 'es-CR',
  retain_history   BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: sessions
-- ---------------------------------------------------------------------------
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  user_agent  TEXT,
  ip_address  TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX sessions_token_hash_idx ON sessions (token_hash);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- ---------------------------------------------------------------------------
-- Table: email_verifications
-- ---------------------------------------------------------------------------
CREATE TABLE email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX email_verifications_token_hash_idx ON email_verifications (token_hash);

-- ---------------------------------------------------------------------------
-- Table: password_reset_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX password_reset_tokens_token_hash_idx ON password_reset_tokens (token_hash);

-- ---------------------------------------------------------------------------
-- Table: provider_credentials
-- ---------------------------------------------------------------------------
CREATE TABLE provider_credentials (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL,
  mode             TEXT NOT NULL DEFAULT 'byok',
  label            TEXT NOT NULL,
  encrypted_key    TEXT NOT NULL,
  key_version      INTEGER NOT NULL DEFAULT 1,
  masked_key       TEXT NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  expires_at       TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  last_used_at     TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX provider_credentials_user_id_idx ON provider_credentials (user_id);
CREATE INDEX provider_credentials_is_active_idx ON provider_credentials (is_active);
CREATE INDEX provider_credentials_expires_at_idx ON provider_credentials (expires_at);

CREATE TRIGGER provider_credentials_updated_at
  BEFORE UPDATE ON provider_credentials
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID,
  action               TEXT NOT NULL,
  resource_type        TEXT,
  resource_id          TEXT,
  ip_address_hash      TEXT,
  user_agent_truncated TEXT,
  outcome              TEXT NOT NULL,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_user_id_idx ON audit_logs (user_id);
CREATE INDEX audit_logs_action_idx ON audit_logs (action);
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at);

-- ---------------------------------------------------------------------------
-- Table: usage_records
-- ---------------------------------------------------------------------------
CREATE TABLE usage_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id       UUID REFERENCES provider_credentials(id) ON DELETE SET NULL,
  provider            TEXT,
  transformation_type TEXT NOT NULL,
  source              TEXT NOT NULL,
  tokens_used         INTEGER,
  processing_ms       INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX usage_records_user_id_idx ON usage_records (user_id);
CREATE INDEX usage_records_created_at_idx ON usage_records (created_at);

-- ---------------------------------------------------------------------------
-- Table: quota_limits
-- ---------------------------------------------------------------------------
CREATE TABLE quota_limits (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_ai_requests   INTEGER NOT NULL DEFAULT 100,
  monthly_ai_requests INTEGER NOT NULL DEFAULT 1000,
  daily_used          INTEGER NOT NULL DEFAULT 0,
  monthly_used        INTEGER NOT NULL DEFAULT 0,
  reset_daily_at      TIMESTAMPTZ NOT NULL,
  reset_monthly_at    TIMESTAMPTZ NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER quota_limits_updated_at
  BEFORE UPDATE ON quota_limits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: deletion_requests
-- ---------------------------------------------------------------------------
CREATE TABLE deletion_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX deletion_requests_user_id_idx ON deletion_requests (user_id);
CREATE INDEX deletion_requests_status_idx ON deletion_requests (status);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE users IS 'Core user accounts with soft-delete support';
COMMENT ON TABLE user_profiles IS 'User preferences including locale and tone defaults';
COMMENT ON TABLE sessions IS 'Session tokens stored as hashes — never store raw tokens';
COMMENT ON TABLE email_verifications IS 'Email verification tokens stored as hashes';
COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens stored as hashes';
COMMENT ON TABLE provider_credentials IS 'AI provider API keys — encrypted with AES-256-GCM';
COMMENT ON COLUMN provider_credentials.encrypted_key IS 'AES-256-GCM encrypted API key';
COMMENT ON COLUMN provider_credentials.masked_key IS 'Last 6 characters only for display';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail — IP addresses are SHA-256 hashed';
COMMENT ON COLUMN audit_logs.ip_address_hash IS 'SHA-256 hash of IP address — never raw';
COMMENT ON COLUMN audit_logs.user_agent_truncated IS 'First 200 characters only';
COMMENT ON COLUMN audit_logs.metadata IS 'Must be pre-redacted before storage';
COMMENT ON TABLE usage_records IS 'AI usage tracking — no raw text stored, only metadata';
COMMENT ON TABLE quota_limits IS 'Per-user AI request quotas with auto-reset';
COMMENT ON TABLE deletion_requests IS 'GDPR-compliant account deletion workflow tracking';
