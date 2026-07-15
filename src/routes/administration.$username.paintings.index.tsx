import { createFileRoute } from '@tanstack/react-router'

import { PaintingListView } from '#/features/paintings-admin/paintings-admin-view'
import { listPaintingsFn } from '#/features/paintings-admin/paintings-admin.functions'

export const Route = createFileRoute('/administration/$username/paintings/')({
  loader: ({ params }) =>
    listPaintingsFn({ data: { username: params.username } }),
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Paintings' }],
  }),
  component: PaintingsIndex,
})

function PaintingsIndex() {
  const { username, paintings } = Route.useLoaderData()
  return <PaintingListView username={username} paintings={paintings} />
}
