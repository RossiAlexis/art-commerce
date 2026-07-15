import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { safeRedirect } from '#/features/auth/auth'
import { DEFAULT_LOGIN_REDIRECT, logInFn } from '#/features/auth/auth.functions'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirectTo: z.string().optional(),
  }),
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Sign in' }],
  }),
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { redirectTo } = Route.useSearch()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const result = await logInFn({
      data: {
        username: String(form.get('username') ?? ''),
        password: String(form.get('password') ?? ''),
        remember: form.get('remember') === 'on',
        redirectTo: safeRedirect(redirectTo, DEFAULT_LOGIN_REDIRECT),
      },
    })

    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }

    await router.navigate({ href: result.redirectTo })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-3xl text-stone-900">Sign in</h1>
      <p className="mt-2 text-sm text-stone-600">
        Administration access for Art by Vero Miller.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="w-full rounded border border-stone-400 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded border border-stone-400 px-3 py-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input id="remember" name="remember" type="checkbox" />
          Remember me
        </label>

        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-stone-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
