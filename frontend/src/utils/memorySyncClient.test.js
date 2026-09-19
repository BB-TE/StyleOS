import assert from 'node:assert/strict'
import test from 'node:test'
import { getDeviceOwnerId, hasMemorySyncConsent, setMemorySyncConsent } from './memorySyncClient.js'

class MemoryStorage {
  constructor() { this.values = new Map() }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null }
  setItem(key, value) { this.values.set(key, String(value)) }
}

test('text-memory sync consent is explicit and can be revoked', () => {
  globalThis.localStorage = new MemoryStorage()
  let events = 0
  globalThis.window = { dispatchEvent: () => { events += 1 } }
  globalThis.CustomEvent ??= class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail } }

  assert.equal(hasMemorySyncConsent(), false)
  assert.equal(setMemorySyncConsent(true), true)
  assert.equal(hasMemorySyncConsent(), true)
  assert.equal(setMemorySyncConsent(false), false)
  assert.equal(hasMemorySyncConsent(), false)
  assert.equal(events, 2)
})

test('the development owner id is stable within one browser storage', () => {
  globalThis.localStorage = new MemoryStorage()
  const first = getDeviceOwnerId()
  assert.equal(getDeviceOwnerId(), first)
  assert.match(first, /^device-[a-zA-Z0-9-]{12,}$/)
})
