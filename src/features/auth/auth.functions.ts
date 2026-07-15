import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { safeRedirect } from './auth'

/** Default Administration entry a successful login returns to. */
export const DEFAULT_LOGIN_REDIRECT = '/administration'

const loginInput = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  remember: z.boolean().default(false),
  redirectTo: z.string().default(DEFAULT_LOGIN_REDIRECT),
})

// The server-only session wiring is pulled in with a dynamic import so the
// denied `@tanstack/react-start/server` specifier never enters the client
// bundle; only these server-fn handlers ever evaluate it.

/**
 * Server function backing the `/login` form. On success it sets the signed
 * cookie and reports the validated return target; otherwise it reports a
 * generic failure that does not disclose which field was wrong.
 */
export const logInFn = createServerFn({ method: 'POST' })
  .validator(loginInput)
  .handler(async ({ data }) => {
    const { logIn } = await import('./auth.session')

    const succeeded = await logIn({
      username: data.username,
      password: data.password,
      remember: data.remember,
    })

    if (!succeeded) {
      return { ok: false as const, error: 'Invalid username or password.' }
    }

    return {
      ok: true as const,
      redirectTo: safeRedirect(data.redirectTo, DEFAULT_LOGIN_REDIRECT),
    }
  })

/** Server function that invalidates the Session and destroys the cookie. */
export const logOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const { logOut } = await import('./auth.session')
  await logOut()
})

/** Server function invoked from `beforeLoad` to enforce the Administration guard. */
export const requireAdministratorFn = createServerFn({ method: 'GET' })
  .validator((input: { returnTo: string; requestedUsername?: string }) => input)
  .handler(async ({ data }) => {
    const { requireAdministrator } = await import('./auth.session')
    return requireAdministrator(data)
  })
