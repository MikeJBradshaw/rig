export const DbErrorCodes = {
  NULL_DATA: 'NULL_DATA',
  EMPTY_INPUT: 'EMPTY_INPUT'
} as const

export type DbErrorCode = typeof DbErrorCodes[keyof typeof DbErrorCodes]
