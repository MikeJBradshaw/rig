import type { Sql } from 'postgres'

interface UserAuditContext {
  userId: string
  companyId?: string | null
  actorUserId: string
  eventTypeId: string
  occurredAt: number
}

export const withUserAudit = async <T> (
  audit: UserAuditContext,
  action: (tx: Sql) => Promise<T>,
  tx: Sql
): Promise<T> => {
  const result = await action(tx)

  await tx`
    INSERT INTO user_audit_event (
      user_id,
      company_id,
      actor_user_id,
      event_type_id,
      occurred_at
    )
    VALUES (
      ${audit.userId},
      ${audit.companyId ?? null},
      ${audit.actorUserId},
      ${audit.eventTypeId},
      ${audit.occurredAt}
    )
  `

  return result
}
