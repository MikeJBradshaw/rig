import type { Role } from './role'
import type { Permission } from './permission'

export interface RolePermissionRow {
  role_id: string
  permission_id: string
}

export interface RolePermission {
  roleId: string
  permissionId: string
}

export interface RolePermissionSet {
  role: Role
  permissions: Permission[]
}
