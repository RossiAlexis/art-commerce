import { createFileRoute } from '@tanstack/react-router'

import { robotsResponse } from '#/features/seo/seo.functions'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: ({ request }) => robotsResponse(request),
    },
  },
})
