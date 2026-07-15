import { createFileRoute } from '@tanstack/react-router'

import { requireAdministratorFn } from '#/features/auth/auth.functions'

export const Route = createFileRoute('/administration/$username')({
  beforeLoad: async ({ location, params }) => {
    const user = await requireAdministratorFn({
      data: { returnTo: location.href, requestedUsername: params.username },
    })

    return { user }
  },
  loader: ({ context }) => ({ username: context.user.username }),
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Administration' }],
  }),
  component: AdministrationHome,
})

function AdministrationHome() {
  const { username } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-stone-900">Administration</h1>
        <form method="post" action="/logout">
          <button
            type="submit"
            className="rounded border border-stone-400 px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </form>
      </div>

      <p className="mt-4 text-stone-600">
        Signed in as <span className="font-medium">{username}</span>. Paintings,
        Categories, and Homepage management will appear here.
      </p>
    </main>
  )
}
