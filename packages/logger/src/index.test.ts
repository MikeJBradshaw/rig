import { describe, it, expect, beforeEach, vi } from 'vitest'

// -----------------------------
// Helpers
// -----------------------------
async function importLoggerWithEnv (
  nodeEnv: string | undefined,
  serviceName?: string
) {
  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV
  } else {
    process.env.NODE_ENV = nodeEnv
  }

  if (serviceName !== undefined) {
    process.env.SERVICE_NAME = serviceName
  } else {
    delete process.env.SERVICE_NAME
  }

  vi.resetModules()
  return import('./index')
}

// -----------------------------
// Tests
// -----------------------------
describe('logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('local environment', () => {
    it('pretty-prints logs in local environment', async () => {
      const { logger } = await importLoggerWithEnv('local')

      logger.info('hello world')

      expect(consoleSpy).toHaveBeenCalled()
      const output = consoleSpy.mock.calls[0][0]

      expect(typeof output).toBe('string')
      expect(output).toContain('INFO')
      expect(output).toContain('hello world')
    })

    it('prints context on a second line when provided', async () => {
      const { logger } = await importLoggerWithEnv('local')

      logger.info('with context', { userId: 123 })

      expect(consoleSpy).toHaveBeenCalledTimes(2)

      const contextLine = consoleSpy.mock.calls[1]
      expect(contextLine[1]).toEqual({ userId: 123 })
    })

    it('does not print context line when context is empty', async () => {
      const { logger } = await importLoggerWithEnv('local')

      logger.info('no context', {})

      expect(consoleSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('non-local environments', () => {
    it('logs structured JSON in production', async () => {
      const { logger } = await importLoggerWithEnv('prod', 'test-service')

      logger.error('something failed', { code: 500 })

      expect(consoleSpy).toHaveBeenCalledTimes(1)

      const logged = JSON.parse(consoleSpy.mock.calls[0][0])

      expect(logged).toMatchObject({
        level: 'error',
        message: 'something failed',
        service: 'test-service',
        environment: 'prod',
        context: { code: 500 }
      })

      expect(typeof logged.timestamp).toBe('string')
    })

    it('omits context when none is provided', async () => {
      const { logger } = await importLoggerWithEnv('staging')

      logger.warning('heads up')

      const logged = JSON.parse(consoleSpy.mock.calls[0][0])

      expect(logged.context).toBeUndefined()
    })
  })

  describe('environment parsing', () => {
    it('defaults to local for unknown NODE_ENV', async () => {
      const { logger } = await importLoggerWithEnv('weird-env')

      logger.info('default env')

      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('INFO')
    })

    it('defaults service name when not provided', async () => {
      const { logger } = await importLoggerWithEnv('prod')

      logger.info('service test')

      const logged = JSON.parse(consoleSpy.mock.calls[0][0])
      expect(logged.service).toBe('unknown-service')
    })
  })
})
