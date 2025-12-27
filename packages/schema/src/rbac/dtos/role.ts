export interface RoleRow {
  id: string
  name: string
  owner: 'system' | 'company'
  description: string
}

export interface Role {
  id: string
  name: string
  owner: 'system' | 'company'
  description: string
}
