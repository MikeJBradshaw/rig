import { user } from './queries/user.js'
import { session } from './queries/session.js'
import { company } from './queries/company.js'
import { role } from './queries/role.js'
import { companyUser } from './queries/companyUser.js'
import { permission } from './queries/permission.js'
import { rolePermission } from './queries/rolePermission.js'

export const db = {
  identity: {
    ...user,
    ...session
  },
  rbac: {
    company,
    roleAndPermissions: {
      ...role,
      ...permission,
      ...rolePermission
    },
    companyUser
  }
}

export type DB = typeof db
