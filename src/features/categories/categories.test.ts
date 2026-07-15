import { describe, expect, it } from 'vitest'

import {
  createManagedCategory,
  deleteManagedCategory,
  listCategoriesForManagement,
  parseCategoryInput,
  sortManagedCategories,
  updateManagedCategory,
} from './categories'
import type { CategoryRepository, ManagedCategory } from './categories'

describe('parseCategoryInput', () => {
  it('accepts and trims a management name and public navigation label', () => {
    const result = parseCategoryInput({
      name: '  Abstract Works  ',
      navigationLabel: '  Abstract  ',
    })

    expect(result).toEqual({
      ok: true,
      data: { name: 'Abstract Works', navigationLabel: 'Abstract' },
    })
  })

  it('rejects a missing or whitespace-only management name', () => {
    const result = parseCategoryInput({
      name: '   ',
      navigationLabel: 'Abstract',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.name).toBeDefined()
      expect(result.errors.navigationLabel).toBeUndefined()
    }
  })

  it('rejects a missing public navigation label', () => {
    const result = parseCategoryInput({
      name: 'Abstract Works',
      navigationLabel: '',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.navigationLabel).toBeDefined()
    }
  })
})

describe('sortManagedCategories', () => {
  it('orders Categories alphabetically by management name', () => {
    const sorted = sortManagedCategories([
      category('c-portraits', 'Portraits', 'Portrait work'),
      category('c-abstract', 'Abstract Works', 'Abstract'),
      category('c-land', 'Landscapes', 'Landscape'),
    ])

    expect(sorted.map(({ id }) => id)).toEqual([
      'c-abstract',
      'c-land',
      'c-portraits',
    ])
  })

  it('breaks ties on management name using the Category id', () => {
    const sorted = sortManagedCategories([
      category('zebra', 'Same', 'Same'),
      category('alpha', 'Same', 'Same'),
    ])

    expect(sorted.map(({ id }) => id)).toEqual(['alpha', 'zebra'])
  })
})

describe('listCategoriesForManagement', () => {
  it('returns the repository Categories sorted for the index', async () => {
    const repo = fakeRepository([
      category('c-portraits', 'Portraits', 'Portrait work'),
      category('c-abstract', 'Abstract Works', 'Abstract'),
    ])

    const categories = await listCategoriesForManagement(repo)

    expect(categories.map(({ name }) => name)).toEqual([
      'Abstract Works',
      'Portraits',
    ])
  })
})

describe('createManagedCategory', () => {
  it('validates then creates a Category', async () => {
    const repo = fakeRepository([])

    const result = await createManagedCategory(repo, {
      name: '  Abstract Works  ',
      navigationLabel: 'Abstract',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.category.name).toBe('Abstract Works')
      expect(result.category.navigationLabel).toBe('Abstract')
    }
    expect(repo.state).toHaveLength(1)
  })

  it('returns validation errors without touching the repository', async () => {
    const repo = fakeRepository([])

    const result = await createManagedCategory(repo, {
      name: '',
      navigationLabel: '',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.name).toBeDefined()
      expect(result.errors.navigationLabel).toBeDefined()
    }
    expect(repo.state).toHaveLength(0)
  })
})

describe('updateManagedCategory', () => {
  it('validates then updates an existing Category', async () => {
    const repo = fakeRepository([
      category('c-abstract', 'Abstract', 'Abstract'),
    ])

    const result = await updateManagedCategory(repo, 'c-abstract', {
      name: 'Abstract Works',
      navigationLabel: 'Abstract Art',
    })

    expect(result).not.toBeNull()
    expect(result?.ok).toBe(true)
    if (result?.ok) {
      expect(result.category.name).toBe('Abstract Works')
      expect(result.category.navigationLabel).toBe('Abstract Art')
    }
    expect(repo.state[0].name).toBe('Abstract Works')
  })

  it('returns null when the Category does not exist', async () => {
    const repo = fakeRepository([])

    const result = await updateManagedCategory(repo, 'missing', {
      name: 'Abstract Works',
      navigationLabel: 'Abstract',
    })

    expect(result).toBeNull()
  })

  it('returns validation errors for an existing Category', async () => {
    const repo = fakeRepository([
      category('c-abstract', 'Abstract', 'Abstract'),
    ])

    const result = await updateManagedCategory(repo, 'c-abstract', {
      name: '',
      navigationLabel: 'Abstract',
    })

    expect(result?.ok).toBe(false)
    if (result && !result.ok) {
      expect(result.errors.name).toBeDefined()
    }
    // The stored Category is left unchanged when validation fails.
    expect(repo.state[0].name).toBe('Abstract')
  })
})

describe('deleteManagedCategory', () => {
  it('deletes the Category and reports how many Paintings were uncategorized', async () => {
    const repo = fakeRepository([
      category('c-abstract', 'Abstract', 'Abstract', 3),
    ])

    const result = await deleteManagedCategory(repo, 'c-abstract')

    expect(result).toEqual({
      id: 'c-abstract',
      name: 'Abstract',
      uncategorizedPaintings: 3,
    })
    expect(repo.state).toHaveLength(0)
  })

  it('returns null when the Category does not exist', async () => {
    const repo = fakeRepository([])

    expect(await deleteManagedCategory(repo, 'missing')).toBeNull()
  })
})

function category(
  id: string,
  name: string,
  navigationLabel: string | null,
  paintingCount = 0,
): ManagedCategory {
  return { id, name, navigationLabel, paintingCount }
}

type FakeRepository = CategoryRepository & { state: Array<ManagedCategory> }

function fakeRepository(initial: Array<ManagedCategory>): FakeRepository {
  const state = initial.map((entry) => ({ ...entry }))

  return {
    state,
    async listCategories() {
      return state.map((entry) => ({ ...entry }))
    },
    async findCategory(id) {
      const found = state.find((entry) => entry.id === id)
      return found ? { ...found } : null
    },
    async createCategory(input) {
      const created: ManagedCategory = {
        id: `c-${state.length + 1}`,
        name: input.name,
        navigationLabel: input.navigationLabel,
        paintingCount: 0,
      }
      state.push(created)
      return { ...created }
    },
    async updateCategory(id, input) {
      const found = state.find((entry) => entry.id === id)
      if (!found) return null
      found.name = input.name
      found.navigationLabel = input.navigationLabel
      return { ...found }
    },
    async deleteCategory(id) {
      const index = state.findIndex((entry) => entry.id === id)
      if (index === -1) return null
      const [removed] = state.splice(index, 1)
      return {
        id: removed.id,
        name: removed.name,
        uncategorizedPaintings: removed.paintingCount,
      }
    },
  }
}
