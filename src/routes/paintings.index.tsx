import { createFileRoute } from '@tanstack/react-router'

import { GalleryView } from '#/features/gallery/gallery-view'
import { gallerySearchSchema } from '#/features/gallery/gallery'
import { getGallery } from '#/features/gallery/gallery.functions'

export const Route = createFileRoute('/paintings/')({
  validateSearch: gallerySearchSchema,
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => getGallery({ data: { q: deps.q } }),
  head: () => ({
    meta: [
      {
        title: 'Art by Vero Miller - Paintings',
      },
      {
        name: 'description',
        content:
          'Browse the complete gallery of original paintings by Vero Miller and filter them by category.',
      },
    ],
  }),
  component: Paintings,
})

function Paintings() {
  const data = Route.useLoaderData()
  return <GalleryView {...data} />
}
