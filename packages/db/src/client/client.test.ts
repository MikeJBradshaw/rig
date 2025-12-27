import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Sql } from 'postgres'

// --------------------
// Mocks
// --------------------
const mockQuery = vi.fn()

vi.mock('./db.js', () => ({
  db: {
    user: {
      findById: vi.fn((id: string, _sql: Sql) => {
        mockQuery(id)
        return Promise.resolve({ id })
      }),
      update: vi.fn((_id: string, _sql: Sql) => {
        mockQuery('update')
        return Promise.resolve()
      })
    }
  }
}))

const mockBegin = vi.fn()
const mockSql = {
  begin: mockBegin
} as unknown as Sql

vi.mock('./conn.js', () => ({
  getConn: vi.fn(() => Promise.resolve(mockSql))
}))

// Import AFTER mocks
import { client } from './client.js'
import { getConn } from './conn.js'

// --------------------
// Tests
// --------------------
describe('client.run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes callback with bound db and returns result', async () => {
    const result = await client.run(db => {
      return db.user.findById('123')
    })

    expect(getConn).toHaveBeenCalledOnce()
    expect(mockQuery).toHaveBeenCalledWith('123')
    expect(result).toEqual({ id: '123' })
  })

  it('propagates errors', async () => {
    await expect(
      client.run(() => {
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
  })
})

describe('client.transaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs callback inside a transaction and returns result', async () => {
    mockBegin.mockImplementation(async fn => {
      return fn(mockSql)
    })

    const result = await client.transaction(async db => {
      await db.user.update('123')
      return 'ok'
    })

    expect(getConn).toHaveBeenCalledOnce()
    expect(mockBegin).toHaveBeenCalledOnce()
    expect(mockQuery).toHaveBeenCalledWith('update')
    expect(result).toBe('ok')
  })

  it('propagates errors inside transaction', async () => {
    mockBegin.mockImplementation(async fn => {
      return fn(mockSql)
    })

    await expect(
      client.transaction(() => {
        throw new Error('tx fail')
      })
    ).rejects.toThrow('tx fail')
  })
})
