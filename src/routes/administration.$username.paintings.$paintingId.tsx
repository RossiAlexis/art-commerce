import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { PaintingDetailView } from '#/features/paintings-admin/paintings-admin-view'
import {
  deletePaintingFn,
  getPaintingFn,
} from '#/features/paintings-admin/paintings-admin.functions'

export const Route = createFileRoute(
  '/administration/$username/paintings/$paintingId',
)({
  loader: ({ params }) =>
    getPaintingFn({
      data: { username: params.username, paintingId: params.paintingId },
    }),
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Painting' }],
  }),
  component: PaintingDetail,
})

function PaintingDetail() {
  const { username, painting } = Route.useLoaderData()
  const router = useRouter()
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function onDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDeletePending(true)
    setDeleteError(null)

    try {
      await deletePaintingFn({
        data: { username, paintingId: painting.id },
      })
    } catch {
      setDeleteError('The Painting could not be deleted. Please try again.')
      setDeletePending(false)
      return
    }

    await router.invalidate()
    await router.navigate({
      to: '/administration/$username/paintings',
      params: { username },
    })
  }

  return (
    <PaintingDetailView
      username={username}
      painting={painting}
      deletePending={deletePending}
      deleteError={deleteError}
      onDelete={onDelete}
    />
  )
}
