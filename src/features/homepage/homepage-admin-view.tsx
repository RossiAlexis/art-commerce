import { useEffect, useRef, useState } from 'react'

import { homepageContentSchema } from './homepage-admin'
import type {
  AdminHomepageRecord,
  HomepageImageRole,
  StoredHomepageImage,
} from './homepage-admin'

export type HomepageAdminStatus =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

type UploadImageInput = {
  role: HomepageImageRole
  file: File
  altText: string
}

type DescribeImageInput = {
  role: HomepageImageRole
  altText: string
}

/** What a slot mutation reports. `void` counts as success so callers can ignore it. */
type HomepageSlotMutation = { ok: boolean; error?: string } | null | void

type HomepageAdminViewProps = {
  username: string
  homepage: AdminHomepageRecord | null
  status: HomepageAdminStatus
  pending: boolean
  onSaveContent: (input: { title: string; text: string }) => void
  onUploadImage: (
    input: UploadImageInput,
  ) => HomepageSlotMutation | Promise<HomepageSlotMutation>
  onDescribeImage: (input: DescribeImageInput) => void
  onRemoveImage: (
    role: HomepageImageRole,
  ) => HomepageSlotMutation | Promise<HomepageSlotMutation>
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

      <HomepageImageSlot
        role="hero"
        heading="Hero"
        description="Full-width banner at the top of the homepage."
        emptyMessage="No hero image is set. The homepage shows no banner."
        title={homepage.title}
        image={homepage.hero}
        pending={pending}
        onUploadImage={onUploadImage}
        onDescribeImage={onDescribeImage}
        onRemoveImage={onRemoveImage}
      />
      <HomepageImageSlot
        role="intro"
        heading="Intro image"
        description="Optional image beside the title and text."
        emptyMessage="No intro image is set. The homepage renders text-only."
        title={homepage.title}
        image={homepage.image}
        pending={pending}
        onUploadImage={onUploadImage}
        onDescribeImage={onDescribeImage}
        onRemoveImage={onRemoveImage}
      />
    </main>
  )
}

type HomepageImageSlotProps = {
  role: HomepageImageRole
  heading: string
  description: string
  emptyMessage: string
  title: string
  image: StoredHomepageImage | null
  pending: boolean
  onUploadImage: HomepageAdminViewProps['onUploadImage']
  onDescribeImage: HomepageAdminViewProps['onDescribeImage']
  onRemoveImage: HomepageAdminViewProps['onRemoveImage']
}

function HomepageImageSlot({
  role,
  heading,
  description,
  emptyMessage,
  title,
  image,
  pending,
  onUploadImage,
  onDescribeImage,
  onRemoveImage,
}: HomepageImageSlotProps) {
  const headingId = `${role}-heading`
  const fileInputId = `${role}-image`
  const uploadAltId = `${role}-upload-alt`
  const describeAltId = `${role}-describe-alt`
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chosenFileRef = useRef<File | null>(null)
  const { previewUrl, showFile, clearPreview } = usePendingImagePreview()

  async function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const file = fileToUpload(data.get('image'), chosenFileRef.current)
    if (!file) return
    // Snapshot the preview this submit is for. A newer choice must stay put.
    const shownUrl = previewUrl
    const saved = await mutationSucceeded(
      onUploadImage({
        role,
        file,
        altText: String(data.get('altText') ?? ''),
      }),
    )
    if (!saved) return
    if (clearPreview(shownUrl))
      forgetChosenFile(chosenFileRef, fileInputRef.current)
  }

  function handleDescribeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onDescribeImage({ role, altText: String(form.get('altText') ?? '') })
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    chosenFileRef.current = file && file.size > 0 ? file : null
    showFile(chosenFileRef.current)
  }

  async function handleRemove() {
    const removed = await mutationSucceeded(onRemoveImage(role))
    if (!removed) return
    clearPreview()
    forgetChosenFile(chosenFileRef, fileInputRef.current)
  }

  const miniatureSrc =
    previewUrl ?? (image ? `/resources/homepage-image/${image.id}` : null)
  const miniatureAlt = image?.altText ?? (previewUrl ? 'Selected image' : title)

  return (
    <section aria-labelledby={headingId} className="mt-12">
      <h2 id={headingId} className="font-serif text-xl text-stone-900">
        {heading}
      </h2>
      <p className="mt-2 text-sm text-stone-600">{description}</p>

      {miniatureSrc ? (
        <DesktopPreview role={role} src={miniatureSrc} alt={miniatureAlt} />
      ) : (
        <p className="mt-4 text-sm text-stone-600">{emptyMessage}</p>
      )}

      {image ? (
        <div className="mt-4 space-y-4">
          <form className="space-y-2" onSubmit={handleDescribeSubmit}>
            <label
              htmlFor={describeAltId}
              className="block text-sm font-medium"
            >
              Alt text
            </label>
            <input
              id={describeAltId}
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
            onClick={() => {
              void handleRemove()
            }}
            disabled={pending}
            className="rounded border border-red-500 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60"
          >
            Remove image
          </button>
        </div>
      ) : null}

      <form className="mt-6 space-y-2" onSubmit={handleUploadSubmit}>
        <label htmlFor={fileInputId} className="block text-sm font-medium">
          {image ? 'Replace image' : 'Add image'}
        </label>
        <input
          ref={fileInputRef}
          id={fileInputId}
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="block text-sm"
          onChange={handleFileChange}
        />
        <label htmlFor={uploadAltId} className="block text-sm font-medium">
          Alt text (optional)
        </label>
        <input
          id={uploadAltId}
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
  )
}

function DesktopPreview({
  role,
  src,
  alt,
}: {
  role: HomepageImageRole
  src: string
  alt: string
}) {
  return (
    <figure className="mt-4">
      {role === 'hero' ? (
        <div className="relative aspect-1440/580 w-full overflow-hidden">
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-64 rounded-sm object-cover shadow-sm"
        />
      )}
      <figcaption className="mt-2 text-sm text-stone-600">
        Desktop preview
      </figcaption>
    </figure>
  )
}

/**
 * Show a file in the desktop frame as soon as it is chosen. The object URL is
 * revoked when the choice changes, when that slot's upload or remove succeeds,
 * and when the editor unmounts.
 */
function usePendingImagePreview() {
  const previewUrlRef = useRef<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      revokePreview(previewUrlRef)
    }
  }, [])

  function showFile(file: File | null) {
    revokePreview(previewUrlRef)
    if (!file || file.size === 0) {
      setPreviewUrl(null)
      return
    }
    const nextUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextUrl
    setPreviewUrl(nextUrl)
  }

  /** Drop the preview. Pass the url from submit time to ignore a newer choice. */
  function clearPreview(expectedUrl?: string | null) {
    if (expectedUrl !== undefined && previewUrlRef.current !== expectedUrl) {
      return false
    }
    revokePreview(previewUrlRef)
    setPreviewUrl(null)
    return true
  }

  return { previewUrl, showFile, clearPreview }
}

function revokePreview(previewUrlRef: React.RefObject<string | null>) {
  if (!previewUrlRef.current) return
  URL.revokeObjectURL(previewUrlRef.current)
  previewUrlRef.current = null
}

function resetFileInput(input: HTMLInputElement | null) {
  if (input) input.value = ''
}

/** Prefer the file in the form. Otherwise use the file shown in the preview. */
function fileToUpload(
  formValue: FormDataEntryValue | null,
  chosen: File | null,
) {
  if (formValue instanceof File && formValue.size > 0) return formValue
  return chosen && chosen.size > 0 ? chosen : null
}

function forgetChosenFile(
  chosenFileRef: React.RefObject<File | null>,
  input: HTMLInputElement | null,
) {
  chosenFileRef.current = null
  resetFileInput(input)
}

/** True unless the mutation reported failure. A thrown request is a failure. */
async function mutationSucceeded(
  result: HomepageSlotMutation | Promise<HomepageSlotMutation>,
) {
  try {
    const settled = await result
    return !(settled && settled.ok === false)
  } catch {
    return false
  }
}
