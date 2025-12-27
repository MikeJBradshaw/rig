import type { Sql } from 'postgres'

import { getConn } from './conn.js'
import { db } from './db.js'
import type { DB } from './db.js'

type AnyFn = (...args: any[]) => any

// --------------------------------------------------
// DB function contract
// --------------------------------------------------
// All DB functions MUST take Sql as their final argument.
// Sql is never exposed to callers.
export type DbFn<Args extends any[], R> =
  (...args: [...Args, Sql]) => Promise<R>

// --------------------------------------------------
// Type helpers to erase Sql from public surface
// --------------------------------------------------
type StripSql<F> =
  F extends (...args: [...infer A, any]) => infer R
    ? (...args: A) => R
    : F

type BindNamespace<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? StripSql<T[K]>
    : T[K] extends object
      ? BindNamespace<T[K]>
      : T[K]
}

// --------------------------------------------------
// bindDb helpers
// --------------------------------------------------
const bindNamespace = <T extends Record<string, any>>(
  namespace: T,
  sql: Sql
): BindNamespace<T> => {
  return Object.fromEntries(
    Object.entries(namespace).map(([key, value]) => {
      if (typeof value === 'function') {
        const fn = value as AnyFn
        return [
          key,
          (...args: any[]) => fn(...args, sql)
        ]
      }

      return [
        key,
        bindNamespace(value, sql)
      ]
    })
  ) as BindNamespace<T>
}

const bindDb = (sql: Sql): BindNamespace<typeof db> => {
  return bindNamespace(db, sql)
}

// --------------------------------------------------
// Client API
// --------------------------------------------------
export const client = {
  // ------------------------------------------------
  // Run without explicit transaction
  // ------------------------------------------------
  run: async <T>(
    fn: (db: BindNamespace<DB>) => Promise<T>
  ): Promise<T> => {
    const sql = await getConn()
    return await fn(bindDb(sql))
  },

  // ------------------------------------------------
  // Run inside a transaction
  // ------------------------------------------------
  transaction: async <T>(
    fn: (db: BindNamespace<DB>, tx: Sql) => Promise<T>
  ): Promise<T> => {
    const sql = await getConn()

    return await sql.begin(async tx => {
      const boundDb = bindDb(tx)
      return await fn(boundDb, tx)
    }) as T
  }
}
