import type { CategoryListFilters, CreateCategoryInput, UpdateCategoryInput } from '../types/category.types'
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from '../services/category.service'
import { runController } from '../utils/controller.util'

// Kategori listesini dondurur
export async function list({ query }: { query: CategoryListFilters }) {
  return listCategories(query)
}

// Tek kategori detayini getirir
export async function getById({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => getCategoryById(params.id))
}

// Yeni kategori olusturur
export async function create({
  body,
  set,
}: {
  body: CreateCategoryInput
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const category = await createCategory(body)
    set.status = 201
    return category
  })
}

// Kategoriyi gunceller
export async function update({
  params,
  body,
  set,
}: {
  params: { id: string }
  body: UpdateCategoryInput
  set: { status?: number | string }
}) {
  return runController(set, async () => updateCategory(params.id, body))
}

// Kategoriyi siler
export async function remove({
  params,
  set,
}: {
  params: { id: string }
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await deleteCategory(params.id)
    set.status = 204
    return null
  })
}
