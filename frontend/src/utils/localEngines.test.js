import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeColorLocal, analyzePurchaseLocal } from './localEngines.js'

test('local color analysis is stable and reacts to high-saturation combinations', () => {
  const safe = { topColor: 'ivory', bottomColor: 'charcoal', outerColor: 'moss', shoesColor: 'black', styleId: 'cleanFit' }
  const bold = { ...safe, topColor: 'acid', bottomColor: 'burgundy', outerColor: 'denim' }
  assert.deepEqual(analyzeColorLocal(safe), analyzeColorLocal(safe))
  assert.notEqual(analyzeColorLocal(safe).harmonyScore, analyzeColorLocal(bold).harmonyScore)
})

test('local purchase analysis penalizes duplicate items', () => {
  const base = { name: 'jacket', price: 600, color: 'charcoal', styleKeywords: 'clean structured', scenes: ['commute', 'interview'], reason: 'wardrobe gap', monthlyBudget: 1500 }
  const low = analyzePurchaseLocal({ ...base, similarItems: 0 })
  const high = analyzePurchaseLocal({ ...base, similarItems: 4 })
  assert.ok(high.duplicateRisk > low.duplicateRisk)
  assert.ok(high.totalScore < low.totalScore)
})
