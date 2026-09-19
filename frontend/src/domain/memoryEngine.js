import { memoryRecord } from './memoryModel.js'

const clamp = (value, min = .05, max = .99) => Math.max(min, Math.min(max, value))

export function upsertMemoryEvidence(memory, evidence, now = new Date().toISOString()) {
  const next = structuredClone(memory)
  const id = evidence.id || `${evidence.domain}:${evidence.kind}:${String(evidence.value).toLowerCase().replace(/\s+/g, '-')}`
  const index = next.records.findIndex((record) => record.id === id)
  if (index < 0) {
    next.records.push(memoryRecord({ ...evidence, id, updatedAt: now }))
  } else {
    const current = next.records[index]
    const decisionSources = (evidence.sources || []).filter((source) => source.startsWith('decision:'))
    if (decisionSources.some((source) => current.sources.includes(source))) return next
    const positive = evidence.direction !== 'negative'
    const delta = evidence.weight ?? .1
    next.records[index] = {
      ...current,
      label: evidence.label || current.label,
      confidence: clamp(current.confidence + (positive ? delta : -delta)),
      evidenceCount: current.evidenceCount + 1,
      sources: [...new Set([...current.sources, ...(evidence.sources || [])])],
      updatedAt: now,
    }
  }
  next.updatedAt = now
  return next
}

export function applyDecisionOutcome(memory, decision, outcome, now = new Date().toISOString()) {
  let next = structuredClone(memory)
  const product = decision.product
  const positive = outcome.kept === true && Number(outcome.satisfaction || 0) >= 4
  const negative = outcome.kept === false || outcome.returned === true || Number(outcome.satisfaction || 0) <= 2
  if (!positive && !negative) return next

  const direction = positive ? 'positive' : 'negative'
  const source = [`decision:${decision.id}`, `outcome:${direction}`]
  if (product.color) next = upsertMemoryEvidence(next, { domain: positive ? 'taste' : 'risk', kind: positive ? 'successfulColor' : 'failedColor', value: product.color, label: product.color, confidence: .42, weight: .12, sources: source }, now)
  if (product.fit) next = upsertMemoryEvidence(next, { domain: positive ? 'fit' : 'risk', kind: positive ? 'successfulFit' : 'failedFit', value: product.fit, label: product.fit, confidence: .45, weight: .14, sources: source }, now)
  if (product.category) next = upsertMemoryEvidence(next, { domain: 'behavior', kind: positive ? 'successfulCategory' : 'failedCategory', value: product.category, label: product.category, confidence: .38, weight: .09, sources: source }, now)
  if (negative && outcome.returnReason) next = upsertMemoryEvidence(next, { domain: 'risk', kind: 'returnReason', value: outcome.returnReason, label: outcome.returnReason, confidence: .48, weight: .13, sources: source }, now)
  return next
}

export function confirmMemoryRecord(memory, id, now = new Date().toISOString()) {
  return { ...memory, updatedAt: now, records: memory.records.map((record) => record.id === id ? { ...record, confirmed: true, confidence: clamp(record.confidence + .18), updatedAt: now } : record) }
}

export function removeMemoryRecord(memory, id, now = new Date().toISOString()) {
  return { ...memory, updatedAt: now, records: memory.records.filter((record) => record.id !== id) }
}

const setupManagedKinds = new Set(['styleAffinity', 'sceneNeed', 'avoidElement', 'monthlyBudget', 'successfulItem', 'returnReason'])

function isSetupManagedRecord(record) {
  const sources = Array.isArray(record.sources) ? record.sources : []
  return setupManagedKinds.has(record.kind)
    && sources.length > 0
    && sources.every((source) => source === 'initial_setup' || source === 'user_statement')
}

export function mergeSetupMemory(existing, nextSetup, now = new Date().toISOString()) {
  if (!existing?.records?.length) return { ...nextSetup, createdAt: existing?.createdAt || nextSetup.createdAt, updatedAt: now }
  const records = new Map(existing.records.filter((record) => !isSetupManagedRecord(record)).map((record) => [record.id, record]))
  nextSetup.records.forEach((record) => {
    const historical = records.get(record.id)
    records.set(record.id, historical
      ? { ...historical, ...record, confidence: Math.max(historical.confidence, record.confidence), evidenceCount: Math.max(historical.evidenceCount, record.evidenceCount), sources: [...new Set([...(historical.sources || []), ...(record.sources || [])])], updatedAt: now }
      : { ...record, updatedAt: now })
  })
  return {
    ...existing,
    version: nextSetup.version,
    profile: nextSetup.profile,
    records: [...records.values()],
    createdAt: existing.createdAt || nextSetup.createdAt,
    updatedAt: now,
  }
}

export function retractDecisionEvidence(memory, decisionId, now = new Date().toISOString()) {
  const source = `decision:${decisionId}`
  const records = memory.records.flatMap((record) => {
    if (!(record.sources || []).includes(source)) return [record]
    if (record.evidenceCount <= 1) return []
    return [{
      ...record,
      confidence: clamp(record.confidence - .1),
      evidenceCount: record.evidenceCount - 1,
      sources: record.sources.filter((item) => item !== source),
      updatedAt: now,
    }]
  })
  return { ...memory, records, updatedAt: now }
}

export function summarizeMemory(memory) {
  const records = [...memory.records]
  const confidence = records.length ? Math.round(records.reduce((sum, record) => sum + record.confidence, 0) / records.length * 100) : 0
  const byDomain = Object.groupBy ? Object.groupBy(records, (record) => record.domain) : records.reduce((groups, record) => ({ ...groups, [record.domain]: [...(groups[record.domain] || []), record] }), {})
  const strongestStyles = records.filter((record) => record.kind === 'styleAffinity').sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  const successfulColors = records.filter((record) => record.kind === 'successfulColor').sort((a, b) => b.confidence - a.confidence)
  const fitRisks = records.filter((record) => record.kind === 'failedFit' || record.kind === 'returnReason').sort((a, b) => b.confidence - a.confidence)
  return { confidence, recordCount: records.length, byDomain, strongestStyles, successfulColors, fitRisks, updatedAt: memory.updatedAt }
}
