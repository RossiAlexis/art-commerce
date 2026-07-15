import type { CategoryInputErrors, ManagedCategory } from './categories'

type CategoryListViewProps = {
  username: string
  categories: Array<ManagedCategory>
}

export function CategoryListView({
  username,
  categories,
}: CategoryListViewProps) {
  const base = `/administration/${username}/categories`

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-stone-900">Categories</h1>
        <a
          href={`${base}/new`}
          className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white"
        >
          New category
        </a>
      </div>

      <p className="mt-2 text-sm text-stone-600">
        Categories drive the public Painting navigation and its <code>?q=</code>{' '}
        filters.
      </p>

      {categories.length > 0 ? (
        <ul className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
          {categories.map((category) => (
            <li key={category.id}>
              <a
                href={`${base}/${category.id}`}
                className="flex items-center justify-between gap-4 px-1 py-4 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#688329]"
              >
                <span>
                  <span className="block font-medium text-stone-900">
                    {category.name}
                  </span>
                  <span className="block text-sm text-stone-600">
                    {category.navigationLabel
                      ? `Navigation: ${category.navigationLabel}`
                      : 'Not shown in navigation'}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-stone-500">
                  {category.paintingCount}{' '}
                  {category.paintingCount === 1 ? 'Painting' : 'Paintings'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-600">
          No Categories yet. Create one to build the public navigation and
          filters.
        </p>
      )}
    </section>
  )
}

type CategoryFormValues = {
  name: string
  navigationLabel: string
}

type CategoryFormProps = {
  mode: 'create' | 'edit'
  username: string
  defaultValues: CategoryFormValues
  errors?: CategoryInputErrors
  formError?: string | null
  pending?: boolean
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}

export function CategoryForm({
  mode,
  username,
  defaultValues,
  errors,
  formError,
  pending,
  onSubmit,
}: CategoryFormProps) {
  const submitLabel = mode === 'create' ? 'Create category' : 'Save changes'

  return (
    <form className="mt-8 max-w-lg space-y-6" onSubmit={onSubmit}>
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          Management name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues.name}
          aria-invalid={errors?.name ? true : undefined}
          className="w-full rounded border border-stone-400 px-3 py-2"
        />
        <p className="text-xs text-stone-500">
          Used only inside Administration.
        </p>
        {errors?.name ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="navigationLabel" className="block text-sm font-medium">
          Public navigation label
        </label>
        <input
          id="navigationLabel"
          name="navigationLabel"
          required
          defaultValue={defaultValues.navigationLabel}
          aria-invalid={errors?.navigationLabel ? true : undefined}
          className="w-full rounded border border-stone-400 px-3 py-2"
        />
        <p className="text-xs text-stone-500">
          Shown to visitors in the Paintings navigation.
        </p>
        {errors?.navigationLabel ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.navigationLabel}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-stone-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <a
          href={`/administration/${username}/categories`}
          className="text-sm text-stone-600 underline"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}

type DeleteCategoryFormProps = {
  categoryName: string
  paintingCount: number
  pending?: boolean
  error?: string | null
  onDelete?: (event: React.FormEvent<HTMLFormElement>) => void
}

export function DeleteCategoryForm({
  categoryName,
  paintingCount,
  pending,
  error,
  onDelete,
}: DeleteCategoryFormProps) {
  return (
    <form
      className="mt-12 max-w-lg rounded border border-red-300 bg-red-50 p-4"
      onSubmit={onDelete}
    >
      <h2 className="font-serif text-lg text-red-900">Delete this Category</h2>
      <p className="mt-2 text-sm text-red-800">
        Deleting <span className="font-medium">{categoryName}</span> will remove
        it from the public navigation. Its {paintingCount}{' '}
        {paintingCount === 1 ? 'Painting' : 'Paintings'} will be preserved but
        become <span className="font-medium">uncategorized</span>. This cannot
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
        {pending ? 'Deleting…' : 'Delete category'}
      </button>
    </form>
  )
}
