import { seedMemoryFromProfile, validateMemory } from './memoryModel.js'

const KEYS = {
  memory: 'styleos.v2.memory',
  wardrobe: 'styleos.v2.wardrobe',
  decisions: 'styleos.v2.decisions',
  migrated: 'styleos.v2.migrated',
}

const readJSON = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback } catch { return fallback } }
const writeJSON = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('styleos:v2-change', { detail: { key, value } })); return value }
export const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function getMemory() {
  const current = readJSON(KEYS.memory, null)
  if (validateMemory(current)) return current
  const profile = readJSON('styleos.analysisDraft', {})
  const report = readJSON('styleos.latestReport', null)
  const seeded = seedMemoryFromProfile(profile, report)
  return writeJSON(KEYS.memory, seeded)
}

export function saveMemory(memory) { return writeJSON(KEYS.memory, memory) }
export function getWardrobe() { const items = readJSON(KEYS.wardrobe, []); return Array.isArray(items) ? items : [] }
export function saveWardrobeItem(input) {
  const items = getWardrobe()
  const item = { id: input.id || createId('wardrobe'), name: input.name, category: input.category || 'tops', color: input.color || 'black', fit: input.fit || 'regular', scenes: input.scenes || [], wearFrequency: input.wearFrequency || 'monthly', status: input.status || 'active', liked: input.liked ?? true, notes: input.notes || '', sourceDecisionId: input.sourceDecisionId || null, createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }
  const index = items.findIndex((current) => current.id === item.id)
  if (index >= 0) items[index] = { ...items[index], ...item }; else items.unshift(item)
  writeJSON(KEYS.wardrobe, items)
  return item
}
export function removeWardrobeItem(id) { return writeJSON(KEYS.wardrobe, getWardrobe().filter((item) => item.id !== id)) }

export function getDecisions() { const items = readJSON(KEYS.decisions, []); return Array.isArray(items) ? items : [] }
export function saveDecision(input) {
  const items = getDecisions()
  const decision = { id: input.id || createId('decision'), product: input.product, result: input.result, status: input.status || 'advised', outcome: input.outcome || null, createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }
  const index = items.findIndex((current) => current.id === decision.id)
  if (index >= 0) items[index] = { ...items[index], ...decision }; else items.unshift(decision)
  writeJSON(KEYS.decisions, items)
  return decision
}
export function removeDecision(id) { return writeJSON(KEYS.decisions, getDecisions().filter((item) => item.id !== id)) }

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
