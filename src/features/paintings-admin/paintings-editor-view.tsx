import type {
  CategoryOption,
  EditablePainting,
  EditablePaintingImage,
  PaintingFieldErrors,
} from './paintings-editor'

export type PaintingEditorStatus =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

type PaintingFieldValues = {
  title: string
  price: string
  measures: string
  categoryId: string | null
  content: string
}

type PaintingFieldsFormProps = {
  mode: 'create' | 'edit'
  username: string
  categories: Array<CategoryOption>
  defaultValues: PaintingFieldValues
  errors?: PaintingFieldErrors
  pending?: boolean
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}

/** The five managed Painting fields, shared by the create and edit routes. */
export function PaintingFieldsForm({
  mode,
  username,
  categories,
  defaultValues,
  errors,
  pending,
  onSubmit,
}: PaintingFieldsFormProps) {
  const submitLabel = mode === 'create' ? 'Create painting' : 'Save changes'

  return (
    <form className="mt-8 max-w-lg space-y-6" onSubmit={onSubmit}>
      <Field id="title" label="Title" error={errors?.title}>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues.title}
          aria-invalid={errors?.title ? true : undefined}
          className="w-full rounded border border-stone-400 px-3 py-2"
        />
      </Field>

      <Field id="price" label="Price" error={errors?.price}>
        <input
          id="price"
          name="price"
          required
          defaultValue={defaultValues.price}
          aria-invalid={errors?.price ? true : undefined}
          className="w-full rounded border border-stone-400 px-3 py-2"
        />
        <p className="text-xs text-stone-500">
          Free-form text, e.g. “CAD 1,200”.
        </p>
      </Field>

      <Field id="measures" label="Measurements" error={errors?.measures}>
        <input
          id="measures"
          name="measures"
          required
          defaultValue={defaultValues.measures}
          aria-invalid={errors?.measures ? true : undefined}
          className="w-full rounded border border-stone-400 px-3 py-2"
        />
      </Field>

      <Field id="categoryId" label="Category" error={errors?.categoryId}>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={defaultValues.categoryId ?? ''}
          aria-invalid={errors?.categoryId ? true : undefined}
          className="w-full rounded border border-stone-400 px-3 py-2"
        >
          <option value="" disabled>
            Select a category…
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field id="content" label="Description" error={errors?.content}>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          defaultValue={defaultValues.content}
          aria-invalid={errors?.content ? true : undefined}
          className="w-full rounded border border-stone-400 px-3 py-2"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-stone-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <a
          href={`/administration/${username}/paintings`}
          className="text-sm text-stone-600 underline"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function StatusBanner({ status }: { status: PaintingEditorStatus }) {
  if (status.kind === 'success') {
    return (
      <p
        role="status"
        className="mt-6 rounded border border-green-600 bg-green-50 px-3 py-2 text-sm text-green-800"
      >
        {status.message}
      </p>
    )
  }
  if (status.kind === 'error') {
    return (
      <p
        role="alert"
        className="mt-6 rounded border border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {status.message}
      </p>
    )
  }
  return null
}

export type ImageCallbacks = {
  onAddImage: (input: { file: File; altText: string }) => void
  onReplaceImage: (input: { imageId: string; file: File }) => void
  onDescribeImage: (input: { imageId: string; altText: string }) => void
  onRemoveImage: (imageId: string) => void
  onMoveImage: (input: { imageId: string; direction: 'up' | 'down' }) => void
}

type PaintingImageManagerProps = ImageCallbacks & {
  images: Array<EditablePaintingImage>
  pending?: boolean
}

/** Add/preview/describe/order/replace/remove images within the upload contract. */
export function PaintingImageManager({
  images,
  pending,
  onAddImage,
  onReplaceImage,
  onDescribeImage,
  onRemoveImage,
  onMoveImage,
}: PaintingImageManagerProps) {
  return (
    <section aria-labelledby="images-heading" className="mt-12">
      <h2 id="images-heading" className="font-serif text-xl text-stone-900">
        Images{' '}
        <span className="text-sm font-normal text-stone-500">
          ({images.length})
        </span>
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Upload one image at a time. Each must be a JPEG, PNG, or WebP under 4
        MB.
      </p>

      {images.length > 0 ? (
        <ul className="mt-6 space-y-8">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="rounded border border-stone-200 p-4 sm:flex sm:gap-6"
            >
              <img
                src={`/resources/note-images/${image.id}`}
                alt={image.altText ?? 'Painting image'}
                className="h-40 w-40 shrink-0 rounded object-cover"
              />
              <div className="mt-4 flex-1 space-y-4 sm:mt-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pending || index === 0}
                    onClick={() =>
                      onMoveImage({ imageId: image.id, direction: 'up' })
                    }
                    className="rounded border border-stone-400 px-2 py-1 text-xs disabled:opacity-40"
                    aria-label="Move image earlier"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={pending || index === images.length - 1}
                    onClick={() =>
                      onMoveImage({ imageId: image.id, direction: 'down' })
                    }
                    className="rounded border border-stone-400 px-2 py-1 text-xs disabled:opacity-40"
                    aria-label="Move image later"
                  >
                    ↓
                  </button>
                  <span className="text-xs text-stone-500">
                    Position {index + 1}
                  </span>
                </div>

                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const form = new FormData(event.currentTarget)
                    onDescribeImage({
                      imageId: image.id,
                      altText: String(form.get('altText') ?? ''),
                    })
                  }}
                >
                  <label
                    htmlFor={`altText-${image.id}`}
                    className="block text-sm font-medium"
                  >
                    Alt text
                  </label>
                  <input
                    id={`altText-${image.id}`}
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

                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const form = new FormData(event.currentTarget)
                    const file = form.get('image')
                    if (!(file instanceof File) || file.size === 0) return
                    onReplaceImage({ imageId: image.id, file })
                  }}
                >
                  <label
                    htmlFor={`replace-${image.id}`}
                    className="block text-sm font-medium"
                  >
                    Replace image
                  </label>
                  <input
                    id={`replace-${image.id}`}
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="block text-sm"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded border border-stone-400 px-3 py-1.5 text-sm disabled:opacity-60"
                  >
                    Replace
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => onRemoveImage(image.id)}
                  disabled={pending}
                  className="rounded border border-red-500 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60"
                >
                  Remove image
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-600">
          No images yet. This Painting is manageable here but stays off the
          public Homepage and gallery until it has at least one image.
        </p>
      )}

      <form
        className="mt-8 space-y-2 border-t border-stone-200 pt-6"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const file = form.get('image')
          if (!(file instanceof File) || file.size === 0) return
          onAddImage({ file, altText: String(form.get('altText') ?? '') })
          event.currentTarget.reset()
        }}
      >
        <label htmlFor="add-image" className="block text-sm font-medium">
          Add image
        </label>
        <input
          id="add-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="block text-sm"
        />
        <label htmlFor="add-altText" className="block text-sm font-medium">
          Alt text (optional)
        </label>
        <input
          id="add-altText"
          name="altText"
          className="w-full rounded border border-stone-400 px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          Upload image
        </button>
      </form>
    </section>
  )
}

type PaintingEditorViewProps = {
  mode: 'create' | 'edit'
  username: string
  painting: EditablePainting | null
  categories: Array<CategoryOption>
  fieldErrors?: PaintingFieldErrors
  status: PaintingEditorStatus
  pending?: boolean
  onSaveFields?: (event: React.FormEvent<HTMLFormElement>) => void
  imageCallbacks?: ImageCallbacks
}

/** Full editor page: managed fields plus, when editing, the image manager. */
export function PaintingEditorView({
  mode,
  username,
  painting,
  categories,
  fieldErrors,
  status,
  pending,
  onSaveFields,
  imageCallbacks,
}: PaintingEditorViewProps) {
  const defaultValues: PaintingFieldValues = {
    title: painting?.title ?? '',
    price: painting?.price ?? '',
    measures: painting?.measures ?? '',
    categoryId: painting?.categoryId ?? null,
    content: painting?.content ?? '',
  }

  return (
    <section>
      <a
        href={`/administration/${username}/paintings`}
        className="text-sm text-stone-600 underline"
      >
        Back to Paintings
      </a>
      <h1 className="mt-4 font-serif text-3xl text-stone-900">
        {mode === 'create' ? 'New painting' : `Edit ${painting?.title ?? ''}`}
      </h1>

      <StatusBanner status={status} />

      <PaintingFieldsForm
        mode={mode}
        username={username}
        categories={categories}
        defaultValues={defaultValues}
        errors={fieldErrors}
        pending={pending}
        onSubmit={onSaveFields}
      />

      {mode === 'edit' && painting && imageCallbacks ? (
        <PaintingImageManager
          images={painting.images}
          pending={pending}
          {...imageCallbacks}
        />
      ) : null}
    </section>
  )
}
