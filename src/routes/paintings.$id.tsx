import { createFileRoute, notFound } from '@tanstack/react-router'

import { PaintingDetailView } from '#/features/painting-detail/painting-detail-view'
import { getPaintingDetail } from '#/features/painting-detail/painting-detail.functions'

export const Route = createFileRoute('/paintings/$id')({
  loader: async ({ params }) => {
    const painting = await getPaintingDetail({ data: params.id })

    if (!painting) throw notFound()

    return painting
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `${loaderData.title} - Art by Vero Miller`,
          },
          {
            name: 'description',
            content: `${loaderData.title} by Vero Miller. ${loaderData.priceText}.`,
          },
        ]
      : [],
  }),
  component: PaintingDetail,
})

function PaintingDetail() {
  const painting = Route.useLoaderData()
  return <PaintingDetailView {...painting} />
}
