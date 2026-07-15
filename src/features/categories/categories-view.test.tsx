import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  CategoryForm,
  CategoryListView,
  DeleteCategoryForm,
} from './categories-view'

describe('CategoryListView', () => {
  it('lists Categories with their management name and public navigation label', () => {
    const markup = renderToStaticMarkup(
      <CategoryListView
        username="vero"
        categories={[
          {
            id: 'c-abstract',
            name: 'Abstract Works',
            navigationLabel: 'Abstract',
            paintingCount: 2,
          },
        ]}
      />,
    )

    expect(markup).toContain('Abstract Works')
    expect(markup).toContain('Abstract')
    // Rows link to the per-Category management page.
    expect(markup).toContain(
      'href="/administration/vero/categories/c-abstract"',
    )
    // A create action is always offered.
    expect(markup).toContain('href="/administration/vero/categories/new"')
  })

  it('renders a useful empty index state when there are no Categories', () => {
    const markup = renderToStaticMarkup(
      <CategoryListView username="vero" categories={[]} />,
    )

    expect(markup).toContain('No Categories yet')
    expect(markup).toContain('href="/administration/vero/categories/new"')
  })

  it('flags Categories missing a public navigation label as hidden from navigation', () => {
    const markup = renderToStaticMarkup(
      <CategoryListView
        username="vero"
        categories={[
          {
            id: 'c-legacy',
            name: 'Legacy',
            navigationLabel: null,
            paintingCount: 0,
          },
        ]}
      />,
    )

    expect(markup).toContain('Not shown in navigation')
  })
})

describe('CategoryForm', () => {
  it('renders create-mode fields for both names', () => {
    const markup = renderToStaticMarkup(
      <CategoryForm
        mode="create"
        username="vero"
        defaultValues={{ name: '', navigationLabel: '' }}
      />,
    )

    expect(markup).toContain('name="name"')
    expect(markup).toContain('name="navigationLabel"')
    expect(markup).toContain('Create category')
  })

  it('prefills edit-mode fields and shows validation errors', () => {
    const markup = renderToStaticMarkup(
      <CategoryForm
        mode="edit"
        username="vero"
        defaultValues={{ name: 'Abstract Works', navigationLabel: 'Abstract' }}
        errors={{ name: 'A management name is required.' }}
      />,
    )

    expect(markup).toContain('value="Abstract Works"')
    expect(markup).toContain('value="Abstract"')
    expect(markup).toContain('A management name is required.')
    expect(markup).toContain('Save changes')
  })
})

describe('DeleteCategoryForm', () => {
  it('warns that associated Paintings will become uncategorized', () => {
    const markup = renderToStaticMarkup(
      <DeleteCategoryForm categoryName="Abstract Works" paintingCount={2} />,
    )

    expect(markup).toMatch(/uncategorized/i)
    expect(markup).toContain('Abstract Works')
    // The Painting count sharpens the warning.
    expect(markup).toContain('2')
  })
})
