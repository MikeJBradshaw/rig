import type { Sql } from 'postgres'

import type { Session, SessionRow } from '@rig/schema/identity/dtos/session'

import { NullDataError } from '../errors.js'

/**
 * Create a new session
 */
export interface CreateSessionParams {
  userId: string
  issuedAt: number
  expiresAt: number
}

const createSession = async (params: CreateSessionParams, txOrSql: Sql): Promise<Session> => {
  const [row] = await txOrSql<SessionRow[]>`
    INSERT INTO session (user_id, issued_at, expires_at)
    VALUES (${params.userId}, ${params.issuedAt}, ${params.expiresAt})
    RETURNING *
  `
  if (row === undefined) {
    throw new NullDataError('Unable to create session')
  }

  return {
    id: row.id,
    expiresAt: row.expires_at,
    issuedAt: row.issued_at,
    revokedAt: row.revoked_at,
    userId: row.user_id
  }
}

/**
 * Fetch active (non-revoked, non-expired) session by ID
 */
const getActiveSessionById = async (sessionId: string, txOrSql: Sql): Promise<Session> => {
  const [row] = await txOrSql<SessionRow[]>`
    SELECT *
    FROM session
    WHERE id = ${sessionId}
      AND revoked_at IS NULL
      AND expires_at > EXTRACT(EPOCH FROM NOW())
  `
  if (row === undefined) {
    throw new NullDataError('Unable to find session')
  }

  return {
    id: row.id,
    expiresAt: row.expires_at,
    issuedAt: row.issued_at,
    revokedAt: row.revoked_at,
    userId: row.user_id
  }
}

/**
 * Revoke a session (logout)
 */
export interface RevokeSessionParams {
  sessionId: string
  revokedAt: number
}
const revokeSession = async (
  params: RevokeSessionParams,
  txOrSql: Sql
): Promise<void> => {
  await txOrSql`
    UPDATE session
    SET revoked_at = ${params.revokedAt}
    WHERE id = ${params.sessionId}
  `
}

/**
 * Revoke all other active sessions for a user
 * (enforces single-session policy if you want it)
 */
export interface RevokeOtherSessionParams {
  userId: string
  keepSessionId: string
  revokedAt: number
}
const revokeOtherSessions = async (
  params: RevokeOtherSessionParams,
  txOrSql: Sql
): Promise<void> => {
  await txOrSql`
    UPDATE session
    SET revoked_at = ${params.revokedAt}
    WHERE user_id = ${params.userId}
      AND id <> ${params.keepSessionId}
      AND revoked_at IS NULL
  `
}

export const session = {
  createSession,
  getActiveSessionById,
  revokeSession,
  revokeOtherSessions
}
