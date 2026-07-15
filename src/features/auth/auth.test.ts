import { describe, expect, it, vi } from 'vitest'

import {
  attemptLogin,
  authorizeAdministration,
  clearedSessionCookieOptions,
  getSessionExpirationDate,
  loginPathWithRedirect,
  logout,
  resolveSessionUser,
  safeRedirect,
  sessionCookieOptions,
  signSessionId,
  unsignSessionId,
} from './auth'
import type { AuthRepository, SessionUser } from './auth'

const SECRET = 'a-test-session-secret-at-least-32-characters'
const NOW = Date.UTC(2026, 0, 1)

function createRepository(
  overrides: Partial<AuthRepository> = {},
): AuthRepository {
  return {
    findLoginCandidate: async () => null,
    createSession: async ({ userId, expirationDate }) => ({
      id: 'session-1',
      userId,
      expirationDate,
    }),
    findSessionWithUser: async () => null,
    deleteSession: async () => undefined,
    ...overrides,
  }
}

const adminUser: SessionUser = {
  id: 'user-1',
  username: 'vero',
  roles: ['admin'],
}

describe('cookie signing', () => {
  it('round-trips a signed session identifier', () => {
    const signed = signSessionId('session-1', SECRET)
    expect(signed).not.toBe('session-1')
    expect(unsignSessionId(signed, SECRET)).toBe('session-1')
  })

  it('rejects a tampered value or a wrong secret', () => {
    const signed = signSessionId('session-1', SECRET)
    expect(
      unsignSessionId(`session-2.${signed.split('.')[1]}`, SECRET),
    ).toBeNull()
    expect(
      unsignSessionId(signed, 'a-different-secret-value-32-characters!!'),
    ).toBeNull()
    expect(unsignSessionId('no-signature', SECRET)).toBeNull()
    expect(unsignSessionId(undefined, SECRET)).toBeNull()
  })
})

describe('sessionCookieOptions', () => {
  it('is HTTP-only, same-site, path-scoped, and secure in production', () => {
    const options = sessionCookieOptions({
      secure: true,
      remember: false,
      expirationDate: getSessionExpirationDate(NOW),
    })

    expect(options.httpOnly).toBe(true)
    expect(options.sameSite).toBe('lax')
    expect(options.path).toBe('/')
    expect(options.secure).toBe(true)
  })

  it('persists the cookie only when "remember me" is chosen', () => {
    const expirationDate = getSessionExpirationDate(NOW)

    const remembered = sessionCookieOptions({
      secure: false,
      remember: true,
      expirationDate,
    })
    const browserSession = sessionCookieOptions({
      secure: false,
      remember: false,
      expirationDate,
    })

    expect(remembered.expires).toEqual(expirationDate)
    expect(browserSession.expires).toBeUndefined()
  })

  it('expires the cookie immediately when cleared', () => {
    expect(clearedSessionCookieOptions(true).expires).toEqual(new Date(0))
  })
})

describe('safeRedirect', () => {
  it('keeps same-site absolute paths', () => {
    expect(safeRedirect('/administration/vero')).toBe('/administration/vero')
  })

  it('rejects unsafe or off-site targets', () => {
    expect(safeRedirect('//evil.com')).toBe('/')
    expect(safeRedirect('/\\evil.com')).toBe('/')
    expect(safeRedirect('https://evil.com')).toBe('/')
    expect(safeRedirect('relative/path')).toBe('/')
    expect(safeRedirect(undefined)).toBe('/')
    expect(safeRedirect('/dashboard', '/administration')).toBe('/dashboard')
  })

  it('builds a login path that carries a validated return target', () => {
    expect(loginPathWithRedirect('/administration/vero')).toBe(
      '/login?redirectTo=%2Fadministration%2Fvero',
    )
    expect(loginPathWithRedirect('//evil.com')).toBe('/login')
  })
})

describe('attemptLogin', () => {
  it('creates a database Session for valid credentials', async () => {
    const createSession = vi.fn(async ({ userId, expirationDate }) => ({
      id: 'session-1',
      userId,
      expirationDate,
    }))
    const verifyPassword = vi.fn(async () => true)
    const repository = createRepository({
      findLoginCandidate: async () => ({ id: 'user-1', passwordHash: 'hash' }),
      createSession,
    })

    const session = await attemptLogin({
      repository,
      verifyPassword,
      username: 'vero',
      password: 'correct horse',
      now: NOW,
    })

    expect(verifyPassword).toHaveBeenCalledWith('correct horse', 'hash')
    expect(session).toEqual({
      id: 'session-1',
      userId: 'user-1',
      expirationDate: getSessionExpirationDate(NOW),
    })
  })

  it('returns null for an unknown user without checking a password', async () => {
    const verifyPassword = vi.fn(async () => true)
    const session = await attemptLogin({
      repository: createRepository({ findLoginCandidate: async () => null }),
      verifyPassword,
      username: 'ghost',
      password: 'whatever',
      now: NOW,
    })

    expect(session).toBeNull()
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it('returns null when the password is incorrect', async () => {
    const createSession = vi.fn()
    const session = await attemptLogin({
      repository: createRepository({
        findLoginCandidate: async () => ({
          id: 'user-1',
          passwordHash: 'hash',
        }),
        createSession,
      }),
      verifyPassword: async () => false,
      username: 'vero',
      password: 'wrong',
      now: NOW,
    })

    expect(session).toBeNull()
    expect(createSession).not.toHaveBeenCalled()
  })
})

describe('resolveSessionUser', () => {
  it('returns the user for a live session', async () => {
    const user = await resolveSessionUser({
      repository: createRepository({
        findSessionWithUser: async () => ({
          id: 'session-1',
          expirationDate: new Date(NOW + 1000),
          user: adminUser,
        }),
      }),
      sessionId: 'session-1',
      now: NOW,
    })

    expect(user).toEqual(adminUser)
  })

  it('treats an expired session as anonymous and deletes it', async () => {
    const deleteSession = vi.fn(async () => undefined)
    const user = await resolveSessionUser({
      repository: createRepository({
        findSessionWithUser: async () => ({
          id: 'session-1',
          expirationDate: new Date(NOW - 1000),
          user: adminUser,
        }),
        deleteSession,
      }),
      sessionId: 'session-1',
      now: NOW,
    })

    expect(user).toBeNull()
    expect(deleteSession).toHaveBeenCalledWith('session-1')
  })

  it('returns null when there is no session id or no stored session', async () => {
    expect(
      await resolveSessionUser({
        repository: createRepository(),
        sessionId: null,
        now: NOW,
      }),
    ).toBeNull()
    expect(
      await resolveSessionUser({
        repository: createRepository({ findSessionWithUser: async () => null }),
        sessionId: 'missing',
        now: NOW,
      }),
    ).toBeNull()
  })
})

describe('logout', () => {
  it('deletes the backing database Session', async () => {
    const deleteSession = vi.fn(async () => undefined)
    await logout({
      repository: createRepository({ deleteSession }),
      sessionId: 'session-1',
    })
    expect(deleteSession).toHaveBeenCalledWith('session-1')
  })

  it('is a no-op without a session id', async () => {
    const deleteSession = vi.fn(async () => undefined)
    await logout({
      repository: createRepository({ deleteSession }),
      sessionId: null,
    })
    expect(deleteSession).not.toHaveBeenCalled()
  })
})

describe('authorizeAdministration', () => {
  it('authorizes an admin whose username matches', () => {
    expect(
      authorizeAdministration({
        user: adminUser,
        returnTo: '/administration/vero',
        requestedUsername: 'vero',
      }),
    ).toEqual({ outcome: 'authorized', user: adminUser })
  })

  it('authorizes the Administration index with no requested username', () => {
    expect(
      authorizeAdministration({ user: adminUser, returnTo: '/administration' }),
    ).toEqual({ outcome: 'authorized', user: adminUser })
  })

  it('sends anonymous visitors to login with a validated return target', () => {
    expect(
      authorizeAdministration({ user: null, returnTo: '/administration/vero' }),
    ).toEqual({
      outcome: 'anonymous',
      loginPath: '/login?redirectTo=%2Fadministration%2Fvero',
    })
  })

  it('sanitizes an unsafe return target before offering login', () => {
    expect(
      authorizeAdministration({ user: null, returnTo: '//evil.com' }),
    ).toEqual({ outcome: 'anonymous', loginPath: '/login' })
  })

  it('forbids an authenticated non-admin', () => {
    expect(
      authorizeAdministration({
        user: { id: 'user-2', username: 'guest', roles: [] },
        returnTo: '/administration/guest',
        requestedUsername: 'guest',
      }),
    ).toEqual({ outcome: 'forbidden' })
  })

  it('returns not-found when the username does not match the Administrator', () => {
    expect(
      authorizeAdministration({
        user: adminUser,
        returnTo: '/administration/someone-else',
        requestedUsername: 'someone-else',
      }),
    ).toEqual({ outcome: 'not-found' })
  })
})
