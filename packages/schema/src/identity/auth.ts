import type { User } from './dtos/user'
import type { Role } from '../rbac/dtos/role'
import type { Permission } from '../rbac/dtos/permission'

export interface GoogleLoginRequestBody {
  googleIdToken: string
}

export interface LoginSuccessResponse {
  user: User
  rbac: {
    role: Role
    permissions: Permission[]
  }
}
