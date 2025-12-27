import postgres from 'postgres'
import type { Sql } from 'postgres'

import { getSecret, keychain } from '@rig/secrets'
import { logger } from '@rig/logger'

let conn: Sql | null = null

export const getConn = async (): Promise<Sql> => {
  if (conn !== null) {
    return conn
  }

  logger.info('Initializing database connection')

  conn = postgres({
    host: await getSecret(keychain.DB_HOST),
    database: await getSecret(keychain.DB_NAME),
    user: await getSecret(keychain.DB_USER),
    password: await getSecret(keychain.DB_PASSWORD),
    port: 5432,
    max: 10
  })

  return conn
}
