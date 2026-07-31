const EVENT_KEY = 'styleos.analytics'

export function track(event, properties = {}) {
  try {
    const current = JSON.parse(localStorage.getItem(EVENT_KEY) || '[]')
    const events = Array.isArray(current) ? current : []
    events.push({ event, properties, timestamp: new Date().toISOString() })
    localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(-300)))
  } catch { /* Analytics must never block the product flow. */ }
}

export function getEvents() {
  try { return JSON.parse(localStorage.getItem(EVENT_KEY) || '[]') } catch { return [] }
}
