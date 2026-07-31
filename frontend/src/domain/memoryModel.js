export const MEMORY_VERSION = 2

export function createEmptyMemory(now = new Date().toISOString()) {
  return {
    version: MEMORY_VERSION,
    profile: {
      setupCompleted: false,
      monthlyBudget: 1200,
      scenes: [],
      expressionGoal: '',
    },
    records: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function memoryRecord({
  id,
  domain,
  kind,
  value,
  label,
  confidence = 0.35,
  evidenceCount = 1,
  sources = [],
  confirmed = false,
  updatedAt = new Date().toISOString(),
}) {
  return {
    id: id || `${domain}:${kind}:${String(value).toLowerCase().replace(/\s+/g, '-')}`,
    domain,
    kind,
    value,
    label: label || String(value),
    confidence: Math.max(0.05, Math.min(0.99, Number(confidence))),
    evidenceCount: Math.max(1, Number(evidenceCount)),
    sources: [...new Set(sources)],
    confirmed: Boolean(confirmed),
    updatedAt,
  }
}

export function seedMemoryFromProfile(profile = {}, report = null, now = new Date().toISOString()) {
  const memory = createEmptyMemory(now)
  memory.profile = {
    setupCompleted: Boolean(profile.styles?.length || profile.scenes?.length),
    monthlyBudget: Number(profile.monthlyBudget) || 1200,
    scenes: Array.isArray(profile.scenes) ? profile.scenes : [],
    expressionGoal: profile.expressionGoal || '',
  }

  const records = []
  const styleDNA = report?.styleDNA || (profile.styles || []).map((id, index) => ({ id, score: Math.max(12, 40 - index * 8) }))
  styleDNA.forEach((item) => records.push(memoryRecord({
    id: `taste:style:${item.id}`,
    domain: 'taste',
    kind: 'styleAffinity',
    value: item.id,
    label: item.id,
    confidence: Math.min(.72, .32 + Number(item.score || 0) / 100),
    sources: ['initial_setup'],
    updatedAt: now,
  })))

  memory.profile.scenes.forEach((scene) => records.push(memoryRecord({
    id: `context:scene:${scene}`,
    domain: 'context',
    kind: 'sceneNeed',
    value: scene,
    label: scene,
    confidence: .55,
    sources: ['initial_setup'],
    updatedAt: now,
  })))

  if (profile.dislikedElements?.trim()) {
    profile.dislikedElements.split(/[,，、]/).map((item) => item.trim()).filter(Boolean).forEach((value) => records.push(memoryRecord({
      domain: 'taste', kind: 'avoidElement', value, label: value, confidence: .68, sources: ['user_statement'], confirmed: true, updatedAt: now,
    })))
  }

  if (memory.profile.monthlyBudget) records.push(memoryRecord({
    id: 'behavior:budget:monthly', domain: 'behavior', kind: 'monthlyBudget', value: memory.profile.monthlyBudget, label: `¥${memory.profile.monthlyBudget}`, confidence: .98, sources: ['user_statement'], confirmed: true, updatedAt: now,
  }))

  memory.records = records
  return memory
}

export function validateMemory(memory) {
  return Boolean(memory && memory.version === MEMORY_VERSION && memory.profile && Array.isArray(memory.records))
}
