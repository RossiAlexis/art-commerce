import { Outlet, createFileRoute } from '@tanstack/react-router'

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
  component: AdministrationLayout,
})

function AdministrationLayout() {
  const { username } = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a
          href={`/administration/${username}`}
          className="font-serif text-lg text-stone-700"
        >
          Administration
        </a>
        <form method="post" action="/logout">
          <button
            type="submit"
            className="rounded border border-stone-400 px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-10">
        <Outlet />
      </div>
    </div>
  )
}
