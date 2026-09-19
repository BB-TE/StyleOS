import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rm } from 'node:fs/promises'

process.env.NODE_ENV = 'test'
process.env.STYLEOS_STORAGE_PATH = join(tmpdir(), `styleos-memory-${process.pid}.json`)

const { app } = await import('./server.js')

let server
let baseUrl

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address()
      baseUrl = `http://127.0.0.1:${address.port}`
      resolve()
    })
  })
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await rm(process.env.STYLEOS_STORAGE_PATH, { force: true })
})

const memoryHeaders = (ownerId = `test-owner-${randomUUID()}`) => ({
  'content-type': 'application/json',
  'x-styleos-owner': ownerId,
})

const stateFixture = (overrides = {}) => ({
  version: 1,
  revision: 0,
  memory: { version: 2, profile: { setupCompleted: false, monthlyBudget: 1200, scenes: [], expressionGoal: '' }, records: [], ...overrides.memory },
  wardrobe: overrides.wardrobe || [],
  decisions: overrides.decisions || [],
  imageAssets: overrides.imageAssets || [],
  updatedAt: overrides.updatedAt || new Date(0).toISOString(),
})

test('GET /api/health returns service status', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.service, 'styleos-api')
  assert.equal(body.memorySync, 'development_only')
  assert.equal(body.persistence, 'server_file')
})

test('unknown API routes return a structured 404', async () => {
  const response = await fetch(`${baseUrl}/api/not-created-yet`)
  const body = await response.json()

  assert.equal(response.status, 404)
  assert.equal(body.error, 'not_found')
})

test('style library exposes the V1 knowledge base', async () => {
  const response = await fetch(`${baseUrl}/api/style-library`)
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.styleTaxonomy.length, 8)
  assert.equal(body.clothingItems.length, 60)
  assert.equal(body.colorRules.length, 40)
  assert.equal(body.outfitExamples.length, 48)
})

test('color analysis is deterministic', async () => {
  const input = { topColor: 'ivory', bottomColor: 'charcoal', outerColor: 'moss', shoesColor: 'black', styleId: 'cleanFit' }
  const responses = await Promise.all([1, 2].map(() => fetch(`${baseUrl}/api/analyze-color`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }).then((result) => result.json())))
  assert.deepEqual(responses[0], responses[1])
  assert.equal(typeof responses[0].harmonyScore, 'number')
})

test('purchase analysis changes when duplication risk changes', async () => {
  const analyze = (similarItems) => fetch(`${baseUrl}/api/analyze-purchase`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ purchaseInput: { name: 'jacket', price: 800, color: 'charcoal', styleKeywords: 'clean structured', scenes: ['commute','interview'], similarItems, reason: 'wardrobe gap', monthlyBudget: 1500 } }) }).then((result) => result.json())
  const [low, high] = await Promise.all([analyze(0), analyze(4)])
  assert.ok(high.duplicateRisk > low.duplicateRisk)
  assert.ok(high.totalScore < low.totalScore)
})

test('V2 purchase analysis reads memory and wardrobe evidence', async () => {
  const product = { name: 'charcoal jacket', category: 'outerwear', color: 'charcoal', fit: 'regular', fabric: 'wool', price: 700, scenes: ['commute'], styleKeywords: 'clean structured', reason: 'replace old jacket' }
  const memory = { profile: { monthlyBudget: 1500 }, records: [{ id:'s1', domain:'taste', kind:'styleAffinity', value:'cleanFit', confidence:.7, evidenceCount:2, sources:['setup'] }] }
  const wardrobe = Array.from({ length: 3 }, (_, index) => ({ id:`w${index}`, name:`jacket ${index}`, category:'outerwear', color:'charcoal', fit:'regular', scenes:['commute'] }))
  const response = await fetch(`${baseUrl}/api/analyze-purchase-v2`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ product, memory, wardrobe }) })
  const body = await response.json()
  assert.equal(body.memorySnapshot.wardrobeCount, 3)
  assert.ok(body.gates.some((gate) => gate.code === 'duplicateHardStop'))
  assert.ok(body.reasons.some((reason) => reason.code === 'duplicateEvidence'))
  assert.ok(Array.isArray(body.compatibleItems))
})

test('V2 purchase analysis rejects malformed products instead of returning a misleading buy verdict', async () => {
  const response = await fetch(`${baseUrl}/api/analyze-purchase-v2`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ product: { name:'bad jacket', category:'outerwear', color:'black', fit:'regular', price:'bad', scenes:['commute'], reason:'test' }, memory:{}, wardrobe:[] }) })
  const body = await response.json()
  assert.equal(response.status, 400)
  assert.equal(body.error, 'invalid_input')
})

test('retired wardrobe items do not trigger duplicate risk and learned color failures change the result', async () => {
  const product = { name:'black jacket', category:'outerwear', color:'black', fit:'regular', fabric:'wool', price:500, scenes:['commute'], styleKeywords:'clean', reason:'replace old jacket' }
  const baseMemory = { profile:{ monthlyBudget:1500 }, records:[{ id:'style', domain:'taste', kind:'styleAffinity', value:'cleanFit', confidence:.7, evidenceCount:1, sources:['setup'] }] }
  const failedMemory = { ...baseMemory, records:[...baseMemory.records, { id:'failed-black', domain:'risk', kind:'failedColor', value:'black', confidence:.9, evidenceCount:2, sources:['decision:old'] }] }
  const retired = Array.from({ length:3 }, (_, index) => ({ id:`old-${index}`, name:`Old ${index}`, category:'outerwear', color:'black', fit:'regular', scenes:['commute'], status:'retired' }))
  const analyze = (memory, wardrobe) => fetch(`${baseUrl}/api/analyze-purchase-v2`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ product, memory, wardrobe }) }).then((response) => response.json())
  const [baseline, learned] = await Promise.all([analyze(baseMemory, []), analyze(failedMemory, retired)])
  assert.ok(learned.dimensions.styleFit < baseline.dimensions.styleFit)
  assert.equal(learned.dimensions.duplicateRisk, 0)
  assert.ok(learned.reasons.some((reason) => reason.code === 'colorHistoryConflict'))
})

test('support endpoint validates and accepts a customer request', async () => {
  const invalid = await fetch(`${baseUrl}/api/support`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ category:'other', message:'short' }) })
  assert.equal(invalid.status, 400)

  const response = await fetch(`${baseUrl}/api/support`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ category:'feature', message:'The purchase result panel is difficult to understand.' }) })
  const body = await response.json()
  assert.equal(response.status, 201)
  assert.equal(body.ok, true)
  assert.match(body.id, /^support-/)
})

test('memory API persists a state snapshot for one owner', async () => {
  const ownerId = `test-owner-${randomUUID()}`
  const headers = memoryHeaders(ownerId)
  const initial = await fetch(`${baseUrl}/api/memory/state`, { headers })
  const initialBody = await initial.json()
  assert.equal(initial.status, 200)
  assert.equal(initialBody.state.wardrobe.length, 0)

  const state = stateFixture({
    memory: { profile: { setupCompleted: true, monthlyBudget: 1800, scenes: ['commute'], expressionGoal: 'refined' }, records: [{ id: 'taste:style:cleanFit', domain: 'taste', kind: 'styleAffinity', value: 'cleanFit', label: 'Clean Fit', confidence: .7, evidenceCount: 1, sources: ['setup'], confirmed: true }] },
    wardrobe: [{ id: 'w-1', name: 'Charcoal trousers', category: 'bottoms', color: 'charcoal', fit: 'straight', scenes: ['commute'] }],
  })
  const saved = await fetch(`${baseUrl}/api/memory/state`, { method: 'PUT', headers, body: JSON.stringify({ state, expectedRevision: initialBody.revision }) })
  const savedBody = await saved.json()
  assert.equal(saved.status, 200)
  assert.equal(savedBody.revision, 1)
  assert.equal(savedBody.state.memory.profile.monthlyBudget, 1800)

  const reloaded = await fetch(`${baseUrl}/api/memory/state`, { headers })
  const reloadedBody = await reloaded.json()
  assert.equal(reloadedBody.state.wardrobe[0].name, 'Charcoal trousers')
  assert.equal(reloadedBody.state.memory.records[0].value, 'cleanFit')
})

test('memory API requires a development owner identifier', async () => {
  const response = await fetch(`${baseUrl}/api/memory/state`)
  const body = await response.json()
  assert.equal(response.status, 400)
  assert.equal(body.error, 'owner_required')
})

test('memory API rejects malformed and stale state snapshots without overwriting data', async () => {
  const headers = memoryHeaders()
  const initial = await fetch(`${baseUrl}/api/memory/state`, { headers }).then((response) => response.json())
  const firstState = stateFixture({ wardrobe: [{ id: 'kept', name: 'Kept item', category: 'tops', color: 'ivory', fit: 'regular' }] })
  const first = await fetch(`${baseUrl}/api/memory/state`, { method: 'PUT', headers, body: JSON.stringify({ state: firstState, expectedRevision: initial.revision }) })
  const firstBody = await first.json()
  assert.equal(first.status, 200)

  const malformed = await fetch(`${baseUrl}/api/memory/state`, { method: 'PUT', headers, body: JSON.stringify({ state: {}, expectedRevision: firstBody.revision }) })
  assert.equal(malformed.status, 400)

  const stale = await fetch(`${baseUrl}/api/memory/state`, { method: 'PUT', headers, body: JSON.stringify({ state: stateFixture(), expectedRevision: initial.revision }) })
  const staleBody = await stale.json()
  assert.equal(stale.status, 409)
  assert.equal(staleBody.currentRevision, firstBody.revision)

  const reloaded = await fetch(`${baseUrl}/api/memory/state`, { headers }).then((response) => response.json())
  assert.equal(reloaded.state.wardrobe[0].id, 'kept')
})

test('memory API isolates owners and lets an owner delete its development snapshot', async () => {
  const firstHeaders = memoryHeaders()
  const secondHeaders = memoryHeaders()
  const initial = await fetch(`${baseUrl}/api/memory/state`, { headers: firstHeaders }).then((response) => response.json())
  const saved = await fetch(`${baseUrl}/api/memory/state`, { method: 'PUT', headers: firstHeaders, body: JSON.stringify({ state: stateFixture({ wardrobe: [{ id: 'private', name: 'Private item' }] }), expectedRevision: initial.revision }) })
  assert.equal(saved.status, 200)

  const other = await fetch(`${baseUrl}/api/memory/state`, { headers: secondHeaders }).then((response) => response.json())
  assert.equal(other.state.wardrobe.length, 0)

  const deleted = await fetch(`${baseUrl}/api/memory/state`, { method: 'DELETE', headers: firstHeaders }).then((response) => response.json())
  assert.equal(deleted.deleted, true)
  const afterDelete = await fetch(`${baseUrl}/api/memory/state`, { headers: firstHeaders }).then((response) => response.json())
  assert.equal(afterDelete.state.wardrobe.length, 0)
  assert.equal(afterDelete.revision, 0)
})

test('memory API turns a recorded outcome into server-side memory evidence', async () => {
  const ownerId = `test-owner-${randomUUID()}`
  const headers = memoryHeaders(ownerId)
  const decisionInput = { decision: { id: 'decision-outcome', product: { name: 'Black wool jacket', category: 'outerwear', color: 'black', fit: 'regular', scenes: ['commute'] }, result: { verdict: 'buy' }, status: 'purchased' } }
  const created = await fetch(`${baseUrl}/api/memory/decisions`, { method: 'POST', headers, body: JSON.stringify(decisionInput) })
  assert.equal(created.status, 201)

  const outcome = await fetch(`${baseUrl}/api/memory/decisions/decision-outcome/outcome`, { method: 'POST', headers, body: JSON.stringify({ outcome: { kept: true, returned: false, satisfaction: 5, wearCount: 6 } }) })
  const body = await outcome.json()
  assert.equal(outcome.status, 200)
  assert.equal(body.decision.status, 'kept')
  assert.ok(body.state.memory.records.some((record) => record.kind === 'successfulColor' && record.value === 'black'))
  assert.equal(body.state.wardrobe.filter((item) => item.sourceDecisionId === 'decision-outcome').length, 1)

  const repeated = await fetch(`${baseUrl}/api/memory/decisions/decision-outcome/outcome`, { method: 'POST', headers, body: JSON.stringify({ outcome: { kept: true, returned: false, satisfaction: 5, wearCount: 6 } }) })
  const repeatedBody = await repeated.json()
  assert.equal(repeated.status, 200)
  assert.equal(repeatedBody.idempotent, true)
  assert.equal(repeatedBody.state.memory.records.find((record) => record.kind === 'successfulColor').evidenceCount, 1)
  assert.equal(repeatedBody.state.wardrobe.filter((item) => item.sourceDecisionId === 'decision-outcome').length, 1)

  const changed = await fetch(`${baseUrl}/api/memory/decisions/decision-outcome/outcome`, { method: 'POST', headers, body: JSON.stringify({ outcome: { kept: false, returned: true, satisfaction: 1, wearCount: 0 } }) })
  const changedBody = await changed.json()
  assert.equal(changed.status, 200)
  assert.equal(changedBody.decision.status, 'returned')
  assert.ok(!changedBody.state.memory.records.some((record) => record.kind === 'successfulColor' && record.value === 'black'))
  assert.ok(changedBody.state.memory.records.some((record) => record.kind === 'failedColor' && record.value === 'black'))
  assert.equal(changedBody.state.wardrobe.filter((item) => item.sourceDecisionId === 'decision-outcome').length, 0)
})

test('memory decision-check reads and saves one owner revision atomically', async () => {
  const headers = memoryHeaders()
  const initial = await fetch(`${baseUrl}/api/memory/state`, { headers }).then((response) => response.json())
  const product = { name:'Charcoal jacket', category:'outerwear', color:'charcoal', fit:'regular', fabric:'wool', price:550, scenes:['commute'], styleKeywords:'clean', reason:'replace worn jacket' }
  const checked = await fetch(`${baseUrl}/api/memory/decision-check`, { method:'POST', headers, body:JSON.stringify({ product, expectedRevision:initial.revision }) })
  const checkedBody = await checked.json()
  assert.equal(checked.status, 201)
  assert.equal(checkedBody.revision, initial.revision + 1)
  assert.equal(checkedBody.decision.product.name, product.name)
  assert.equal(checkedBody.decision.engineVersion, 'memory-v2.1')
  assert.equal(checkedBody.decision.memoryRevision, initial.revision)
  assert.ok(checkedBody.decision.result.nextActions.length > 0)

  const stale = await fetch(`${baseUrl}/api/memory/decision-check`, { method:'POST', headers, body:JSON.stringify({ product, expectedRevision:initial.revision }) })
  assert.equal(stale.status, 409)
})

test('separate failed outcomes strengthen failure evidence and reject contradictory flags', async () => {
  const headers = memoryHeaders()
  const createDecision = (id) => fetch(`${baseUrl}/api/memory/decisions`, { method: 'POST', headers, body: JSON.stringify({ decision: { id, product: { name: 'Oversized coat', category: 'outerwear', color: 'black', fit: 'oversized' }, result: { verdict: 'caution' }, status: 'purchased' } }) })
  await createDecision('failure-one')
  await createDecision('failure-two')

  const contradictory = await fetch(`${baseUrl}/api/memory/decisions/failure-one/outcome`, { method: 'POST', headers, body: JSON.stringify({ outcome: { kept: true, returned: true, satisfaction: 2 } }) })
  assert.equal(contradictory.status, 400)

  const submitFailure = (id) => fetch(`${baseUrl}/api/memory/decisions/${id}/outcome`, { method: 'POST', headers, body: JSON.stringify({ outcome: { kept: false, returned: true, satisfaction: 1, wearCount: 0, returnReason: 'Too much volume' } }) }).then((response) => response.json())
  const first = await submitFailure('failure-one')
  const firstConfidence = first.state.memory.records.find((record) => record.kind === 'failedFit').confidence
  const second = await submitFailure('failure-two')
  const failedFit = second.state.memory.records.find((record) => record.kind === 'failedFit')
  assert.ok(failedFit.confidence > firstConfidence)
  assert.equal(failedFit.evidenceCount, 2)
})
