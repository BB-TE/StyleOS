import assert from 'node:assert/strict'
import test from 'node:test'
import { getProductState, getWardrobe, removeWardrobeItem, replaceProductState, saveWardrobeItem } from './productStore.js'

class MemoryStorage {
  constructor() { this.values = new Map() }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
  clear() { this.values.clear() }
}

test('state metadata advances for additions and deletions so removed items stay removed', () => {
  globalThis.localStorage = new MemoryStorage()
  let eventCount = 0
  globalThis.window = { dispatchEvent: () => { eventCount += 1 } }
  globalThis.CustomEvent ??= class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail } }

  const initial = getProductState()
  const item = saveWardrobeItem({ name: 'Ivory shirt', category: 'tops', color: 'ivory', fit: 'regular' })
  const afterAdd = getProductState()
  removeWardrobeItem(item.id)
  const afterDelete = getProductState()

  assert.equal(afterAdd.meta.revision, initial.meta.revision + 1)
  assert.equal(afterDelete.meta.revision, afterAdd.meta.revision + 1)
  assert.equal(afterDelete.wardrobe.length, 0)
  assert.ok(eventCount >= 3)
})

test('remote hydration replaces the state with one change event', () => {
  globalThis.localStorage = new MemoryStorage()
  let eventCount = 0
  globalThis.window = { dispatchEvent: () => { eventCount += 1 } }
  globalThis.CustomEvent ??= class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail } }

  const initial = getProductState()
  eventCount = 0
  const remote = {
    ...initial,
    revision: 8,
    updatedAt: '2026-01-01T00:00:00.000Z',
    wardrobe: [{ id: 'remote-item', name: 'Remote trousers', category: 'bottoms', color: 'black', fit: 'straight' }],
  }
  const hydrated = replaceProductState(remote)

  assert.equal(hydrated.wardrobe[0].id, 'remote-item')
  assert.ok(hydrated.meta.revision >= 8)
  assert.equal(eventCount, 1)
})

test('a kept decision updates one wardrobe item instead of creating duplicates', () => {
  globalThis.localStorage = new MemoryStorage()
  globalThis.window = { dispatchEvent: () => {} }
  globalThis.CustomEvent ??= class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail } }

  const first = saveWardrobeItem({ name: 'Black jacket', category: 'outerwear', sourceDecisionId: 'decision-1', wearFrequency: 'monthly' })
  const updated = saveWardrobeItem({ name: 'Black jacket', category: 'outerwear', sourceDecisionId: 'decision-1', wearFrequency: 'weekly' })

  assert.equal(getWardrobe().length, 1)
  assert.equal(updated.id, first.id)
  assert.equal(getWardrobe()[0].wearFrequency, 'weekly')
})
