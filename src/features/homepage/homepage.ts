export type HomepageImage = {
  id: string
  altText: string | null
}

export type HomepageContent = {
  title: string
  text: string
  /** Intro image beside the title and text. */
  image: HomepageImage | null
  /** Full-width banner. Null when the homepage has no hero image. */
  hero: HomepageImage | null
}

export type PaintingPreview = {
  id: string
  title: string
  createdAt: Date
  images: Array<HomepageImage>
}

export type HomepageRepository = {
  getHomepage: () => Promise<HomepageContent | null>
  listPaintings: () => Promise<Array<PaintingPreview>>
}

export async function loadHomepage(repository: HomepageRepository) {
  const [homepage, paintings] = await Promise.all([
    repository.getHomepage(),
    repository.listPaintings(),
  ])

  return {
    homepage,
    paintings: paintings
      .filter(({ images }) => images.length > 0)
      .sort((left, right) => {
        const createdAtDifference =
          left.createdAt.getTime() - right.createdAt.getTime()

        return createdAtDifference || left.id.localeCompare(right.id)
      })
      .slice(0, 4),
  }
}
