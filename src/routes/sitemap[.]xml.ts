import { createFileRoute } from '@tanstack/react-router'

import { sitemapResponse } from '#/features/seo/seo.functions'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: ({ request }) => sitemapResponse(request),
    },
  },
})
