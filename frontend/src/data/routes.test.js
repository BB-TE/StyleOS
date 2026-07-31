import assert from 'node:assert/strict'
import test from 'node:test'
import { routeById, routes } from './routes.js'

test('every product route has a unique id and path', () => {
  assert.equal(new Set(routes.map((route) => route.id)).size, routes.length)
  assert.equal(new Set(routes.map((route) => route.path)).size, routes.length)
})

test('the V1 route map includes all required product pages', () => {
  const requiredIds = [
    'home',
    'today',
    'analysis',
    'report',
    'wardrobe',
    'styles',
    'colorLab',
    'purchase',
    'history',
    'sampleReport',
  ]

  assert.deepEqual(Object.keys(routeById).sort(), requiredIds.sort())
})
