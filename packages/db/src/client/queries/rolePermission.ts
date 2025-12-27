import type { Sql } from 'postgres'

import type { RoleRow } from '@rig/schema/rbac/dtos/role.js'
import type { PermissionRow } from '@rig/schema/rbac/dtos/permission.js'
import type { RolePermission, RolePermissionRow, RolePermissionSet } from '@rig/schema/rbac/dtos/rolePermission'

import { EmptyInputError, NullDataError } from '../errors.js'

/**
 * Attach multiple permissions to a role.
 */
export const addPermissionsToRole = async (
  roleId: string,
  permissionIds: string[],
  txOrSql: Sql
): Promise<RolePermission[]> => {
  if (permissionIds.length === 0) {
    throw new EmptyInputError(
      'addPermissionsToRole requires at least one permissionId'
    )
  }

  const rows = await txOrSql<RolePermissionRow[]>`
    INSERT INTO role_permission (role_id, permission_id)
    SELECT ${roleId}, unnest(${txOrSql.array(permissionIds)})
    ON CONFLICT DO NOTHING
    RETURNING role_id, permission_id
  `

  return rows.map(r => ({
    roleId: r.role_id,
    permissionId: r.permission_id
  }))
}

/**
 * Detach multiple permissions from a role.
 */
export const removePermissionsFromRole = async (
  roleId: string,
  permissionIds: string[],
  txOrSql: Sql
): Promise<RolePermission[]> => {
  if (permissionIds.length === 0) {
    throw new EmptyInputError(
      'removePermissionsFromRole requires at least one permissionId'
    )
  }

  const rows = await txOrSql<RolePermissionRow[]>`
    DELETE FROM role_permission
    WHERE role_id = ${roleId}
      AND permission_id = ANY(${txOrSql.array(permissionIds)})
    RETURNING role_id, permission_id
  `

  return rows.map(r => ({
    roleId: r.role_id,
    permissionId: r.permission_id
  }))
}

export const getRoleWithPermissions = async (
  roleId: string,
  txOrSql: Sql
): Promise<RolePermissionSet> => {
  // Fetch role (must exist)
  const [role] = await txOrSql<RoleRow[]>`
    SELECT id, name, owner, description
    FROM role
    WHERE id = ${roleId}
  `

  if (role === undefined) {
    throw new NullDataError(`Role not found: ${roleId}`)
  }

  // Fetch permissions assigned to role
  const permissions = await txOrSql<PermissionRow[]>`
    SELECT p.id, p.name, p.description
    FROM role_permission rp
    JOIN permission p
      ON p.id = rp.permission_id
    WHERE rp.role_id = ${roleId}
    ORDER BY p.name
  `

  return {
    role,
    permissions
  }
}

export const rolePermission = {
  addPermissionsToRole,
  removePermissionsFromRole,
  getRoleWithPermissions
}
