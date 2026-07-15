import type {
  ManagedPaintingDetail,
  ManagedPaintingSummary,
} from './paintings-admin'

type PaintingListViewProps = {
  username: string
  paintings: Array<ManagedPaintingSummary>
}

export function PaintingListView({
  username,
  paintings,
}: PaintingListViewProps) {
  const base = `/administration/${username}/paintings`

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-stone-900">Paintings</h1>
        <a
          href={`${base}/new`}
          className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white"
        >
          New painting
        </a>
      </div>
      <p className="mt-2 text-sm text-stone-600">
        Create a Painting, inspect one and its images, or delete a work from the
        portfolio.
      </p>

      {paintings.length > 0 ? (
        <ul className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
          {paintings.map((painting) => (
            <li key={painting.id}>
              <a
                href={`${base}/${painting.id}`}
                className="flex items-center justify-between gap-4 px-1 py-4 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#688329]"
              >
                <span className="font-medium text-stone-900">
                  {painting.title}
                </span>
                <span className="shrink-0 text-sm text-stone-500">
                  {painting.imageCount}{' '}
                  {painting.imageCount === 1 ? 'image' : 'images'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-600">
          No Paintings yet.
        </p>
      )}
    </section>
  )
}

type PaintingDetailViewProps = {
  username: string
  painting: ManagedPaintingDetail
  deletePending?: boolean
  deleteError?: string | null
  onDelete?: (event: React.FormEvent<HTMLFormElement>) => void
}

export function PaintingDetailView({
  username,
  painting,
  deletePending,
  deleteError,
  onDelete,
}: PaintingDetailViewProps) {
  return (
    <section>
      <a
        href={`/administration/${username}/paintings`}
        className="text-sm text-stone-600 underline"
      >
        Back to Paintings
      </a>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-stone-900">{painting.title}</h1>
        <a
          href={`/administration/${username}/paintings/${painting.id}/edit`}
          className="shrink-0 rounded bg-stone-900 px-3 py-1.5 text-sm text-white"
        >
          Edit painting
        </a>
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-stone-500">Price</dt>
          <dd className="text-stone-900">{painting.price}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500">Measurements</dt>
          <dd className="text-stone-900">
            {painting.measures ?? 'Not recorded'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500">Category</dt>
          <dd className="text-stone-900">
            {painting.categoryName ?? 'Uncategorized'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500">Description</dt>
          <dd className="whitespace-pre-line text-stone-900">
            {painting.content}
          </dd>
        </div>
      </dl>

      <h2 className="mt-8 font-serif text-xl text-stone-900">
        Images{' '}
        <span className="text-sm font-normal text-stone-500">
          ({painting.images.length})
        </span>
      </h2>
      {painting.images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {painting.images.map((image) => (
            <li key={image.id}>
              <img
                src={`/resources/note-images/${image.id}`}
                alt={image.altText ?? painting.title}
                className="aspect-square w-full rounded object-cover"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-stone-600">
          This Painting has no images, so it does not appear on public pages.
        </p>
      )}

      <DeletePaintingForm
        paintingTitle={painting.title}
        imageCount={painting.images.length}
        pending={deletePending}
        error={deleteError}
        onDelete={onDelete}
      />
    </section>
  )
}

type DeletePaintingFormProps = {
  paintingTitle: string
  imageCount: number
  pending?: boolean
  error?: string | null
  onDelete?: (event: React.FormEvent<HTMLFormElement>) => void
}

export function DeletePaintingForm({
  paintingTitle,
  imageCount,
  pending,
  error,
  onDelete,
}: DeletePaintingFormProps) {
  return (
    <form
      className="mt-12 max-w-lg rounded border border-red-300 bg-red-50 p-4"
      onSubmit={onDelete}
    >
      <h2 className="font-serif text-lg text-red-900">Delete this Painting</h2>
      <p className="mt-2 text-sm text-red-800">
        Deleting <span className="font-medium">{paintingTitle}</span> will
        permanently remove it and its {imageCount}{' '}
        {imageCount === 1 ? 'image' : 'images'} from the portfolio. This cannot
        be undone.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded border border-red-600 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60"
      >
        {pending ? 'Deleting…' : 'Delete painting'}
      </button>
    </form>
  )
}
