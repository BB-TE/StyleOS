import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzePurchaseWithMemory } from './decisionEngine.js'
import { applyDecisionOutcome, summarizeMemory } from './memoryEngine.js'
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
})

test('confirmed purchase outcome updates color and fit memory', () => {
  const memory = seedMemoryFromProfile({ styles: ['cleanFit'], monthlyBudget: 1200 })
  const decision = { id: 'd1', product: { category: 'outerwear', color: 'charcoal', fit: 'regular' } }
  const next = applyDecisionOutcome(memory, decision, { kept: true, satisfaction: 5 })
  assert.ok(next.records.some((record) => record.kind === 'successfulColor' && record.value === 'charcoal'))
  assert.ok(next.records.some((record) => record.kind === 'successfulFit' && record.value === 'regular'))
})
