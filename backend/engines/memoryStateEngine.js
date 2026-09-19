import { randomUUID } from 'node:crypto'

const clamp = (value, min = .05, max = .99) => Math.max(min, Math.min(max, value))

function recordId(domain, kind, value) {
  return `${domain}:${kind}:${String(value).toLowerCase().trim().replace(/\s+/g, '-')}`
}

function addMemoryEvidence(memory, evidence, now) {
  const id = evidence.id || recordId(evidence.domain, evidence.kind, evidence.value)
  const index = memory.records.findIndex((record) => record.id === id)
  if (index === -1) {
    memory.records.push({
      id,
      domain: evidence.domain,
      kind: evidence.kind,
      value: evidence.value,
      label: evidence.label || String(evidence.value),
      confidence: clamp(evidence.confidence ?? .4),
      evidenceCount: 1,
      sources: evidence.sources || [],
      confirmed: false,
      updatedAt: now,
    })
    return
  }
  const existing = memory.records[index]
  const delta = evidence.weight ?? .1
  memory.records[index] = {
    ...existing,
    // A failed* record represents confidence that the failure is real. Repeated
    // failures therefore strengthen that record just like repeated successes.
    confidence: clamp(existing.confidence + delta),
    evidenceCount: existing.evidenceCount + 1,
    sources: [...new Set([...existing.sources, ...(evidence.sources || [])])],
    updatedAt: now,
  }
}

export function createWardrobeItem(input = {}, now = new Date().toISOString()) {
  return {
    id: input.id || `wardrobe-${randomUUID()}`,
    name: input.name || 'Untitled item',
    category: input.category || 'tops',
    color: input.color || 'black',
    fit: input.fit || 'regular',
    scenes: Array.isArray(input.scenes) ? input.scenes : [],
    wearFrequency: input.wearFrequency || 'monthly',
    status: input.status || 'active',
    liked: input.liked !== false,
    notes: input.notes || '',
    imageAssetId: input.imageAssetId || '',
    sourceDecisionId: input.sourceDecisionId || '',
    createdAt: input.createdAt || now,
    updatedAt: now,
  }
}

export function createDecision(input = {}, now = new Date().toISOString()) {
  return {
    id: input.id || `decision-${randomUUID()}`,
    product: input.product || {},
    result: input.result || {},
    status: input.status || 'advised',
    outcome: input.outcome || null,
    engineVersion: input.engineVersion || 'memory-v2',
    memoryRevision: Number.isInteger(input.memoryRevision) ? input.memoryRevision : null,
    createdAt: input.createdAt || now,
    updatedAt: now,
  }
}

function retractDecisionEvidence(memory, decisionId, now) {
  const source = `decision:${decisionId}`
  memory.records = memory.records.flatMap((record) => {
    if (!(record.sources || []).includes(source)) return [record]
    if (record.evidenceCount <= 1) return []
    return [{ ...record, confidence: clamp(record.confidence - .1), evidenceCount: record.evidenceCount - 1, sources: record.sources.filter((item) => item !== source), updatedAt: now }]
  })
  memory.updatedAt = now
}

function normalizeOutcome(outcome, now) {
  return {
    satisfaction: Math.max(1, Math.min(5, Math.round(Number(outcome.satisfaction ?? 3)))),
    kept: outcome.kept,
    returned: outcome.returned,
    wearCount: Math.max(0, Math.round(Number(outcome.wearCount ?? 0))),
    returnReason: String(outcome.returnReason || '').slice(0, 600),
    note: String(outcome.note || '').slice(0, 600),
    submittedAt: now,
  }
}

function sameOutcome(left, right) {
  return left.satisfaction === right.satisfaction
    && left.kept === right.kept
    && left.returned === right.returned
    && left.wearCount === right.wearCount
    && left.returnReason === right.returnReason
    && left.note === right.note
}

export function applyOutcomeToState(state, decisionId, outcome, now = new Date().toISOString()) {
  const decision = state.decisions.find((item) => item.id === decisionId)
  if (!decision) return null

  const normalizedOutcome = normalizeOutcome(outcome, now)
  if (decision.outcome) {
    if (sameOutcome(decision.outcome, normalizedOutcome)) return { decision, changed: false }
    retractDecisionEvidence(state.memory, decisionId, now)
  }

  decision.outcome = normalizedOutcome
  decision.status = normalizedOutcome.returned ? 'returned' : 'kept'
  decision.updatedAt = now

  if (normalizedOutcome.kept && !normalizedOutcome.returned) {
    const existing = state.wardrobe.find((item) => item.sourceDecisionId === decision.id)
    const wardrobeItem = createWardrobeItem({
      ...existing,
      name: decision.product?.name,
      category: decision.product?.category,
      color: decision.product?.color,
      fit: decision.product?.fit,
      scenes: decision.product?.scenes,
      wearFrequency: normalizedOutcome.wearCount >= 4 ? 'weekly' : 'monthly',
      status: 'active',
      liked: normalizedOutcome.satisfaction >= 4,
      notes: normalizedOutcome.note,
      sourceDecisionId: decision.id,
    }, now)
    state.wardrobe = [wardrobeItem, ...state.wardrobe.filter((item) => item.sourceDecisionId !== decision.id && item.id !== wardrobeItem.id)]
  } else {
    state.wardrobe = state.wardrobe.filter((item) => item.sourceDecisionId !== decision.id)
  }

  const product = decision.product || {}
  const positive = normalizedOutcome.kept && normalizedOutcome.satisfaction >= 4
  const negative = normalizedOutcome.returned || !normalizedOutcome.kept || normalizedOutcome.satisfaction <= 2
  if (!positive && !negative) return { decision, changed: true }

  const sources = [`decision:${decision.id}`, `outcome:${positive ? 'positive' : 'negative'}`]
  if (product.color) addMemoryEvidence(state.memory, { domain: positive ? 'taste' : 'risk', kind: positive ? 'successfulColor' : 'failedColor', value: product.color, confidence: .42, weight: .12, sources }, now)
  if (product.fit) addMemoryEvidence(state.memory, { domain: positive ? 'fit' : 'risk', kind: positive ? 'successfulFit' : 'failedFit', value: product.fit, confidence: .45, weight: .14, sources }, now)
  if (product.category) addMemoryEvidence(state.memory, { domain: 'behavior', kind: positive ? 'successfulCategory' : 'failedCategory', value: product.category, confidence: .38, weight: .09, sources }, now)
  if (negative && normalizedOutcome.returnReason) addMemoryEvidence(state.memory, { domain: 'risk', kind: 'returnReason', value: normalizedOutcome.returnReason, confidence: .48, weight: .13, sources }, now)
  state.memory.updatedAt = now
  return { decision, changed: true }
}
