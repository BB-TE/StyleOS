import { seedMemoryFromProfile, validateMemory } from './memoryModel.js'

const KEYS = {
  memory: 'styleos.v2.memory',
  wardrobe: 'styleos.v2.wardrobe',
  decisions: 'styleos.v2.decisions',
  migrated: 'styleos.v2.migrated',
  stateMeta: 'styleos.v3.stateMeta',
}

const readJSON = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback } catch { return fallback } }
const rawWriteJSON = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); return value }
const validTimestamp = (value, fallback) => Number.isFinite(Date.parse(value)) ? value : fallback

export function normalizeStateMeta(meta, fallbackUpdatedAt = new Date().toISOString()) {
  const revision = Number.isFinite(Number(meta?.revision)) ? Math.max(0, Math.floor(Number(meta.revision))) : 0
  const syncedRevision = Number.isFinite(Number(meta?.syncedRevision)) ? Math.max(0, Math.floor(Number(meta.syncedRevision))) : null
  const remoteRevision = Number.isFinite(Number(meta?.remoteRevision)) ? Math.max(0, Math.floor(Number(meta.remoteRevision))) : null
  return {
    revision,
    updatedAt: validTimestamp(meta?.updatedAt, fallbackUpdatedAt),
    syncedRevision,
    remoteRevision,
    lastSyncedAt: meta?.lastSyncedAt ? validTimestamp(meta.lastSyncedAt, null) : null,
  }
}

export function advanceStateMeta(meta, now = new Date().toISOString()) {
  const current = normalizeStateMeta(meta, now)
  return { ...current, revision: current.revision + 1, updatedAt: now }
}

function getStateMeta(fallbackUpdatedAt = new Date().toISOString()) {
  const stored = readJSON(KEYS.stateMeta, null)
  const meta = normalizeStateMeta(stored, fallbackUpdatedAt)
  if (!stored) rawWriteJSON(KEYS.stateMeta, meta)
  return meta
}

function dispatchStateChange(detail) {
  window.dispatchEvent(new CustomEvent('styleos:v2-change', { detail }))
}

function writeProductValue(key, value) {
  rawWriteJSON(key, value)
  const meta = advanceStateMeta(getStateMeta())
  rawWriteJSON(KEYS.stateMeta, meta)
  dispatchStateChange({ key, value, meta })
  return value
}

export const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function getMemory() {
  const current = readJSON(KEYS.memory, null)
  if (validateMemory(current)) return current
  const profile = readJSON('styleos.analysisDraft', {})
  const report = readJSON('styleos.latestReport', null)
  const seeded = seedMemoryFromProfile(profile, report)
  return writeProductValue(KEYS.memory, seeded)
}

export function saveMemory(memory) { return writeProductValue(KEYS.memory, memory) }
export function getWardrobe() { const items = readJSON(KEYS.wardrobe, []); return Array.isArray(items) ? items : [] }
export function saveWardrobeItem(input) {
  const items = getWardrobe()
  const sourceMatch = input.sourceDecisionId ? items.find((current) => current.sourceDecisionId === input.sourceDecisionId) : null
  const item = { id: input.id || sourceMatch?.id || createId('wardrobe'), name: input.name, category: input.category || 'tops', color: input.color || 'black', fit: input.fit || 'regular', scenes: input.scenes || [], wearFrequency: input.wearFrequency || 'monthly', status: input.status || 'active', liked: input.liked ?? true, notes: input.notes || '', sourceDecisionId: input.sourceDecisionId || null, createdAt: input.createdAt || sourceMatch?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }
  const index = items.findIndex((current) => current.id === item.id || (item.sourceDecisionId && current.sourceDecisionId === item.sourceDecisionId))
  if (index >= 0) items[index] = { ...items[index], ...item }; else items.unshift(item)
  writeProductValue(KEYS.wardrobe, items)
  return item
}
export function removeWardrobeItem(id) { return writeProductValue(KEYS.wardrobe, getWardrobe().filter((item) => item.id !== id)) }
export function removeWardrobeItemByDecision(decisionId) { return writeProductValue(KEYS.wardrobe, getWardrobe().filter((item) => item.sourceDecisionId !== decisionId)) }

export function getDecisions() { const items = readJSON(KEYS.decisions, []); return Array.isArray(items) ? items : [] }
export function saveDecision(input) {
  const items = getDecisions()
  const decision = { id: input.id || createId('decision'), product: input.product, result: input.result, status: input.status || 'advised', outcome: input.outcome || null, createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }
  const index = items.findIndex((current) => current.id === decision.id)
  if (index >= 0) items[index] = { ...items[index], ...decision }; else items.unshift(decision)
  writeProductValue(KEYS.decisions, items)
  return decision
}
export function removeDecision(id) { return writeProductValue(KEYS.decisions, getDecisions().filter((item) => item.id !== id)) }

export function getProductState() {
  const memory = getMemory()
  const wardrobe = getWardrobe()
  const decisions = getDecisions()
  const dates = [memory.updatedAt, ...wardrobe.map((item) => item.updatedAt), ...decisions.map((item) => item.updatedAt)]
    .filter(Boolean)
    .sort()
  const meta = getStateMeta(dates.at(-1) || new Date().toISOString())
  return {
    version: 1,
    revision: meta.revision,
    meta,
    memory,
    wardrobe,
    decisions,
    imageAssets: [],
    updatedAt: meta.updatedAt,
  }
}

export function replaceProductState(state) {
  if (!validateMemory(state?.memory)) return null
  const wardrobe = Array.isArray(state.wardrobe) ? state.wardrobe : []
  const decisions = Array.isArray(state.decisions) ? state.decisions : []
  const currentMeta = getStateMeta()
  const incomingMeta = normalizeStateMeta({ ...state.meta, revision: state.revision ?? state.meta?.revision }, state.updatedAt || new Date().toISOString())
  const meta = {
    ...incomingMeta,
    revision: Math.max(currentMeta.revision + 1, incomingMeta.revision),
    syncedRevision: null,
    remoteRevision: null,
    lastSyncedAt: null,
  }
  rawWriteJSON(KEYS.memory, state.memory)
  rawWriteJSON(KEYS.wardrobe, wardrobe)
  rawWriteJSON(KEYS.decisions, decisions)
  rawWriteJSON(KEYS.stateMeta, meta)
  dispatchStateChange({ key: 'productState', value: { memory: state.memory, wardrobe, decisions }, meta })
  return getProductState()
}

export function markProductStateSynced(remoteRevision, syncedRevision, syncedAt = new Date().toISOString()) {
  const current = getStateMeta()
  const next = {
    ...current,
    syncedRevision: Number.isFinite(Number(syncedRevision)) ? Number(syncedRevision) : current.revision,
    remoteRevision: Number.isFinite(Number(remoteRevision)) ? Number(remoteRevision) : current.remoteRevision,
    lastSyncedAt: syncedAt,
  }
  rawWriteJSON(KEYS.stateMeta, next)
  return next
}

export function migrateLegacyData() {
  const memory = getMemory()
  const wardrobe = getWardrobe()
  let decisions = getDecisions()
  if (!localStorage.getItem(KEYS.migrated)) {
    const legacy = readJSON('styleos.history', [])
    const purchaseRecords = Array.isArray(legacy) ? legacy.filter((item) => item.type === 'purchase' && item.data?.form && item.data?.result) : []
    purchaseRecords.forEach((item) => {
      const old = item.data.result
      saveDecision({
        id: `legacy-${item.id}`,
        product: { ...item.data.form, category: item.data.form.category || 'outerwear', fabric: item.data.form.fabric || '' },
        result: {
          verdict: old.verdict,
          totalScore: old.totalScore,
          dimensions: { styleFit: old.styleMatch, fitConfidence: 50, wardrobeCompatibility: old.versatility, useFrequency: old.versatility, budgetFit: old.budgetFit, duplicateRisk: old.duplicateRisk, idleRisk: old.idleRisk },
          gates: [], evidence: [], missing: ['fabric'], similarItems: [], whatChanges: ['addFabric'],
          memorySnapshot: { recordCount: memory.records.length, wardrobeCount: wardrobe.length, monthlyBudget: memory.profile.monthlyBudget },
        },
        status: 'advised',
        createdAt: item.createdAt,
      })
    })
    localStorage.setItem(KEYS.migrated, 'true')
    decisions = getDecisions()
  }
  return { memory, wardrobe, decisions }
}
