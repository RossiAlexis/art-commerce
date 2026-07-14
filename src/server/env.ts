import { z } from 'zod'

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
)
const optionalEmail = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.email().optional(),
)
const optionalPostgresUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.url().startsWith('postgresql://').optional(),
)

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.url().startsWith('postgresql://'),
  DIRECT_URL: optionalPostgresUrl,
  SESSION_SECRET: z.string().min(32),
  RESEND_API_KEY: optionalString,
  ARTIST_EMAIL: optionalEmail,
  EMAIL_FROM: optionalEmail,
  ALLOW_INDEXING: z.enum(['true', 'false']).default('false'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(
  input: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(input)

  if (!result.success) {
    throw new Error('Invalid server environment')
  }

  return result.data
}

let cachedEnv: ServerEnv | undefined

export function getServerEnv() {
  cachedEnv ??= parseServerEnv(process.env)
  return cachedEnv
}
