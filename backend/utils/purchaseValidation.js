import { labelingSchema } from '../data/labelingSchema.js'

const isNonEmptyString = (value, max = 300) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max

export function validateMemoryPurchaseProduct(product) {
  if (!product || typeof product !== 'object' || Array.isArray(product)) return 'product must be an object.'
  if (!isNonEmptyString(product.name, 160)) return 'product.name is required.'
  if (!labelingSchema.itemCategories.includes(product.category)) return 'product.category is invalid.'
  if (!labelingSchema.fitLabels.includes(product.fit)) return 'product.fit is invalid.'
  if (!labelingSchema.colorLabels.includes(product.color)) return 'product.color is invalid.'
  if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0 || Number(product.price) > 10_000_000) return 'product.price must be a positive finite number.'
  if (!isNonEmptyString(product.reason, 1200)) return 'product.reason is required.'
  if (!Array.isArray(product.scenes) || product.scenes.some((scene) => !labelingSchema.sceneLabels.includes(scene))) return 'product.scenes contains an invalid value.'
  return null
}
