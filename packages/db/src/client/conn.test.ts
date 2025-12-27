import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----------------------
// Mocks
// ----------------------

// Mock postgres() constructor
vi.mock('postgres', () => {
  const mockBegin = vi.fn()
  const mockSqlInstance = { begin: mockBegin }

  const postgresMock = vi.fn(() => mockSqlInstance)

  return {
    default: postgresMock,
    __mock__: {
      postgresMock,
      mockSqlInstance,
      mockBegin
    }
  }
})

vi.mock('@rig/secrets', () => ({
  getSecret: vi.fn(() => Promise.resolve('test')),
  keychain: {
    DB_HOST: 'rds_host',
    DB_NAME: 'rds_name',
    DB_USER: 'rds_user',
    DB_PASSWORD: 'rds_pass'
  }
}))

// IMPORTANT: import AFTER mocks
import { getConn } from './conn.js'
import postgres from 'postgres'

// ----------------------
// Tests
// ----------------------
describe('conn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('does not create a connection at import time', () => {
    expect(postgres).not.toHaveBeenCalled()
  })

  it('creates a connection on first getConn()', async () => {
    const { getConn } = await import('./conn.js')
    const postgres = (await import('postgres')).default

    const conn = await getConn()
    expect(postgres).toHaveBeenCalledOnce()
  })

  it('returns the same connection instance on subsequent calls', async () => {
    const { getConn } = await import('./conn.js')
    const postgres = (await import('postgres')).default

    const a = await getConn()
    const b = await getConn()

    expect(a).toBe(b)
    expect(postgres).toHaveBeenCalledOnce()
  })

  it('loads connection config from secrets', async () => {
    const { getConn } = await import('./conn.js')
    const  { getSecret } = await import('@rig/secrets')

    await getConn()

    expect(getSecret).toHaveBeenCalledWith('rds_host')
    expect(getSecret).toHaveBeenCalledWith('rds_name')
    expect(getSecret).toHaveBeenCalledWith('rds_user')
    expect(getSecret).toHaveBeenCalledWith('rds_pass')
  })
})
