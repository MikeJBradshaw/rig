export const Permissions = {
  USER_READ: 'user:read',
  USER_INVITE: 'user:invite',
  USER_MANAGE: 'user:manage',

  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write'
} as const

export type PermissionName =
  typeof Permissions[keyof typeof Permissions]
