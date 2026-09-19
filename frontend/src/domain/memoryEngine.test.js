import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeMemoryPurchase } from '../../../backend/engines/memoryDecisionEngine.js'
import { analyzePurchaseWithMemory } from './decisionEngine.js'
import { applyDecisionOutcome, mergeSetupMemory, summarizeMemory } from './memoryEngine.js'
import { seedMemoryFromProfile } from './memoryModel.js'

test('initial setup creates low-to-medium confidence memory instead of a fixed identity', () => {
  const memory = seedMemoryFromProfile({ styles: ['cleanFit','minimalJapanese'], scenes: ['commute'], monthlyBudget: 1500 })
  const summary = summarizeMemory(memory)
  assert.equal(memory.profile.setupCompleted, true)
  assert.ok(summary.confidence < 80)
  assert.equal(summary.strongestStyles.length, 2)
})

test('purchase decision uses wardrobe duplication and changes verdict evidence', () => {
  const memory = seedMemoryFromProfile({ styles: ['cleanFit'], scenes: ['commute'], monthlyBudget: 1500 })
  const product = { name: 'charcoal jacket', category: 'outerwear', color: 'charcoal', fit: 'regular', fabric: 'wool blend', price: 700, scenes: ['commute'], styleKeywords: 'clean structured', reason: 'replace old jacket' }
  const wardrobe = Array.from({ length: 3 }, (_, index) => ({ id: `j${index}`, name: `existing ${index}`, category: 'outerwear', color: 'charcoal', fit: 'regular', scenes: ['commute'] }))
  const clean = analyzePurchaseWithMemory(product, memory, [])
  const duplicate = analyzePurchaseWithMemory(product, memory, wardrobe)
  assert.ok(duplicate.dimensions.duplicateRisk > clean.dimensions.duplicateRisk)
  assert.ok(duplicate.gates.some((gate) => gate.code === 'duplicateHardStop'))
  assert.ok(duplicate.reasons.some((reason) => reason.code === 'duplicateEvidence'))
})

test('purchase decision exposes existing pieces that can test the outfit', () => {
  const memory = seedMemoryFromProfile({ styles: ['cleanFit'], scenes: ['commute'], monthlyBudget: 1500 })
  const product = { name: 'charcoal jacket', category: 'outerwear', color: 'charcoal', fit: 'regular', price: 600, scenes: ['commute'], styleKeywords: 'clean' }
  const wardrobe = [
    { id: 'top-1', name: 'Ivory shirt', category: 'tops', color: 'ivory', fit: 'regular', scenes: ['commute'], status: 'active', liked: true },
    { id: 'bottom-1', name: 'Black trousers', category: 'bottoms', color: 'black', fit: 'straight', scenes: ['commute'], status: 'active', liked: true },
    { id: 'shoe-1', name: 'Retired shoes', category: 'shoes', color: 'black', scenes: ['commute'], status: 'retired' },
  ]
  const result = analyzePurchaseWithMemory(product, memory, wardrobe)
  assert.deepEqual(result.compatibleItems.map((item) => item.id), ['top-1', 'bottom-1'])
  assert.ok(result.dimensions.wardrobeCompatibility > analyzePurchaseWithMemory(product, memory, []).dimensions.wardrobeCompatibility)
})

test('purchase decision turns wardrobe pieces into complete outfit drafts and use value', () => {
  const memory = seedMemoryFromProfile({ styles: ['cleanFit'], scenes: ['commute'], monthlyBudget: 1500 })
  const product = { name: 'charcoal jacket', category: 'outerwear', color: 'charcoal', fit: 'regular', fabric: 'wool', price: 600, scenes: ['commute'], styleKeywords: '干净利落', reason: 'replace an old jacket' }
  const wardrobe = [
    { id: 'top-1', name: 'Ivory shirt', category: 'tops', color: 'ivory', fit: 'regular', scenes: ['commute'], status: 'active', liked: true, wearFrequency: 'weekly' },
    { id: 'bottom-1', name: 'Black trousers', category: 'bottoms', color: 'black', fit: 'straight', scenes: ['commute'], status: 'active', liked: true, wearFrequency: 'weekly' },
    { id: 'shoe-1', name: 'Black shoes', category: 'shoes', color: 'black', fit: 'regular', scenes: ['commute'], status: 'active', liked: true, wearFrequency: 'weekly' },
  ]
  const result = analyzePurchaseWithMemory(product, memory, wardrobe)
  assert.equal(result.outfitPlans[0].ready, true)
  assert.deepEqual(result.outfitPlans[0].missingCategories, [])
  assert.equal(result.usagePlan.completeOutfitCount, 1)
  assert.ok(result.usagePlan.costPerWear12m > 0)
  assert.ok(result.nextActions.length > 0)
})

test('real color and category outcomes affect the next decision while retired items do not create duplicates', () => {
  const base = seedMemoryFromProfile({ styles: ['cleanFit'], scenes: ['commute'], monthlyBudget: 1500 })
  const failed = {
    ...base,
    records: [
      ...base.records,
      { id: 'failed-black', domain: 'risk', kind: 'failedColor', value: 'black', label: 'black', confidence: .9, evidenceCount: 2, sources: ['decision:old'] },
      { id: 'failed-outerwear', domain: 'behavior', kind: 'failedCategory', value: 'outerwear', label: 'outerwear', confidence: .8, evidenceCount: 2, sources: ['decision:old'] },
    ],
  }
  const product = { name: 'black jacket', category: 'outerwear', color: 'black', fit: 'regular', fabric: 'wool', price: 500, scenes: ['commute'], styleKeywords: 'clean', reason: 'replace an old jacket' }
  const retired = Array.from({ length: 3 }, (_, index) => ({ id: `retired-${index}`, name: `Old jacket ${index}`, category: 'outerwear', color: 'black', fit: 'regular', scenes: ['commute'], status: 'retired' }))
  const baseline = analyzePurchaseWithMemory(product, base, [])
  const result = analyzePurchaseWithMemory(product, failed, retired)
  assert.ok(result.dimensions.styleFit < baseline.dimensions.styleFit)
  assert.equal(result.dimensions.duplicateRisk, 0)
  assert.ok(result.reasons.some((reason) => reason.code === 'colorHistoryConflict'))
  assert.ok(Number.isFinite(result.totalScore))
})

test('local fallback and backend purchase engines keep the same decision contract', () => {
  const memory = seedMemoryFromProfile({ styles: ['cleanFit'], scenes: ['commute'], monthlyBudget: 1500 })
  const product = { name: 'charcoal jacket', category: 'outerwear', color: 'charcoal', fit: 'regular', fabric: 'wool', price: 600, scenes: ['commute'], styleKeywords: 'clean structured', reason: 'replace a worn jacket' }
  const wardrobe = [
    { id: 'top-1', name: 'Ivory shirt', category: 'tops', color: 'ivory', fit: 'regular', scenes: ['commute'], status: 'active', liked: true, wearFrequency: 'weekly' },
    { id: 'bottom-1', name: 'Black trousers', category: 'bottoms', color: 'black', fit: 'straight', scenes: ['commute'], status: 'active', liked: true, wearFrequency: 'weekly' },
  ]
  assert.deepEqual(analyzePurchaseWithMemory(product, memory, wardrobe), analyzeMemoryPurchase(product, memory, wardrobe))
})

test('confirmed purchase outcome updates color and fit memory', () => {
  const memory = seedMemoryFromProfile({ styles: ['cleanFit'], monthlyBudget: 1200 })
  const decision = { id: 'd1', product: { category: 'outerwear', color: 'charcoal', fit: 'regular' } }
  const next = applyDecisionOutcome(memory, decision, { kept: true, satisfaction: 5 })
  assert.ok(next.records.some((record) => record.kind === 'successfulColor' && record.value === 'charcoal'))
  assert.ok(next.records.some((record) => record.kind === 'successfulFit' && record.value === 'regular'))
})

test('replaying the same local outcome does not count the same decision twice', () => {
  const memory = seedMemoryFromProfile({ styles: ['cleanFit'], monthlyBudget: 1200 })
  const decision = { id: 'same-decision', product: { category: 'outerwear', color: 'black', fit: 'regular' } }
  const once = applyDecisionOutcome(memory, decision, { kept: true, satisfaction: 5 })
  const twice = applyDecisionOutcome(once, decision, { kept: true, satisfaction: 5 })
  const record = twice.records.find((item) => item.kind === 'successfulFit' && item.value === 'regular')
  assert.equal(record.evidenceCount, 1)
})

test('re-running setup replaces setup answers without deleting learned outcomes', () => {
  const initial = seedMemoryFromProfile({ styles: ['cleanFit'], scenes: ['class'], monthlyBudget: 1200 })
  const learned = applyDecisionOutcome(initial, { id: 'kept-1', product: { category: 'outerwear', color: 'charcoal', fit: 'regular' } }, { kept: true, returned: false, satisfaction: 5 })
  const nextSetup = seedMemoryFromProfile({ styles: ['minimalJapanese'], scenes: ['commute'], monthlyBudget: 1600 })
  const merged = mergeSetupMemory(learned, nextSetup)
  assert.ok(merged.records.some((record) => record.kind === 'successfulColor' && record.value === 'charcoal'))
  assert.ok(merged.records.some((record) => record.kind === 'styleAffinity' && record.value === 'minimalJapanese'))
  assert.ok(!merged.records.some((record) => record.kind === 'styleAffinity' && record.value === 'cleanFit'))
  assert.equal(merged.profile.monthlyBudget, 1600)
})
