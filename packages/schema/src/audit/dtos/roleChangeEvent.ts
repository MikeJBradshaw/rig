export interface RoleChangeEventRow {
  id: string
  user_id: string
  company_id: string
  role_id: string
  actor_user_id: string
  event_type_id: string
  occurred_at: number
}

export interface RoleChangeEvent {
  id: string
  userId: string
  companyId: string
  roleId: string
  actorUserId: string
  eventTypeId: string
  occurredAt: number
}
