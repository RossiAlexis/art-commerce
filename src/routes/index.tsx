import { createFileRoute } from '@tanstack/react-router'

import { getHomepage } from '#/features/homepage/homepage.functions'
import { HomepageView } from '#/features/homepage/homepage-view'

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
  const { homepage, paintings } = Route.useLoaderData()

  return (
    <>
      {homepage?.hero ? (
        <img
          src={`/resources/homepage-image/${homepage.hero.id}`}
          alt={homepage.hero.altText ?? homepage.title}
          className="block aspect-1440/580 max-h-[580px] min-h-[220px] w-full object-cover object-center"
          width={1440}
          height={580}
        />
      ) : null}
      <HomepageView homepage={homepage} paintings={paintings} />
    </>
  )
}
