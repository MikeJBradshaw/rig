import type { Sql } from 'postgres'

interface AccessAuditContext {
  companyId: string
  actorUserId: string
  targetUserId: string
  roleId?: string
  eventTypeId: string
  occurredAt: number
}

export const withAccessAudit = async <T> (
  audit: AccessAuditContext,
  action: (tx: Sql) => Promise<T>,
  tx: Sql
): Promise<T> => {
  const result = await action(tx)

  await tx`
    INSERT INTO access_audit_event (
      company_id,
      actor_user_id,
      target_user_id,
      role_id,
      event_type_id,
      occurred_at
    )
    VALUES (
      ${audit.companyId},
      ${audit.actorUserId},
      ${audit.targetUserId},
      ${audit.roleId ?? null},
      ${audit.eventTypeId},
      ${audit.occurredAt}
    )
  `

  return result
}
