import type { Sql } from 'postgres'

import type { Permission, PermissionRow } from '@rig/schema/rbac/dtos/permission.js'

/**
 * Fetch all permission definitions.
 * This is the canonical permission vocabulary.
 */
const getAllPermissions = async (
  txOrSql: Sql
): Promise<Permission[]> => {
  const rows = await txOrSql<PermissionRow[]>`
    SELECT id, name, description
    FROM permission
    ORDER BY name
  `

  // Empty is valid. Permissions are system-defined.
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description
  }))
}

export const permission = {
  getAllPermissions
}
