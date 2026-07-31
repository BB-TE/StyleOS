const SUPPORT_KEY = 'styleos.support.requests'

function readRequests() {
  try {
    const value = JSON.parse(localStorage.getItem(SUPPORT_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveLocalSupportRequest(input) {
  const request = {
    ...input,
    id: `local-support-${Date.now()}`,
    status: 'saved-locally',
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(SUPPORT_KEY, JSON.stringify([request, ...readRequests()].slice(0, 30)))
  return { ok: true, id: request.id, saved: 'local' }
}

export function listLocalSupportRequests() {
  return readRequests()
}
