import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'
import { notFound, redirect } from '@tanstack/react-router'
import bcrypt from 'bcryptjs'

import { getPrisma } from '#/server/db'
import { getServerEnv } from '#/server/env'

import {
  SESSION_COOKIE_NAME,
  attemptLogin,
  authorizeAdministration,
  clearedSessionCookieOptions,
  logout as logoutSession,
  resolveSessionUser,
  sessionCookieOptions,
  signSessionId,
  unsignSessionId,
} from './auth'
import type { AuthRepository, DatabaseSession, SessionUser } from './auth'

// Server-only cookie/session/database wiring. This module statically imports
// `@tanstack/react-start/server`, so it must never enter the client bundle: it
// is reached exclusively through dynamic imports inside server-fn handlers.

const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash)

function createPrismaAuthRepository(): AuthRepository {
  const prisma = getPrisma()

  return {
    async findLoginCandidate(username) {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, password: { select: { hash: true } } },
      })

      if (!user) return null
      return { id: user.id, passwordHash: user.password?.hash ?? null }
    },

    createSession({ userId, expirationDate }) {
      return prisma.session.create({
        data: { userId, expirationDate },
        select: { id: true, userId: true, expirationDate: true },
      })
    },

    async findSessionWithUser(sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          expirationDate: true,
          user: {
            select: {
              id: true,
              username: true,
              roles: { select: { name: true } },
            },
          },
        },
      })

      if (!session) return null

      return {
        id: session.id,
        expirationDate: session.expirationDate,
        user: {
          id: session.user.id,
          username: session.user.username,
          roles: session.user.roles.map((role) => role.name),
        },
      }
    },

    async deleteSession(sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } })
    },
  }
}

function isSecure() {
  return getServerEnv().NODE_ENV === 'production'
}

function readSessionId(): string | null {
  return unsignSessionId(
    getCookie(SESSION_COOKIE_NAME),
    getServerEnv().SESSION_SECRET,
  )
}

function startSessionCookie(session: DatabaseSession, remember: boolean) {
  setCookie(
    SESSION_COOKIE_NAME,
    signSessionId(session.id, getServerEnv().SESSION_SECRET),
    sessionCookieOptions({
      secure: isSecure(),
      remember,
      expirationDate: session.expirationDate,
    }),
  )
}

/** Resolve the currently authenticated user, or `null` for anonymous requests. */
export function getCurrentUser(): Promise<SessionUser | null> {
  return resolveSessionUser({
    repository: createPrismaAuthRepository(),
    sessionId: readSessionId(),
    now: Date.now(),
  })
}

/** Verify credentials and, on success, create a Session and set its cookie. */
export async function logIn(input: {
  username: string
  password: string
  remember: boolean
}): Promise<boolean> {
  const session = await attemptLogin({
    repository: createPrismaAuthRepository(),
    verifyPassword,
    username: input.username,
    password: input.password,
    now: Date.now(),
  })

  if (!session) return false

  startSessionCookie(session, input.remember)
  return true
}

/** Invalidate the database Session and destroy the authentication cookie. */
export async function logOut(): Promise<void> {
  await logoutSession({
    repository: createPrismaAuthRepository(),
    sessionId: readSessionId(),
  })

  deleteCookie(SESSION_COOKIE_NAME, clearedSessionCookieOptions(isSecure()))
}

/**
 * Centralized Administration guard for every loader and server mutation. It
 * requires an authenticated Administrator with the `admin` role; anonymous
 * visitors are redirected to login, non-admins are denied, and a `:username`
 * mismatch is a 404.
 */
export async function requireAdministrator(input: {
  returnTo: string
  requestedUsername?: string
}): Promise<SessionUser> {
  const user = await getCurrentUser()
  const access = authorizeAdministration({
    user,
    returnTo: input.returnTo,
    requestedUsername: input.requestedUsername,
  })

  switch (access.outcome) {
    case 'authorized':
      return access.user
    case 'anonymous':
      throw redirect({ href: access.loginPath })
    case 'not-found':
      throw notFound()
    case 'forbidden':
      throw new Response('Forbidden', { status: 403 })
  }
}
