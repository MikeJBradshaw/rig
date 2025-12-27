import type { Sql } from 'postgres'

import type { Role, RoleRow } from '@rig/schema/rbac/dtos/role'

import { NullDataError } from '../errors.js'

export interface CreateRoleParams {
  name: string
  owner: 'system' | 'company'
  description: string
}

// ***********************
// transactionally called to create a new role
// ***********************
const createRole = async (
  params: CreateRoleParams,
  txOrSql: Sql
): Promise<Role> => {
  const [row] = await txOrSql<RoleRow[]>`
    INSERT INTO role (name, owner, description)
    VALUES (${params.name}, ${params.owner}, ${params.description})
    RETURNING *
  `

  if (row === undefined) {
    throw new NullDataError('Failed to create role')
  }

  return row
}

// ***********************
// transactionally called after a users role is changed
// removed from a company to clean up
// ***********************
const deleteRoleById = async (
  roleId: string,
  txOrSql: Sql
): Promise<void> => {
  await txOrSql`
    DELETE FROM role
    WHERE id = ${roleId}
  `
}

export const role = {
  createRole,
  deleteRoleById
}
