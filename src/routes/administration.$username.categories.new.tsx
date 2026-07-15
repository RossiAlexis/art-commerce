import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { CategoryForm } from '#/features/categories/categories-view'
import type { CategoryInputErrors } from '#/features/categories/categories'
import { createCategoryFn } from '#/features/categories/categories.functions'

export const Route = createFileRoute(
  '/administration/$username/categories/new',
)({
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - New Category' }],
  }),
  component: NewCategory,
})

function NewCategory() {
  const { username } = Route.useParams()
  const router = useRouter()
  const [errors, setErrors] = useState<CategoryInputErrors>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setErrors({})

    const form = new FormData(event.currentTarget)
    const result = await createCategoryFn({
      data: {
        username,
        name: String(form.get('name') ?? ''),
        navigationLabel: String(form.get('navigationLabel') ?? ''),
      },
    })

    if (!result.ok) {
      setErrors(result.errors)
      setPending(false)
      return
    }

    await router.navigate({
      to: '/administration/$username/categories',
      params: { username },
    })
  }

  return (
    <section>
      <h1 className="font-serif text-3xl text-stone-900">New category</h1>
      <CategoryForm
        mode="create"
        username={username}
        defaultValues={{ name: '', navigationLabel: '' }}
        errors={errors}
        pending={pending}
        onSubmit={onSubmit}
      />
    </section>
  )
}
