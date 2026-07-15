import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { PaintingEditorView } from '#/features/paintings-admin/paintings-editor-view'
import type { PaintingEditorStatus } from '#/features/paintings-admin/paintings-editor-view'
import type { PaintingFieldErrors } from '#/features/paintings-admin/paintings-editor'
import {
  createPaintingFn,
  newPaintingContextFn,
} from '#/features/paintings-admin/paintings-editor.functions'

export const Route = createFileRoute('/administration/$username/paintings/new')(
  {
    loader: ({ params }) =>
      newPaintingContextFn({ data: { username: params.username } }),
    head: () => ({
      meta: [{ title: 'Art by Vero Miller - New Painting' }],
    }),
    component: NewPainting,
  },
)

function NewPainting() {
  const { username, categories } = Route.useLoaderData()
  const router = useRouter()
  const [errors, setErrors] = useState<PaintingFieldErrors>({})
  const [status, setStatus] = useState<PaintingEditorStatus>({ kind: 'idle' })
  const [pending, setPending] = useState(false)

  async function onSaveFields(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setErrors({})
    setStatus({ kind: 'idle' })

    const form = new FormData(event.currentTarget)
    let result
    try {
      result = await createPaintingFn({
        data: {
          username,
          title: String(form.get('title') ?? ''),
          price: String(form.get('price') ?? ''),
          measures: String(form.get('measures') ?? ''),
          categoryId: String(form.get('categoryId') ?? ''),
          content: String(form.get('content') ?? ''),
        },
      })
    } catch {
      setStatus({ kind: 'error', message: 'The Painting could not be saved.' })
      setPending(false)
      return
    }

    if (!result.ok) {
      setErrors(result.errors)
      setPending(false)
      return
    }

    // Images are managed on the edit page, which needs the new Painting id.
    await router.navigate({
      to: '/administration/$username/paintings/$paintingId/edit',
      params: { username, paintingId: result.id },
    })
  }

  return (
    <PaintingEditorView
      mode="create"
      username={username}
      painting={null}
      categories={categories}
      fieldErrors={errors}
      status={status}
      pending={pending}
      onSaveFields={onSaveFields}
    />
  )
}
