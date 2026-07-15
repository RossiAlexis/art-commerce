import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

import type {
  PaintingDetailData,
  PaintingDetailImageView,
} from './painting-detail'

export function PaintingDetailView({
  id,
  title,
  priceText,
  measures,
  description,
  images,
}: PaintingDetailData) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 md:px-12 md:py-16">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <PaintingCarousel title={title} images={images} />

        <div className="flex flex-col">
          <h1 className="font-display text-4xl leading-none text-[#3f4f23] md:text-6xl">
            {title}
          </h1>

          <p className="mt-4 font-serif text-xl text-stone-800 md:text-2xl">
            {priceText}
          </p>

          {measures ? (
            <p className="mt-2 text-sm tracking-wide text-stone-600 uppercase">
              {measures}
            </p>
          ) : null}

          <p className="mt-6 text-sm leading-7 whitespace-pre-line text-stone-700 md:text-base md:leading-8">
            {description}
          </p>

          <a
            href={`/contact-me?q=${encodeURIComponent(id)}`}
            className="mt-8 inline-flex w-fit items-center justify-center rounded-full bg-[#3f4f23] px-6 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-[#526a27] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#688329] md:text-base"
          >
            Inquire about this Painting
          </a>
        </div>
      </div>
    </main>
  )
}

function PaintingCarousel({
  title,
  images,
}: {
  title: string
  images: Array<PaintingDetailImageView>
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const count = images.length
  const safeIndex = Math.min(activeIndex, Math.max(count - 1, 0))

  const altFor = (image: PaintingDetailImageView) => image.altText ?? title
  const goTo = (next: number) => setActiveIndex((next + count) % count)

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`Images of ${title}`}
      className="flex flex-col gap-4"
      onKeyDown={(event) => {
        if (count < 2) return
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          goTo(safeIndex - 1)
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          goTo(safeIndex + 1)
        }
      }}
    >
      <div className="relative">
        <ul className="m-0 list-none p-0">
          {images.map((image, index) => (
            <li
              key={image.id}
              hidden={index !== safeIndex}
              aria-roledescription="slide"
              aria-label={`Image ${index + 1} of ${count}`}
            >
              <Dialog.Root>
                <Dialog.Trigger className="group relative block w-full cursor-zoom-in overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#688329]">
                  <img
                    src={`/resources/note-images/${image.id}`}
                    alt={altFor(image)}
                    className="aspect-square w-full object-cover shadow-sm"
                  />
                  <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                    <ZoomIn aria-hidden="true" className="h-4 w-4" />
                    Enlarge
                  </span>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/80" />
                  <Dialog.Popup className="fixed inset-0 z-50 m-auto flex h-fit max-h-[90vh] w-fit max-w-[90vw] flex-col outline-none">
                    <Dialog.Title className="sr-only">
                      {title} — enlarged image {index + 1} of {count}
                    </Dialog.Title>
                    <img
                      src={`/resources/note-images/${image.id}`}
                      alt={altFor(image)}
                      className="max-h-[90vh] max-w-[90vw] object-contain"
                    />
                    <Dialog.Close
                      aria-label="Close enlarged image"
                      className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-stone-900 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <X aria-hidden="true" className="h-5 w-5" />
                    </Dialog.Close>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </li>
          ))}
        </ul>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-stone-900 shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#688329]"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(safeIndex + 1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-stone-900 shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#688329]"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        Image {safeIndex + 1} of {count}
      </p>

      {count > 1 ? (
        <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show image ${index + 1} of ${count}`}
                aria-current={index === safeIndex ? 'true' : undefined}
                className={thumbnailClassName(index === safeIndex)}
              >
                <img
                  src={`/resources/note-images/${image.id}`}
                  alt=""
                  className="h-16 w-16 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function thumbnailClassName(isActive: boolean) {
  const base =
    'block overflow-hidden rounded-sm border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#688329]'

  return isActive
    ? `${base} border-[#3f4f23]`
    : `${base} border-transparent hover:border-[#688329]`
}
