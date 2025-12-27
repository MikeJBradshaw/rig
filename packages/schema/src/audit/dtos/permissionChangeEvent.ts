export interface PermissionChangeEventRow {
  id: string
  role_id: string
  permission_id: string
  actor_user_id: string
  event_type_id: string
  occurred_at: number
}

export interface PermissionChangeEvent {
  id: string
  roleId: string
  permissionId: string
  actorUserId: string
  eventTypeId: string
  occurredAt: number
}
