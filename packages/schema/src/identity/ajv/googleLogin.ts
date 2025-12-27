import type { JSONSchemaType } from 'ajv'

import type { GoogleLoginRequestBody } from '../auth'

export const googleLoginSchema: JSONSchemaType<GoogleLoginRequestBody> = {
  type: 'object',
  required: ['googleIdToken'],
  additionalProperties: false,
  properties: {
    googleIdToken: {
      type: 'string',
      minLength: 1
    }
  }
} as const
