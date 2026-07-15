import type { GalleryData } from '#/features/gallery/gallery'

type GalleryViewProps = GalleryData

export function GalleryView({
  categories,
  paintings,
  activeCategoryId,
  categoryUnavailable,
}: GalleryViewProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 md:px-12 md:py-16">
      <h1 className="font-display text-5xl leading-none text-[#3f4f23] md:text-7xl">
        Paintings
      </h1>

      {categories.length > 0 ? (
        <nav aria-label="Filter Paintings by Category" className="mt-8">
          <ul className="flex flex-wrap gap-3 text-sm md:text-base">
            <li>
              <a
                href="/paintings"
                aria-current={activeCategoryId === null ? 'page' : undefined}
                className={filterLinkClassName(activeCategoryId === null)}
              >
                All
              </a>
            </li>
            {categories.map((category) => {
              const isActive = category.id === activeCategoryId
              return (
                <li key={category.id}>
                  <a
                    href={`/paintings?q=${encodeURIComponent(category.id)}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={filterLinkClassName(isActive)}
                  >
                    {category.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      ) : null}

      {paintings.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {paintings.map((painting) => {
            const image = painting.images.at(0)
            if (!image) return null

            return (
              <li key={painting.id}>
                <a
                  href={`/paintings/${painting.id}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#688329]"
                >
                  <img
                    src={`/resources/note-images/${image.id}`}
                    alt={image.altText ?? painting.title}
                    className="aspect-square w-full rounded-sm object-cover shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                  />
                  <span className="mt-3 block text-center font-serif text-sm italic text-stone-700 md:text-base">
                    {painting.title}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-16 text-center text-sm leading-7 text-stone-600 md:text-base">
          {categoryUnavailable
            ? 'This Category is no longer available. Browse all Paintings to keep exploring the portfolio.'
            : 'There are no Paintings to show here yet. Please check back soon.'}
        </p>
      )}
    </main>
  )
}

function filterLinkClassName(isActive: boolean) {
  const base =
    'inline-block rounded-full border px-4 py-1.5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#688329]'

  return isActive
    ? `${base} border-[#3f4f23] bg-[#3f4f23] text-white`
    : `${base} border-stone-300 text-stone-700 hover:border-[#688329] hover:text-[#3f4f23]`
}
