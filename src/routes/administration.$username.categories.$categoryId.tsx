import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import {
  CategoryForm,
  DeleteCategoryForm,
} from '#/features/categories/categories-view'
import type { CategoryInputErrors } from '#/features/categories/categories'
import {
  deleteCategoryFn,
  getCategoryFn,
  updateCategoryFn,
} from '#/features/categories/categories.functions'

export const Route = createFileRoute(
  '/administration/$username/categories/$categoryId',
)({
  loader: ({ params }) =>
    getCategoryFn({
      data: { username: params.username, categoryId: params.categoryId },
    }),
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Edit Category' }],
  }),
  component: EditCategory,
})

function EditCategory() {
  const { username, category } = Route.useLoaderData()
  const router = useRouter()
  const [errors, setErrors] = useState<CategoryInputErrors>({})
  const [pending, setPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setErrors({})

    const form = new FormData(event.currentTarget)
    const result = await updateCategoryFn({
      data: {
        username,
        categoryId: category.id,
        name: String(form.get('name') ?? ''),
        navigationLabel: String(form.get('navigationLabel') ?? ''),
      },
    })

    if (!result.ok) {
      setErrors(result.errors)
      setPending(false)
      return
    }

    await router.invalidate()
    await router.navigate({
      to: '/administration/$username/categories',
      params: { username },
    })
  }

  async function onDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDeletePending(true)

    await deleteCategoryFn({
      data: { username, categoryId: category.id },
    })

    await router.invalidate()
    await router.navigate({
      to: '/administration/$username/categories',
      params: { username },
    })
  }

  return (
    <section>
      <h1 className="font-serif text-3xl text-stone-900">Edit category</h1>
      <CategoryForm
        mode="edit"
        username={username}
        defaultValues={{
          name: category.name,
          navigationLabel: category.navigationLabel ?? '',
        }}
        errors={errors}
        pending={pending}
        onSubmit={onSubmit}
      />
      <DeleteCategoryForm
        categoryName={category.name}
        paintingCount={category.paintingCount}
        pending={deletePending}
        onDelete={onDelete}
      />
    </section>
  )
}
