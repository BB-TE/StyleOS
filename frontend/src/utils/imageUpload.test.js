import assert from 'node:assert/strict'
import test from 'node:test'
import { IMAGE_MAX_BYTES, formatFileSize, validateImageFile } from './imageUpload.js'

test('accepts supported product images under 5MB', () => {
  assert.equal(validateImageFile({ type: 'image/jpeg', size: 1024 }).valid, true)
  assert.equal(validateImageFile({ type: 'image/png', size: IMAGE_MAX_BYTES }).valid, true)
  assert.equal(validateImageFile({ type: 'image/webp', size: 2048 }).valid, true)
})

test('rejects unsupported or oversized product images', () => {
  assert.equal(validateImageFile({ type: 'image/gif', size: 1024 }).valid, false)
  assert.equal(validateImageFile({ type: 'image/jpeg', size: IMAGE_MAX_BYTES + 1 }).valid, false)
  assert.equal(validateImageFile(null).valid, false)
})

test('formats image size for the upload preview', () => {
  assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.50 MB')
})
