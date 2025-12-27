-- 001_auth_and_rbac.sql
-- Auth, Session, RBAC
-- All timestamps are stored as UTC seconds since Unix epoch (BIGINT)

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- IDENTITY
-- =====================================================
CREATE TABLE app_user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  created_at    BIGINT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE session (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  issued_at   BIGINT NOT NULL,
  expires_at  BIGINT NOT NULL,
  revoked_at  BIGINT
);

CREATE INDEX idx_session_user_id
  ON session(user_id);

CREATE INDEX idx_session_expires_at
  ON session(expires_at);

CREATE UNIQUE INDEX uniq_active_session_per_user
  ON session(user_id)
  WHERE revoked_at IS NULL;

-- =====================================================
-- RBAC STATE (EPHEMERAL)
-- =====================================================

CREATE TABLE company (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  BIGINT NOT NULL
);

CREATE TABLE role (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner       TEXT NOT NULL CHECK (owner in ('system', 'company')),
  description TEXT NOT NULL
);

CREATE UNIQUE INDEX uniq_system_role_name
  ON role(name)
  WHERE owner = 'system';

CREATE TABLE permission (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE role_permission (
  role_id        UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  permission_id  UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permission_role_id
  ON role_permission(role_id);

CREATE INDEX idx_role_permission_permission_id
  ON role_permission(permission_id);

CREATE TABLE company_user (
  user_id     UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES role(id),
  PRIMARY KEY (user_id, company_id)
);

CREATE INDEX idx_company_user_company
  ON company_user(company_id);

CREATE INDEX idx_company_user_user
  ON company_user(user_id);

CREATE INDEX idx_company_user_role_id
  ON company_user(role_id);

-- =====================================================
-- AUDIT: USER ↔ COMPANY MEMBERSHIP
-- =====================================================

CREATE TABLE user_company_event_type (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE user_company_event (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES app_user(id),
  company_id     UUID NOT NULL REFERENCES company(id),
  actor_user_id  UUID NOT NULL REFERENCES app_user(id),
  event_type_id  UUID NOT NULL REFERENCES user_company_event_type(id),
  occurred_at    BIGINT NOT NULL
);

CREATE INDEX idx_user_company_event_user
  ON user_company_event(user_id);

CREATE INDEX idx_user_company_event_company
  ON user_company_event(company_id);

CREATE INDEX idx_user_company_event_time
  ON user_company_event(occurred_at);

-- =====================================================
-- AUDIT: USER ↔ ROLE ASSIGNMENT
-- =====================================================

CREATE TABLE role_change_type (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE role_change_event (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES app_user(id),
  company_id     UUID NOT NULL REFERENCES company(id),
  role_id        UUID NOT NULL REFERENCES role(id),
  actor_user_id  UUID NOT NULL REFERENCES app_user(id),
  event_type_id  UUID NOT NULL REFERENCES role_change_type(id),
  occurred_at    BIGINT NOT NULL
);

CREATE INDEX idx_role_change_event_user
  ON role_change_event(user_id);

CREATE INDEX idx_role_change_event_company
  ON role_change_event(company_id);

CREATE INDEX idx_role_change_event_time
  ON role_change_event(occurred_at);

-- =====================================================
-- AUDIT: ROLE ↔ PERMISSION POLICY
-- =====================================================

CREATE TABLE permission_change_type (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE permission_change_event (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id         UUID NOT NULL REFERENCES role(id),
  permission_id   UUID NOT NULL REFERENCES permission(id),
  actor_user_id   UUID NOT NULL REFERENCES app_user(id),
  event_type_id   UUID NOT NULL REFERENCES permission_change_type(id),
  occurred_at     BIGINT NOT NULL
);

CREATE INDEX idx_permission_change_event_role
  ON permission_change_event(role_id);

CREATE INDEX idx_permission_change_event_time
  ON permission_change_event(occurred_at);

-- =====================================================
-- BASE VOCABULARY (OPTIONAL SEED)
-- =====================================================
INSERT INTO permission (id, name, description) VALUES
  (gen_random_uuid(), 'user:read', 'View users'),
  (gen_random_uuid(), 'user:invite', 'Invite new users'),
  (gen_random_uuid(), 'user:manage', 'Manage users and roles'),
  (gen_random_uuid(), 'settings:read', 'View application settings'),
  (gen_random_uuid(), 'settings:write', 'Modify application settings')
ON CONFLICT (name) DO NOTHING;

-- =========================
-- roles (starter only)
-- =========================

INSERT INTO role (id, name, description) VALUES
  (gen_random_uuid(), 'admin', 'Full access'),
  (gen_random_uuid(), 'analyst', 'Standard user access'),
  (gen_random_uuid(), 'viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_company_event_type (name, description) VALUES
  ('user_added_to_company', 'User granted membership in company'),
  ('user_removed_from_company', 'User membership revoked from company')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_change_type (name, description) VALUES
  ('role_assigned_to_user', 'Role assigned to user'),
  ('role_changed_for_user', 'User role updated'),
  ('role_removed_for_user', 'User role removed')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permission_change_type (name, description) VALUES
  ('permission_added_to_role', 'Permission added to role'),
  ('permission_removed_from_role', 'Permission removed from role')
ON CONFLICT (name) DO NOTHING;

COMMIT;
