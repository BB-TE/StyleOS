import assert from 'node:assert/strict'
import test from 'node:test'
import { createMemoryRepository } from './createMemoryRepository.js'

test('file memory is disabled by default for a public production configuration', () => {
  const result = createMemoryRepository({ persistenceMode: 'file', allowUnauthenticatedMemorySync: false, storagePath: 'unused.json' })
  assert.equal(result.enabled, false)
  assert.equal(result.repository, null)
})

test('file memory is available when explicitly allowed for development', () => {
  const result = createMemoryRepository({ persistenceMode: 'file', allowUnauthenticatedMemorySync: true, storagePath: 'unused.json' })
  assert.equal(result.enabled, true)
  assert.equal(result.persistence, 'server_file')
})

test('supabase mode fails instead of silently falling back to an ephemeral file', () => {
  assert.throws(
    () => createMemoryRepository({ persistenceMode: 'supabase', allowUnauthenticatedMemorySync: false, storagePath: 'unused.json' }),
    /authenticated Supabase repository/,
  )
})
