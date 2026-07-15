import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/administration/$username/')({
  loader: ({ context }) => ({ username: context.user.username }),
  component: AdministrationHome,
})

function AdministrationHome() {
  const { username } = Route.useLoaderData()

  return (
    <section>
      <h1 className="font-serif text-3xl text-stone-900">Administration</h1>
      <p className="mt-4 text-stone-600">
        Signed in as <span className="font-medium">{username}</span>.
      </p>

      <ul className="mt-8 space-y-3">
        <li>
          <a
            href={`/administration/${username}/categories`}
            className="text-stone-900 underline"
          >
            Manage Categories
          </a>
          <p className="text-sm text-stone-600">
            Create, edit, and delete the Categories that drive public navigation
            and Painting filters.
          </p>
        </li>
      </ul>

      <p className="mt-8 text-sm text-stone-500">
        Painting and Homepage management will appear here.
      </p>
    </section>
  )
}
