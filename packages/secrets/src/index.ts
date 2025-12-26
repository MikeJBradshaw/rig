import { readFileSync } from 'fs'
import { join } from 'path'

// const { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

import { logger } from '@rig/logger'
import type { EnvironmentType } from '@rig/schema'

export const keychain = {
  DB_PASSWORD: 'rds_pass',
  DB_USER: 'rds_user',
  DB_HOST: 'rds_host',
  DB_NAME: 'rds_name',
  JWT_SECRET: 'jwt_key',
  GOOGLE_CLIENT_ID: 'google_client_id'
} as const

export type KeychainKey = typeof keychain[keyof typeof keychain]

const rawEnv = process.env.NODE_ENV ?? 'local'
const env: EnvironmentType = rawEnv === 'production' ? 'prod' : rawEnv === 'staging' ? 'staging' : 'local'

class SecretsManager {
  private readonly cache: Map<string, string> = new Map()
  private localLoaded: boolean = false
  // private awsClient: SecretsManagerClient | null // TODO uncomment once I hook up AWS

  private buildSecretName (base: KeychainKey): string { return `rig-${env}-${base}` }

  private readonly loadFromLocal = async (): Promise<void> => {
    if (this.localLoaded) {
      logger.debug('Local secrets already loaded', { environment: env, localLoaded: this.localLoaded })
      return
    }

    logger.info('loading local secrets file', { environment: env, localLoaded: this.localLoaded })
    const secretsPath = join(process.cwd(), 'secrets.local.json')
    try {
      // Look for secrets.local.json
      const raw = readFileSync(secretsPath, 'utf-8')
      const parsed = JSON.parse(raw)

      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('secrets.local.json must be an object')
      }

      for (const [key, value] of Object.entries(parsed)) {
        this.cache.set(key, String(value))
      }

      this.localLoaded = true
    } catch (error) {
      logger.critical('failed to find local secrets', {
        environment: env,
        secretsPath,
        errorType: error instanceof Error ? error.name : 'unknown'
      })
      throw new Error('Failed to find local secrets')
    }
  }

  private readonly loadFromAws = async (key: string): Promise<string> => {
    // TODO: Replace with actual AWS Secrets Manager SDK call
    logger.info('Fetching secret', { key, service: 'aws', environment: env })

    // Dummy implementation - returns a placeholder
    return `${key}s-value`

    /*
    // Real implementation (uncomment when ready):

    const command = new GetSecretValueCommand({ SecretId: secretName })

    try {
      const response = await this.awsClient.send(command)
      if (response.SecretString) {
        return response.SecretString
      }
      throw new Error(`Secret ${secretName} has no string value`)
    } catch (error) {
      throw new Error(`Failed to retrieve secret ${secretName} from AWS: ${error}`)
    }
    */
  }

  // ---------------------------------------------
  // the only method allowed to be used, it gets a secret based in input keychainKey
  // ---------------------------------------------
  async getSecret (keychainKey: KeychainKey): Promise<string> {
    const secretName = this.buildSecretName(keychainKey)
    // Check cache first
    if (this.cache.has(secretName)) {
      logger.debug('Retrieved key from cache', { key: keychainKey, environment: env })
      return this.cache.get(secretName) as string
    }

    // ok not in cache. if this is local, we need to load all of the secrets at once, if its aws, its loaded
    // into cache the first time we request the key
    switch (env) {
      case 'local':
        await this.loadFromLocal()
        break
      case 'staging':
      case 'prod': {
        const value = await this.loadFromAws(secretName)
        this.cache.set(secretName, value)
        break
      }
    }

    const value = this.cache.get(secretName)
    if (value === undefined) {
      logger.critical('Secret not found after loading', { key: keychainKey, environment: env })
      throw new Error(`Secret "${secretName}" not found`)
    }

    return value
  }

  // TODO: uncomment when I hook up AWS
  // private getAwsClient() {
  //   if (this.awsClient === null) {
  //     this.awsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' })
  //   }
  //   return this.awsClient
  // }
}

// Singleton instance
const secretsManager = new SecretsManager()

// Main export
export const getSecret = async (key: KeychainKey): Promise<string> => await secretsManager.getSecret(key)
