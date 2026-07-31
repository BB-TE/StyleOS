import assert from 'node:assert/strict'
import test from 'node:test'
import { routes } from './routes.js'
import { supportedLanguages, translate, translations } from './i18n.js'

function flattenKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof child === 'string' ? [path] : flattenKeys(child, path)
  })
}

test('Chinese and English dictionaries contain the same keys', () => {
  const chineseKeys = flattenKeys(translations.zh).sort()
  const englishKeys = flattenKeys(translations.en).sort()
  assert.deepEqual(chineseKeys, englishKeys)
})

test('every route has complete translated page metadata', () => {
  for (const language of supportedLanguages) {
    for (const route of routes) {
      for (const field of ['label', 'eyebrow', 'title', 'description']) {
        const key = `${route.copyKey}.${field}`
        assert.notEqual(translate(language, key), key)
      }
    }
  }
})

test('unknown translation keys fail visibly instead of rendering empty text', () => {
  assert.equal(translate('zh', 'missing.copy'), 'missing.copy')
})
