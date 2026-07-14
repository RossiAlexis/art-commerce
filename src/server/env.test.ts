import { describe, expect, it } from 'vitest'

import { parseServerEnv } from './env'

describe('parseServerEnv', () => {
  it('rejects missing deployment configuration without exposing values', () => {
    expect(() => parseServerEnv({ NODE_ENV: 'production' })).toThrow(
      'Invalid server environment',
    )
  })

  it('accepts runtime configuration without a migration-only URL', () => {
    expect(
      parseServerEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:password@example.test:6543/postgres',
        SESSION_SECRET: 'a-production-session-secret-over-32-characters',
      }),
    ).toMatchObject({
      NODE_ENV: 'production',
      ALLOW_INDEXING: 'false',
    })
  })
})
