import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/logout')({
  server: {
    handlers: {
      POST: async () => {
        const { logOut } = await import('#/features/auth/auth.session')
        await logOut()
        return new Response(null, { status: 303, headers: { Location: '/' } })
      },
    },
  },
})
