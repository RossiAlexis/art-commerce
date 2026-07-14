import { createFileRoute } from '@tanstack/react-router'

import { HomepageView } from '#/features/homepage/homepage-view'
import { getHomepage } from '#/features/homepage/homepage.functions'

export const Route = createFileRoute('/')({
  loader: () => getHomepage(),
  head: () => ({
    meta: [
      {
        title: 'Art by Vero Miller - ¡Hola!',
      },
      {
        name: 'description',
        content:
          'Discover original paintings by Vero Miller and explore her art portfolio.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  const data = Route.useLoaderData()
  return <HomepageView {...data} />
}
