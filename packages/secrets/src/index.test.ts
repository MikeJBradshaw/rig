import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'fs'

import { logger } from '@rig/logger'

// -----------------------------
// Mocks
// -----------------------------
vi.mock('fs', () => ({
  readFileSync: vi.fn()
}))

vi.mock('@rig/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    critical: vi.fn()
  }
}))

// -----------------------------
// Helpers
// -----------------------------
async function importSecretsWithEnv(env: string) {
  process.env.NODE_ENV = env
  vi.resetModules()
  return import('./index') // <-- adjust if your entry differs
}

beforeEach(() => {
  vi.clearAllMocks()
})

// -----------------------------
// Tests
// -----------------------------
describe('SecretsManager', () => {
  describe('local environment', () => {
    it('loads a secret from local secrets file', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          'rig-local-rds_pass': 'password'
        })
      )

      const { getSecret, keychain } = await importSecretsWithEnv('local')

      const value = await getSecret(keychain.DB_PASSWORD)

      expect(value).toBe('password')
    })

    it('caches secrets and only reads local file once', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          'rig-local-rds_pass': 'password',
          'rig-local-jwt_key': 'jwt'
        })
      )

      const { getSecret, keychain } = await importSecretsWithEnv('local')

      await getSecret(keychain.DB_PASSWORD)
      await getSecret(keychain.JWT_SECRET)

      expect(readFileSync).toHaveBeenCalledTimes(1)
    })

    it('throws if a required secret is missing', async () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}))

      const { getSecret, keychain } = await importSecretsWithEnv('local')

      await expect(
        getSecret(keychain.DB_PASSWORD)
      ).rejects.toThrow('Secret "rig-local-rds_pass" not found')
    })
  })

  describe('production environment', () => {
    it('fetches secrets using AWS naming in production', async () => {
      const { getSecret, keychain } = await importSecretsWithEnv('production')

      const value = await getSecret(keychain.DB_PASSWORD)

      expect(logger.info).toHaveBeenCalledWith(
        'Fetching secret',
        expect.objectContaining({
          key: 'rig-prod-rds_pass',
          service: 'aws'
        })
      )

      expect(value).toBe('rig-prod-rds_passs-value')
    })
  })

  describe('staging environment', () => {
    it('uses staging prefix when fetching secrets', async () => {
      const { getSecret, keychain } = await importSecretsWithEnv('staging')

      await getSecret(keychain.DB_NAME)

      expect(logger.info).toHaveBeenCalledWith(
        'Fetching secret',
        expect.objectContaining({
          key: 'rig-staging-rds_name',
          service: 'aws'
        })
      )
    })
  })

  describe('security guarantees', () => {
    it('never logs secret values', async () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          'rig-local-rds_pass': 'super-secret-password'
        })
      )

      const { getSecret, keychain } = await importSecretsWithEnv('local')

      await getSecret(keychain.DB_PASSWORD)

      const allLogArgs = [
        ...logger.info.mock.calls.flat(),
        ...logger.debug.mock.calls.flat(),
        ...logger.error.mock.calls.flat(),
        ...logger.critical.mock.calls.flat()
      ]

      for (const arg of allLogArgs) {
        expect(JSON.stringify(arg)).not.toContain('super-secret-password')
      }
    })
  })
})
