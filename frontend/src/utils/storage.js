const HISTORY_KEY = 'styleos.history'

function read() {
  try { const value = JSON.parse(localStorage.getItem(HISTORY_KEY)); return Array.isArray(value) ? value : [] } catch { return [] }
}

function write(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('styleos:history-change', { detail: items }))
  return items
}

export function listHistory() { return read().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) }

export function saveHistory(type, title, data, options = {}) {
  const items = read()
  const id = options.id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const existing = items.findIndex((item) => item.id === id)
  const record = { id, type, title, data, favorite: options.favorite ?? false, createdAt: options.createdAt || new Date().toISOString() }
  if (existing >= 0) items[existing] = { ...items[existing], ...record }
  else items.unshift(record)
  write(items.slice(0, 150))
  return record
}

export function removeHistory(id) { return write(read().filter((item) => item.id !== id)) }
export function clearHistory() { return write([]) }
export function toggleHistoryFavorite(id) { return write(read().map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item)) }
export function isHistorySaved(id) { return read().some((item) => item.id === id) }
