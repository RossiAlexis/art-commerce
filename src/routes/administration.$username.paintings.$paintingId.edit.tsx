import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { PaintingEditorView } from '#/features/paintings-admin/paintings-editor-view'
import type {
  ImageCallbacks,
  PaintingEditorStatus,
} from '#/features/paintings-admin/paintings-editor-view'
import type { PaintingFieldErrors } from '#/features/paintings-admin/paintings-editor'
import {
  addPaintingImageFn,
  describePaintingImageFn,
  getPaintingForEditFn,
  removePaintingImageFn,
  reorderPaintingImagesFn,
  replacePaintingImageFn,
  updatePaintingFn,
} from '#/features/paintings-admin/paintings-editor.functions'

export const Route = createFileRoute(
  '/administration/$username/paintings/$paintingId/edit',
)({
  loader: ({ params }) =>
    getPaintingForEditFn({
      data: { username: params.username, paintingId: params.paintingId },
    }),
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Edit Painting' }],
  }),
  component: EditPainting,
})

function EditPainting() {
  const { username, painting, categories } = Route.useLoaderData()
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
      result = await updatePaintingFn({
        data: {
          username,
          paintingId: painting.id,
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

    await router.invalidate()
    setStatus({ kind: 'success', message: 'Painting details saved.' })
    setPending(false)
  }

  // Each image operation is its own request; on success we reload the editor so
  // previews, order, and identifiers reflect the persisted state.
  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    setPending(true)
    setStatus({ kind: 'idle' })
    let result
    try {
      result = await action()
    } catch {
      setStatus({
        kind: 'error',
        message: 'The image change could not be saved.',
      })
      setPending(false)
      return
    }
    if (!result.ok) {
      setStatus({
        kind: 'error',
        message: result.error ?? 'The image change failed.',
      })
      setPending(false)
      return
    }
    await router.invalidate()
    setStatus({ kind: 'success', message: success })
    setPending(false)
  }

  const imageCallbacks: ImageCallbacks = {
    onAddImage({ file, altText }) {
      const body = new FormData()
      body.set('username', username)
      body.set('paintingId', painting.id)
      body.set('image', file)
      body.set('altText', altText)
      void run(() => addPaintingImageFn({ data: body }), 'Image added.')
    },
    onReplaceImage({ imageId, file }) {
      const body = new FormData()
      body.set('username', username)
      body.set('imageId', imageId)
      body.set('image', file)
      void run(() => replacePaintingImageFn({ data: body }), 'Image replaced.')
    },
    onDescribeImage({ imageId, altText }) {
      void run(
        () => describePaintingImageFn({ data: { username, imageId, altText } }),
        'Alt text saved.',
      )
    },
    onRemoveImage(imageId) {
      void run(
        () => removePaintingImageFn({ data: { username, imageId } }),
        'Image removed.',
      )
    },
    onMoveImage({ imageId, direction }) {
      const ids = painting.images.map((image) => image.id)
      const index = ids.indexOf(imageId)
      const target = direction === 'up' ? index - 1 : index + 1
      if (index === -1 || target < 0 || target >= ids.length) return
      ;[ids[index], ids[target]] = [ids[target], ids[index]]
      void run(
        () =>
          reorderPaintingImagesFn({
            data: { username, paintingId: painting.id, orderedImageIds: ids },
          }),
        'Image order updated.',
      )
    },
  }

  return (
    <PaintingEditorView
      mode="edit"
      username={username}
      painting={painting}
      categories={categories}
      fieldErrors={errors}
      status={status}
      pending={pending}
      onSaveFields={onSaveFields}
      imageCallbacks={imageCallbacks}
    />
  )
}
