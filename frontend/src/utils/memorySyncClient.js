const ENV = import.meta.env || {}
const API_BASE = ENV.VITE_API_BASE_URL || 'http://localhost:3001'
const LOCAL_DEMO_ONLY = ENV.VITE_LOCAL_DEMO_ONLY === 'true'
const MEMORY_SYNC_FLAG = ENV.VITE_MEMORY_SYNC_ENABLED
const OWNER_KEY = 'styleos.v3.deviceOwnerId'
const CONSENT_KEY = 'styleos.v3.memorySyncConsent'

export const MEMORY_SYNC_CONSENT_EVENT = 'styleos:memory-sync-consent'

export class MemorySyncError extends Error {
  constructor(message, { status = 0, payload = null } = {}) {
    super(message)
    this.name = 'MemorySyncError'
    this.status = status
    this.payload = payload
  }
}

function createOwnerId() {
  if (globalThis.crypto?.randomUUID) return `device-${globalThis.crypto.randomUUID()}`
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`
}

export function getDeviceOwnerId() {
  try {
    const existing = localStorage.getItem(OWNER_KEY)
    if (existing) return existing
    const ownerId = createOwnerId()
    localStorage.setItem(OWNER_KEY, ownerId)
    return ownerId
  } catch {
    return createOwnerId()
  }
}

export function memorySyncAvailable() {
  if (LOCAL_DEMO_ONLY) return false
  if (MEMORY_SYNC_FLAG === 'true') return true
  if (MEMORY_SYNC_FLAG === 'false') return false
  return ENV.DEV === true
}

export function hasMemorySyncConsent() {
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY))
    return value?.version === 1 && value?.enabled === true
  } catch {
    return false
  }
}

export const getMemorySyncConsent = hasMemorySyncConsent

export function setMemorySyncConsent(enabled) {
  const consent = {
    version: 1,
    enabled: Boolean(enabled),
    scope: 'text-memory-no-images',
    updatedAt: new Date().toISOString(),
  }
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)) } catch { /* Keep the in-memory event usable. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(MEMORY_SYNC_CONSENT_EVENT, { detail: consent }))
  return consent.enabled
}

export const memorySyncEnabled = () => memorySyncAvailable() && hasMemorySyncConsent()

async function readResponsePayload(response) {
  try { return await response.json() } catch { return null }
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const externalSignal = options.signal
  const abortFromOutside = () => controller.abort()
  if (externalSignal?.aborted) controller.abort()
  else externalSignal?.addEventListener('abort', abortFromOutside, { once: true })
  const timeout = setTimeout(() => controller.abort(), 3_500)
  const { signal: _signal, ...fetchOptions } = options
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'X-StyleOS-Owner': getDeviceOwnerId(),
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    })
    const payload = await readResponsePayload(response)
    if (!response.ok) throw new MemorySyncError(payload?.message || `StyleOS memory API ${response.status}`, { status: response.status, payload })
    return payload
  } finally {
    clearTimeout(timeout)
    externalSignal?.removeEventListener('abort', abortFromOutside)
  }
}

function assertSyncEnabled() {
  if (!memorySyncEnabled()) throw new MemorySyncError('Memory sync is unavailable or has not been authorized.')
}

export async function fetchMemoryState(options = {}) {
  assertSyncEnabled()
  return request('/api/memory/state', options)
}

export async function saveMemoryState(state, expectedRevision, options = {}) {
  assertSyncEnabled()
  return request('/api/memory/state', { ...options, method: 'PUT', body: JSON.stringify({ state, expectedRevision }) })
}

export async function deleteMemoryState(options = {}) {
  if (!memorySyncAvailable()) throw new MemorySyncError('Memory sync is unavailable.')
  return request('/api/memory/state', { ...options, method: 'DELETE' })
}
