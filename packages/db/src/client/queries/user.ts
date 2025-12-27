import type { Sql } from 'postgres'

import type { User, UserRow } from '@rig/schema/identity/dtos/user.js'

import { NullDataError } from '../errors.js'

const getUserByEmail = async (email: string, sql: Sql): Promise<User> => {
  const [row] = await sql<UserRow[]>`
    SELECT *
    FROM app_user
    WHERE email = ${email}
    LIMIT 1
  `

  if (row === undefined) {
    throw new NullDataError('User not found')
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    isActive: row.is_active
  }
}

const getUserById = async (userId: string, sql: Sql): Promise<User> => {
  const [row] = await sql<UserRow[]>`
    SELECT *
    FROM app_user
    WHERE id = ${userId}
    LIMIT 1
  `

  if (row === undefined) {
    throw new NullDataError('User not found')
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    isActive: row.is_active
  }
}

export interface CreateUserParams {
  email: string
  displayName: string
  createdAt: number
}
const createUser = async (params: CreateUserParams, sql: Sql): Promise<User> => {
  const [row] = await sql<UserRow[]>`
    INSERT INTO app_user (
      email,
      display_name,
      created_at,
      is_active
    )
    VALUES (
      ${params.email},
      ${params.displayName},
      ${params.createdAt},
      TRUE
    )
    RETURNING *
  `

  if (row === undefined) {
    throw new NullDataError('User could not be created')
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    isActive: row.is_active
  }
}

const deactivateUser = async (userId: string, sql: Sql): Promise<void> => {
  await sql`
    UPDATE app_user
    SET is_active = FALSE
    WHERE id = ${userId}
  `
}

export const user = {
  getUserByEmail,
  getUserById,
  createUser,
  deactivateUser
}
