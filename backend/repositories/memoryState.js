const MAX_RECORDS = 300
const MAX_WARDROBE_ITEMS = 500
const MAX_DECISIONS = 500

const asString = (value, fallback = '') => typeof value === 'string' ? value.trim().slice(0, 600) : fallback
const asNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const asArray = (value, limit) => Array.isArray(value) ? value.slice(0, limit) : []
const uniqueStrings = (value, limit = 30) => [...new Set(asArray(value, limit).map((item) => asString(item, '')).filter(Boolean))]

export function createEmptyMemory(now = new Date().toISOString()) {
  return {
    version: 2,
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

export function createEmptyState(now = new Date().toISOString()) {
  return {
    version: 1,
    revision: 0,
    memory: createEmptyMemory(now),
    wardrobe: [],
    decisions: [],
    imageAssets: [],
    updatedAt: now,
  }
}

function normalizeMemoryRecord(record, now) {
  return {
    id: asString(record?.id, ''),
    domain: asString(record?.domain, 'taste'),
    kind: asString(record?.kind, 'unknown'),
    value: asString(record?.value, ''),
    label: asString(record?.label, asString(record?.value, '')),
    confidence: Math.max(.05, Math.min(.99, asNumber(record?.confidence, .35))),
    evidenceCount: Math.max(1, Math.min(999, Math.round(asNumber(record?.evidenceCount, 1)))),
    sources: uniqueStrings(record?.sources),
    confirmed: Boolean(record?.confirmed),
    updatedAt: asString(record?.updatedAt, now),
  }
}

function normalizeMemory(memory, now) {
  const fallback = createEmptyMemory(now)
  const profile = memory?.profile || {}
  return {
    version: 2,
    profile: {
      setupCompleted: Boolean(profile.setupCompleted),
      monthlyBudget: Math.max(0, Math.min(1_000_000, asNumber(profile.monthlyBudget, fallback.profile.monthlyBudget))),
      scenes: uniqueStrings(profile.scenes),
      expressionGoal: asString(profile.expressionGoal, ''),
    },
    records: asArray(memory?.records, MAX_RECORDS)
      .map((record) => normalizeMemoryRecord(record, now))
      .filter((record) => record.id && record.value),
    createdAt: asString(memory?.createdAt, fallback.createdAt),
    updatedAt: asString(memory?.updatedAt, now),
  }
}

function normalizeWardrobeItem(item, now) {
  return {
    id: asString(item?.id, ''),
    name: asString(item?.name, 'Untitled item'),
    category: asString(item?.category, 'tops'),
    color: asString(item?.color, 'black'),
    fit: asString(item?.fit, 'regular'),
    scenes: uniqueStrings(item?.scenes),
    wearFrequency: asString(item?.wearFrequency, 'monthly'),
    status: asString(item?.status, 'active'),
    liked: item?.liked !== false,
    notes: asString(item?.notes, ''),
    imageAssetId: asString(item?.imageAssetId, ''),
    sourceDecisionId: asString(item?.sourceDecisionId, ''),
    createdAt: asString(item?.createdAt, now),
    updatedAt: asString(item?.updatedAt, now),
  }
}

function normalizeOutcome(outcome) {
  if (!outcome || typeof outcome !== 'object') return null
  return {
    satisfaction: Math.max(1, Math.min(5, Math.round(asNumber(outcome.satisfaction, 3)))),
    kept: Boolean(outcome.kept),
    returned: Boolean(outcome.returned),
    wearCount: Math.max(0, Math.min(10_000, Math.round(asNumber(outcome.wearCount, 0)))),
    returnReason: asString(outcome.returnReason, ''),
    note: asString(outcome.note, ''),
    submittedAt: asString(outcome.submittedAt, new Date().toISOString()),
  }
}

function normalizeDecision(decision, now) {
  const product = decision?.product || {}
  return {
    id: asString(decision?.id, ''),
    product: {
      name: asString(product.name, 'Untitled product'),
      category: asString(product.category, 'outerwear'),
      price: Math.max(0, Math.min(1_000_000, asNumber(product.price, 0))),
      color: asString(product.color, 'black'),
      fit: asString(product.fit, 'regular'),
      fabric: asString(product.fabric, ''),
      styleKeywords: asString(product.styleKeywords, ''),
      scenes: uniqueStrings(product.scenes),
      reason: asString(product.reason, ''),
      imageAssetId: asString(product.imageAssetId, ''),
    },
    result: decision?.result && typeof decision.result === 'object' ? structuredClone(decision.result) : {},
    status: asString(decision?.status, 'advised'),
    outcome: normalizeOutcome(decision?.outcome),
    engineVersion: asString(decision?.engineVersion, 'memory-v2'),
    memoryRevision: decision?.memoryRevision === null || decision?.memoryRevision === undefined ? null : Math.max(0, Math.round(asNumber(decision.memoryRevision, 0))),
    createdAt: asString(decision?.createdAt, now),
    updatedAt: asString(decision?.updatedAt, now),
  }
}

export function normalizeMemoryState(input, now = new Date().toISOString()) {
  const empty = createEmptyState(now)
  const state = input && typeof input === 'object' ? input : {}
  return {
    version: 1,
    revision: Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.round(asNumber(state.revision, 0)))),
    memory: normalizeMemory(state.memory, now),
    wardrobe: asArray(state.wardrobe, MAX_WARDROBE_ITEMS)
      .map((item) => normalizeWardrobeItem(item, now))
      .filter((item) => item.id),
    decisions: asArray(state.decisions, MAX_DECISIONS)
      .map((decision) => normalizeDecision(decision, now))
      .filter((decision) => decision.id),
    imageAssets: asArray(state.imageAssets, 200).map((asset) => ({
      id: asString(asset?.id, ''),
      kind: asString(asset?.kind, 'product'),
      status: asString(asset?.status, 'local_only'),
      createdAt: asString(asset?.createdAt, now),
    })).filter((asset) => asset.id),
    updatedAt: asString(state.updatedAt, empty.updatedAt),
  }
}

export function hasMeaningfulMemory(state) {
  return Boolean(state?.memory?.records?.length || state?.wardrobe?.length || state?.decisions?.length)
}
