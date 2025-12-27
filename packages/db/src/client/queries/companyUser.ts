import type { Sql } from 'postgres'

import type { CompanyUser, CompanyUserRow } from '@rig/schema/rbac/dtos/companyUser'

import { NullDataError } from '../errors.js'

const addUserToCompany = async (
  params: CompanyUser,
  txOrSql: Sql
): Promise<CompanyUser> => {
  const [row] = await txOrSql<CompanyUserRow[]>`
    INSERT INTO company_user (user_id, company_id, role_id)
    VALUES (${params.userId}, ${params.companyId}, ${params.roleId})
    RETURNING *
  `

  if (row === undefined) {
    throw new NullDataError('Failed to add user to company')
  }

  return {
    companyId: row.company_id,
    roleId: row.role_id,
    userId: row.user_id
  }
}

const getUsersCompanyAndRole = async (
  userId: string,
  txOrSql: Sql
): Promise<CompanyUser> => {
  const [row] = await txOrSql<CompanyUserRow[]>`
    SELECT *
    FROM company_user
    WHERE user_id = ${userId}
  `

  if (row === undefined) {
    throw new NullDataError('User not found in company')
  }

  return {
    userId: row.user_id,
    companyId: row.company_id,
    roleId: row.role_id
  }
}

const updateUserRoleInCompany = async (
  params: CompanyUser,
  txOrSql: Sql
): Promise<CompanyUser> => {
  const [row] = await txOrSql<CompanyUserRow[]>`
    UPDATE company_user
    SET role_id = ${params.roleId}
    WHERE user_id = ${params.userId}
      AND company_id = ${params.companyId}
    RETURNING user_id, company_id, role_id
  `

  if (row === undefined) {
    throw new NullDataError('User not found in company')
  }

  return {
    userId: row.user_id,
    companyId: row.company_id,
    roleId: row.role_id
  }
}

export interface RemoveUserFromCompanyParams {
  userId: string
  companyId: string
}
const removeUserFromCompany = async (
  params: RemoveUserFromCompanyParams,
  txOrSql: Sql
): Promise<CompanyUser> => {
  const [row] = await txOrSql<CompanyUserRow[]>`
    DELETE FROM company_user
    WHERE user_id = ${params.userId}
      AND company_id = ${params.companyId}
    RETURNING user_id, company_id, role_id
  `

  if (row === undefined) {
    throw new NullDataError('User not found in company')
  }

  return {
    userId: row.user_id,
    companyId: row.company_id,
    roleId: row.role_id
  }
}

export const companyUser = {
  addUserToCompany,
  getUsersCompanyAndRole,
  updateUserRoleInCompany,
  removeUserFromCompany
}
