import { useState } from 'react'

import { homepageContentSchema } from './homepage-admin'
import type { AdminHomepageRecord } from './homepage-admin'

export type HomepageAdminStatus =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

type HomepageAdminViewProps = {
  username: string
  homepage: AdminHomepageRecord | null
  status: HomepageAdminStatus
  pending: boolean
  onSaveContent: (input: { title: string; text: string }) => void
  onUploadImage: (input: { file: File; altText: string }) => void
  onDescribeImage: (altText: string) => void
  onRemoveImage: () => void
}

export function HomepageAdminView({
  username,
  homepage,
  status,
  pending,
  onSaveContent,
  onUploadImage,
  onDescribeImage,
  onRemoveImage,
}: HomepageAdminViewProps) {
  const [contentError, setContentError] = useState<string | null>(null)

  if (!homepage) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl text-stone-900">Homepage</h1>
        <p className="mt-4 text-stone-600">
          No Homepage record exists yet. Seed the database to create the single
          Homepage record.
        </p>
      </main>
    )
  }

  const image = homepage.image

  function handleContentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    // Client-side check with the same Zod schema the server enforces.
    const parsed = homepageContentSchema.safeParse({
      title: String(form.get('title') ?? ''),
      text: String(form.get('text') ?? ''),
    })
    if (!parsed.success) {
      setContentError(parsed.error.issues[0]?.message ?? 'Invalid content.')
      return
    }
    setContentError(null)
    onSaveContent(parsed.data)
  }

  function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const file = form.get('image')
    if (!(file instanceof File) || file.size === 0) return
    onUploadImage({ file, altText: String(form.get('altText') ?? '') })
  }

  function handleDescribeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onDescribeImage(String(form.get('altText') ?? ''))
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-stone-900">Homepage</h1>
        <a
          href={`/administration/${username}`}
          className="text-sm text-stone-600 underline"
        >
          Back to Administration
        </a>
      </div>
      <p className="mt-2 text-sm text-stone-600">
        Edit the single public Homepage. Additional Homepage records cannot be
        created or deleted here.
      </p>

      {status.kind === 'success' ? (
        <p
          role="status"
          className="mt-6 rounded border border-green-600 bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          {status.message}
        </p>
      ) : null}
      {status.kind === 'error' ? (
        <p
          role="alert"
          className="mt-6 rounded border border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {status.message}
        </p>
      ) : null}

      <section aria-labelledby="content-heading" className="mt-10">
        <h2 id="content-heading" className="font-serif text-xl text-stone-900">
          Title & text
        </h2>
        <form className="mt-4 space-y-4" onSubmit={handleContentSubmit}>
          <div className="space-y-1">
            <label htmlFor="title" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              name="title"
              defaultValue={homepage.title}
              required
              className="w-full rounded border border-stone-400 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="text" className="block text-sm font-medium">
              Text
            </label>
            <textarea
              id="text"
              name="text"
              defaultValue={homepage.text}
              required
              rows={6}
              className="w-full rounded border border-stone-400 px-3 py-2"
            />
          </div>
          {contentError ? (
            <p role="alert" className="text-sm text-red-700">
              {contentError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Save title & text
          </button>
        </form>
      </section>

      <section aria-labelledby="image-heading" className="mt-12">
        <h2 id="image-heading" className="font-serif text-xl text-stone-900">
          Image (optional)
        </h2>

        {image ? (
          <div className="mt-4 space-y-4">
            <img
              src={`/resources/homepage-image/${image.id}`}
              alt={image.altText ?? homepage.title}
              className="w-48 rounded-sm object-cover shadow-sm"
            />
            <form className="space-y-2" onSubmit={handleDescribeSubmit}>
              <label
                htmlFor="describe-altText"
                className="block text-sm font-medium"
              >
                Alt text
              </label>
              <input
                id="describe-altText"
                name="altText"
                defaultValue={image.altText ?? ''}
                className="w-full rounded border border-stone-400 px-3 py-2"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded border border-stone-400 px-3 py-1.5 text-sm disabled:opacity-60"
              >
                Save alt text
              </button>
            </form>
            <button
              type="button"
              onClick={onRemoveImage}
              disabled={pending}
              className="rounded border border-red-500 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60"
            >
              Remove image
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            No image is set. The Homepage renders text-only.
          </p>
        )}

        <form className="mt-6 space-y-2" onSubmit={handleUploadSubmit}>
          <label htmlFor="image" className="block text-sm font-medium">
            {image ? 'Replace image' : 'Add image'}
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block text-sm"
          />
          <label htmlFor="upload-altText" className="block text-sm font-medium">
            Alt text (optional)
          </label>
          <input
            id="upload-altText"
            name="altText"
            className="w-full rounded border border-stone-400 px-3 py-2"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {image ? 'Replace image' : 'Upload image'}
          </button>
        </form>
      </section>
    </main>
  )
}
