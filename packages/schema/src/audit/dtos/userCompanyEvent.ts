export interface UserCompanyEventRow {
  id: string
  user_id: string
  company_id: string
  actor_user_id: string
  event_type_id: string
  occurred_at: number
}

export interface UserCompanyEvent {
  id: string
  userId: string
  companyId: string
  actorUserId: string
  eventTypeId: string
  occurredAt: number
}
