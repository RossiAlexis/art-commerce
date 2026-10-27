import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { requireAdministratorFn } from '#/features/auth/auth.functions'
import { HomepageAdminView } from '#/features/homepage/homepage-admin-view'
import type { HomepageAdminStatus } from '#/features/homepage/homepage-admin-view'
import {
  describeHomepageImageFn,
  getAdminHomepageFn,
  removeHomepageImageFn,
  saveHomepageContentFn,
  saveHomepageImageFn,
} from '#/features/homepage/homepage-admin.functions'

export const Route = createFileRoute('/administration/$username/homepage')({
  beforeLoad: async ({ location, params }) => {
    const user = await requireAdministratorFn({
      data: { returnTo: location.href, requestedUsername: params.username },
    })
    return { user, returnTo: location.href }
  },
  loader: ({ context, params }) =>
    getAdminHomepageFn({
      data: { returnTo: context.returnTo, requestedUsername: params.username },
    }),
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Homepage' }],
  }),
  component: HomepageAdmin,
})

function HomepageAdmin() {
  const homepage = Route.useLoaderData()
  const { username } = Route.useParams()
  const router = useRouter()
  const [status, setStatus] = useState<HomepageAdminStatus>({ kind: 'idle' })
  const [pending, setPending] = useState(false)

  const returnTo = `/administration/${username}/homepage`

  async function run(
    action: () => Promise<{ ok: boolean; error?: string } | null>,
    successMessage: string,
  ): Promise<{ ok: boolean; error?: string } | null> {
    setPending(true)
    setStatus({ kind: 'idle' })
    try {
      const result = await action()
      if (result && result.ok === false) {
        setStatus({
          kind: 'error',
          message: result.error ?? 'The change could not be saved.',
        })
        return result
      }
      await router.invalidate()
      setStatus({ kind: 'success', message: successMessage })
      return result
    } catch {
      setStatus({
        kind: 'error',
        message: 'The change could not be saved. Please try again.',
      })
      return { ok: false }
    } finally {
      setPending(false)
    }
  }

  return (
    <HomepageAdminView
      username={username}
      homepage={homepage}
      status={status}
      pending={pending}
      onSaveContent={({ title, text }) =>
        run(
          () =>
            saveHomepageContentFn({
              data: { title, text, returnTo, requestedUsername: username },
            }),
          'Homepage title and text updated.',
        )
      }
      onUploadImage={({ role, file, altText }) => {
        const form = new FormData()
        form.set('image', file)
        form.set('altText', altText)
        form.set('role', role)
        form.set('returnTo', returnTo)
        form.set('requestedUsername', username)
        return run(
          () => saveHomepageImageFn({ data: form }),
          role === 'hero' ? 'Hero image saved.' : 'Intro image saved.',
        )
      }}
      onDescribeImage={({ role, altText }) =>
        run(
          () =>
            describeHomepageImageFn({
              data: { altText, role, returnTo, requestedUsername: username },
            }),
          'Image description updated.',
        )
      }
      onRemoveImage={(role) =>
        run(
          () =>
            removeHomepageImageFn({
              data: { role, returnTo, requestedUsername: username },
            }),
          role === 'hero' ? 'Hero image removed.' : 'Intro image removed.',
        )
      }
    />
  )
}
