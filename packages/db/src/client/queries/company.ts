import type { Sql } from 'postgres'

import type { Company, CompanyRow } from '@rig/schema/rbac/dtos/company'

import { NullDataError } from '../errors.js'

/**
 * Create a new company
 */
export interface CreateCompanyParams {
  name: string
  createdAt: number
}

const createCompany = async (
  params: CreateCompanyParams,
  txOrSql: Sql
): Promise<Company> => {
  const [row] = await txOrSql<CompanyRow[]>`
    INSERT INTO company (name, created_at)
    VALUES (${params.name}, ${params.createdAt})
    RETURNING *
  `

  if (row === undefined) {
    throw new NullDataError('Unable to create company')
  }

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at
  }
}

/**
 * Fetch company by ID
 */
const getCompanyById = async (
  companyId: string,
  txOrSql: Sql
): Promise<Company> => {
  const [row] = await txOrSql<CompanyRow[]>`
    SELECT *
    FROM company
    WHERE id = ${companyId}
  `

  if (row === undefined) {
    throw new NullDataError('Unable to find company')
  }

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at
  }
}

export const company = {
  createCompany,
  getCompanyById
}
