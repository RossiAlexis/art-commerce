import { createHmac, timingSafeEqual } from 'node:crypto'

/** Name of the signed, HTTP-only cookie holding the database Session identifier. */
export const SESSION_COOKIE_NAME = 'pf_session'

/** Database Sessions live for 30 days; a "remember me" cookie mirrors that lifetime. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

/** Where an anonymous or non-admin visitor is sent to authenticate. */
export const LOGIN_PATH = '/login'

/** The query parameter carrying a validated post-login return target. */
export const REDIRECT_TO_PARAM = 'redirectTo'

export type SessionUser = {
  id: string
  username: string
  roles: Array<string>
}

export type DatabaseSession = {
  id: string
  userId: string
  expirationDate: Date
}

export type SessionWithUser = {
  id: string
  expirationDate: Date
  user: SessionUser
}

export type LoginCandidate = {
  id: string
  passwordHash: string | null
}

export type AuthRepository = {
  findLoginCandidate: (username: string) => Promise<LoginCandidate | null>
  createSession: (input: {
    userId: string
    expirationDate: Date
  }) => Promise<DatabaseSession>
  findSessionWithUser: (sessionId: string) => Promise<SessionWithUser | null>
  deleteSession: (sessionId: string) => Promise<void>
}

export type PasswordVerifier = (
  password: string,
  hash: string,
) => Promise<boolean>

/** Plain cookie attributes; the server adapter maps these onto its cookie API. */
export type SessionCookieOptions = {
  httpOnly: true
  sameSite: 'lax'
  path: '/'
  secure: boolean
  expires?: Date
}

/**
 * Compute the database Session expiration relative to `now`. The lifetime is
 * constant regardless of "remember me"; only the browser cookie differs.
 */
export function getSessionExpirationDate(now: number): Date {
  return new Date(now + SESSION_MAX_AGE_SECONDS * 1000)
}

/**
 * Build the attributes for the authentication cookie. The cookie is always
 * HTTP-only, same-site, path-scoped, and secure in production. "Remember me"
 * selects a persistent cookie (with `expires`) over a browser-session cookie.
 */
export function sessionCookieOptions(input: {
  secure: boolean
  remember: boolean
  expirationDate: Date
}): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: input.secure,
    ...(input.remember ? { expires: input.expirationDate } : {}),
  }
}

/** Attributes used when clearing the authentication cookie on logout. */
export function clearedSessionCookieOptions(
  secure: boolean,
): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    expires: new Date(0),
  }
}

function toBase64Url(input: Buffer): string {
  return input.toString('base64url')
}

/**
 * Sign a database Session identifier so the cookie cannot be forged. The value
 * is `<id>.<base64url hmac>`; verification is constant-time.
 */
export function signSessionId(sessionId: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(sessionId).digest()
  return `${sessionId}.${toBase64Url(signature)}`
}

/**
 * Verify a signed cookie value and return the enclosed Session identifier, or
 * `null` when the value is malformed or its signature does not match.
 */
export function unsignSessionId(
  value: string | undefined,
  secret: string,
): string | null {
  if (!value) return null

  const separator = value.lastIndexOf('.')
  if (separator <= 0) return null

  const sessionId = value.slice(0, separator)
  const provided = value.slice(separator + 1)
  const expected = toBase64Url(
    createHmac('sha256', secret).update(sessionId).digest(),
  )

  const providedBytes = Buffer.from(provided)
  const expectedBytes = Buffer.from(expected)
  if (providedBytes.length !== expectedBytes.length) return null
  if (!timingSafeEqual(providedBytes, expectedBytes)) return null

  return sessionId
}

/**
 * Restrict a return target to a same-site absolute path, defeating open
 * redirects such as `//evil.com` or `/\evil.com`.
 */
export function safeRedirect(to: unknown, fallback = '/'): string {
  if (
    typeof to !== 'string' ||
    !to.startsWith('/') ||
    to.startsWith('//') ||
    to.startsWith('/\\')
  ) {
    return fallback
  }

  return to
}

/** Build the login URL that returns the visitor to `returnTo` after signing in. */
export function loginPathWithRedirect(returnTo: string): string {
  const target = safeRedirect(returnTo)
  if (target === '/') return LOGIN_PATH
  return `${LOGIN_PATH}?${REDIRECT_TO_PARAM}=${encodeURIComponent(target)}`
}

/**
 * Verify credentials against the existing bcrypt-compatible contract and, on
 * success, create a database Session. Returns `null` for unknown users, users
 * without a stored password, and incorrect passwords alike.
 */
export async function attemptLogin(input: {
  repository: AuthRepository
  verifyPassword: PasswordVerifier
  username: string
  password: string
  now: number
}): Promise<DatabaseSession | null> {
  const candidate = await input.repository.findLoginCandidate(input.username)
  if (!candidate || !candidate.passwordHash) return null

  const valid = await input.verifyPassword(
    input.password,
    candidate.passwordHash,
  )
  if (!valid) return null

  return input.repository.createSession({
    userId: candidate.id,
    expirationDate: getSessionExpirationDate(input.now),
  })
}

/**
 * Resolve the authenticated user for a signed session id. Expired Sessions are
 * treated as anonymous and purged from the database.
 */
export async function resolveSessionUser(input: {
  repository: AuthRepository
  sessionId: string | null
  now: number
}): Promise<SessionUser | null> {
  if (!input.sessionId) return null

  const session = await input.repository.findSessionWithUser(input.sessionId)
  if (!session) return null

  if (session.expirationDate.getTime() <= input.now) {
    await input.repository.deleteSession(session.id)
    return null
  }

  return session.user
}

/** Invalidate the database Session backing a logout, if one exists. */
export async function logout(input: {
  repository: AuthRepository
  sessionId: string | null
}): Promise<void> {
  if (input.sessionId) {
    await input.repository.deleteSession(input.sessionId)
  }
}

export function hasAdminRole(user: SessionUser): boolean {
  return user.roles.includes('admin')
}

export type AdministrationAccess =
  | { outcome: 'anonymous'; loginPath: string }
  | { outcome: 'forbidden' }
  | { outcome: 'not-found' }
  | { outcome: 'authorized'; user: SessionUser }

/**
 * Centralized Administration authorization decision. Anonymous visitors are
 * sent to login with a validated return target; authenticated non-admins are
 * forbidden; a `:username` that does not match the Administrator is a 404.
 */
export function authorizeAdministration(input: {
  user: SessionUser | null
  returnTo: string
  requestedUsername?: string
}): AdministrationAccess {
  if (!input.user) {
    return {
      outcome: 'anonymous',
      loginPath: loginPathWithRedirect(input.returnTo),
    }
  }

  if (!hasAdminRole(input.user)) {
    return { outcome: 'forbidden' }
  }

  if (
    input.requestedUsername !== undefined &&
    input.requestedUsername !== input.user.username
  ) {
    return { outcome: 'not-found' }
  }

  return { outcome: 'authorized', user: input.user }
}
