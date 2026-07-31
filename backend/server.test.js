import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

process.env.NODE_ENV = 'test'

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
})

test('GET /api/health returns service status', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.service, 'styleos-api')
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
