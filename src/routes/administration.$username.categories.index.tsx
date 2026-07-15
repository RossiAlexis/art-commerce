import { createFileRoute } from '@tanstack/react-router'

import { CategoryListView } from '#/features/categories/categories-view'
import { listCategoriesFn } from '#/features/categories/categories.functions'

export const Route = createFileRoute('/administration/$username/categories/')({
  loader: ({ params }) =>
    listCategoriesFn({ data: { username: params.username } }),
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Categories' }],
  }),
  component: CategoriesIndex,
})

function CategoriesIndex() {
  const { username, categories } = Route.useLoaderData()
  return <CategoryListView username={username} categories={categories} />
}
