export interface SessionRow {
  id: string
  user_id: string
  issued_at: number
  expires_at: number
  revoked_at: number | null
}

export interface Session {
  id: string
  userId: string
  issuedAt: number
  expiresAt: number
  revokedAt: number | null
}
