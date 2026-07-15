import { createFileRoute, redirect } from '@tanstack/react-router'

import { requireAdministratorFn } from '#/features/auth/auth.functions'

export const Route = createFileRoute('/administration/')({
  beforeLoad: async ({ location }) => {
    const user = await requireAdministratorFn({
      data: { returnTo: location.href },
    })

    throw redirect({
      to: '/administration/$username',
      params: { username: user.username },
    })
  },
})
