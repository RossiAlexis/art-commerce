import { z } from 'zod'

/**
 * A Category as seen from the Administration area. `name` is the internal
 * management name (`Category.description`) and `navigationLabel` is the distinct
 * public navigation label (`Category.subMenuTitle`); the latter can be absent
 * for legacy records that predate the management form.
 */
export type ManagedCategory = {
  id: string
  name: string
  navigationLabel: string | null
  paintingCount: number
}

export type CategoryInput = {
  name: string
  navigationLabel: string
}

/** Outcome of deleting a Category, used to report the uncategorization effect. */
export type CategoryDeletion = {
  id: string
  name: string
  uncategorizedPaintings: number
}

export type CategoryRepository = {
  listCategories: () => Promise<Array<ManagedCategory>>
  findCategory: (id: string) => Promise<ManagedCategory | null>
  createCategory: (input: CategoryInput) => Promise<ManagedCategory>
  updateCategory: (
    id: string,
    input: CategoryInput,
  ) => Promise<ManagedCategory | null>
  deleteCategory: (id: string) => Promise<CategoryDeletion | null>
}

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'A management name is required.'),
  navigationLabel: z
    .string()
    .trim()
    .min(1, 'A public navigation label is required.'),
})

export type CategoryInputErrors = Partial<
  Record<'name' | 'navigationLabel', string>
>

export type CategoryInputResult =
  { ok: true; data: CategoryInput } | { ok: false; errors: CategoryInputErrors }

/** Validate and normalize raw Category form input. */
export function parseCategoryInput(input: unknown): CategoryInputResult {
  const parsed = categoryInputSchema.safeParse(input)
  if (parsed.success) {
    return { ok: true, data: parsed.data }
  }

  const errors: CategoryInputErrors = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path[0]
    if ((key === 'name' || key === 'navigationLabel') && !errors[key]) {
      errors[key] = issue.message
    }
  }

  return { ok: false, errors }
}

/** Order Categories alphabetically by management name for the index view. */
export function sortManagedCategories(
  categories: Array<ManagedCategory>,
): Array<ManagedCategory> {
  return categories
    .slice()
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
    )
}

export type CategoryMutationResult =
  | { ok: true; category: ManagedCategory }
  | { ok: false; errors: CategoryInputErrors }

export async function listCategoriesForManagement(
  repository: CategoryRepository,
): Promise<Array<ManagedCategory>> {
  return sortManagedCategories(await repository.listCategories())
}

export async function createManagedCategory(
  repository: CategoryRepository,
  rawInput: unknown,
): Promise<CategoryMutationResult> {
  const parsed = parseCategoryInput(rawInput)
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors }
  }

  return { ok: true, category: await repository.createCategory(parsed.data) }
}

/** Update an existing Category, or resolve to `null` when it no longer exists. */
export async function updateManagedCategory(
  repository: CategoryRepository,
  id: string,
  rawInput: unknown,
): Promise<CategoryMutationResult | null> {
  const parsed = parseCategoryInput(rawInput)
  if (!parsed.ok) {
    // Only report validation errors for a Category that actually exists so a
    // missing record still surfaces as a 404 rather than a form error.
    const existing = await repository.findCategory(id)
    if (!existing) return null
    return { ok: false, errors: parsed.errors }
  }

  const updated = await repository.updateCategory(id, parsed.data)
  if (!updated) return null
  return { ok: true, category: updated }
}

export async function deleteManagedCategory(
  repository: CategoryRepository,
  id: string,
): Promise<CategoryDeletion | null> {
  return repository.deleteCategory(id)
}
