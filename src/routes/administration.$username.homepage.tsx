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
  ) {
    setPending(true)
    setStatus({ kind: 'idle' })
    try {
      const result = await action()
      if (result && result.ok === false) {
        setStatus({
          kind: 'error',
          message: result.error ?? 'The change could not be saved.',
        })
        return
      }
      await router.invalidate()
      setStatus({ kind: 'success', message: successMessage })
    } catch {
      setStatus({
        kind: 'error',
        message: 'The change could not be saved. Please try again.',
      })
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
      onUploadImage={({ file, altText }) => {
        const form = new FormData()
        form.set('image', file)
        form.set('altText', altText)
        form.set('returnTo', returnTo)
        form.set('requestedUsername', username)
        return run(
          () => saveHomepageImageFn({ data: form }),
          'Homepage image saved.',
        )
      }}
      onDescribeImage={(altText) =>
        run(
          () =>
            describeHomepageImageFn({
              data: { altText, returnTo, requestedUsername: username },
            }),
          'Image description updated.',
        )
      }
      onRemoveImage={() =>
        run(
          () =>
            removeHomepageImageFn({
              data: { returnTo, requestedUsername: username },
            }),
          'Homepage image removed.',
        )
      }
    />
  )
}
