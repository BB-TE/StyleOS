import assert from 'node:assert/strict'
import test from 'node:test'
import { generateLocalStyleReport } from './localStyleReport.js'

const baseProfile = {
  styles: ['cleanFit', 'minimalJapanese', 'quietLuxury'],
  scenes: ['class', 'interview'],
  monthlyBudget: '1200',
}

test('the same profile produces the same local report', () => {
  assert.deepEqual(generateLocalStyleReport(baseProfile), generateLocalStyleReport(baseProfile))
})

test('different style preferences change the report result', () => {
  const cleanReport = generateLocalStyleReport(baseProfile)
  const darkReport = generateLocalStyleReport({ ...baseProfile, styles: ['darkStyle'] })

  assert.notDeepEqual(cleanReport.styleDNA, darkReport.styleDNA)
  assert.notDeepEqual(cleanReport.colorIds, darkReport.colorIds)
})

test('budget allocation follows the deterministic 50/30/20 rule', () => {
  const report = generateLocalStyleReport(baseProfile)
  assert.deepEqual(report.budgetPlan, {
    monthly: 1200,
    foundation: 600,
    upgrade: 360,
    experiment: 240,
  })
})
