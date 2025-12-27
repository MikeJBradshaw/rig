import { DbErrorCodes } from '@rig/schema/db/errorCodes'
import type { DbErrorCode } from '@rig/schema/db/errorCodes'

/**
 * Base class for all DB-originated errors.
 * NOT exported publicly.
 */
abstract class DbError extends Error {
  abstract readonly code: DbErrorCode

  protected constructor (message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Thrown when a query that MUST return data returns nothing.
 */
export class NullDataError extends DbError {
  readonly code = DbErrorCodes.NULL_DATA

  constructor (message: string) {
    super(message)
    this.name = 'NullDataError'
  }
}

/**
 * Thrown when a bulk DB operation receives empty input.
 */
export class EmptyInputError extends DbError {
  readonly code = DbErrorCodes.EMPTY_INPUT

  constructor (
    message = 'Operation requires at least one input value'
  ) {
    super(message)
    this.name = 'EmptyInputError'
  }
}
