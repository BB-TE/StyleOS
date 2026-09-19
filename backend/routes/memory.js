import { Router } from 'express'
import { applyOutcomeToState, createDecision, createWardrobeItem } from '../engines/memoryStateEngine.js'
import { analyzeMemoryPurchase } from '../engines/memoryDecisionEngine.js'
import { validateMemoryPurchaseProduct } from '../utils/purchaseValidation.js'
import { NO_STATE_CHANGE, RevisionConflictError } from '../repositories/memoryRepository.js'

const OWNER_PATTERN = /^[a-zA-Z0-9-]{12,160}$/

function getOwnerId(request, response) {
  const ownerId = String(request.get('x-styleos-owner') || '')
  if (OWNER_PATTERN.test(ownerId)) return ownerId
  response.status(400).json({ error: 'owner_required', message: 'A valid StyleOS device or authenticated owner id is required.' })
  return null
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function isValidState(state) {
  return isObject(state)
    && state.version === 1
    && isObject(state.memory)
    && state.memory.version === 2
    && Array.isArray(state.memory.records)
    && Array.isArray(state.wardrobe)
    && Array.isArray(state.decisions)
    && Array.isArray(state.imageAssets)
}

function validateOutcome(outcome) {
  if (!isObject(outcome)) return 'outcome must be an object.'
  if (typeof outcome.kept !== 'boolean' || typeof outcome.returned !== 'boolean' || outcome.kept === outcome.returned) {
    return 'Exactly one of outcome.kept and outcome.returned must be true.'
  }
  if (outcome.satisfaction !== undefined && (!Number.isInteger(Number(outcome.satisfaction)) || Number(outcome.satisfaction) < 1 || Number(outcome.satisfaction) > 5)) {
    return 'outcome.satisfaction must be an integer from 1 to 5.'
  }
  if (outcome.wearCount !== undefined && (!Number.isInteger(Number(outcome.wearCount)) || Number(outcome.wearCount) < 0 || Number(outcome.wearCount) > 10_000)) {
    return 'outcome.wearCount must be an integer from 0 to 10000.'
  }
  return null
}

const statePayload = (state, persistence, extra = {}) => ({ state, persistence, revision: state.revision, ...extra })

export function createMemoryRouter(repository, { persistence = 'server_file' } = {}) {
  const memoryRouter = Router()

  memoryRouter.get('/state', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    try {
      const state = await repository.getState(ownerId)
      response.json(statePayload(state, persistence))
    } catch (error) { next(error) }
  })

  memoryRouter.put('/state', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    if (!isValidState(request.body?.state)) {
      return response.status(400).json({ error: 'invalid_state', message: 'A complete StyleOS state with version 1 is required.' })
    }
    if (!Number.isInteger(request.body?.expectedRevision) || request.body.expectedRevision < 0) {
      return response.status(400).json({ error: 'invalid_revision', message: 'expectedRevision must be a non-negative integer.' })
    }
    try {
      const state = await repository.replaceState(ownerId, request.body.state, request.body.expectedRevision)
      response.json(statePayload(state, persistence))
    } catch (error) {
      if (error instanceof RevisionConflictError) {
        return response.status(409).json({ error: error.code, message: error.message, currentRevision: error.currentRevision })
      }
      next(error)
    }
  })

  memoryRouter.delete('/state', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    try {
      const deleted = await repository.deleteState(ownerId)
      response.json({ ok: true, deleted, persistence })
    } catch (error) { next(error) }
  })

  memoryRouter.post('/wardrobe', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    if (!request.body?.item?.name) return response.status(400).json({ error: 'invalid_input', message: 'item.name is required.' })
    try {
      const item = createWardrobeItem(request.body.item)
      const state = await repository.mutateState(ownerId, (current) => ({ ...current, wardrobe: [item, ...current.wardrobe.filter((entry) => entry.id !== item.id)] }))
      response.status(201).json({ item: state.wardrobe.find((entry) => entry.id === item.id), ...statePayload(state, persistence) })
    } catch (error) { next(error) }
  })

  memoryRouter.delete('/wardrobe/:id', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    try {
      let removed = false
      const state = await repository.mutateState(ownerId, (current) => {
        const wardrobe = current.wardrobe.filter((entry) => entry.id !== request.params.id)
        removed = wardrobe.length !== current.wardrobe.length
        return removed ? { ...current, wardrobe } : NO_STATE_CHANGE
      })
      response.json({ ok: true, removed, ...statePayload(state, persistence) })
    } catch (error) { next(error) }
  })

  memoryRouter.post('/decisions', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    if (!request.body?.decision?.product?.name) return response.status(400).json({ error: 'invalid_input', message: 'decision.product.name is required.' })
    try {
      const decision = createDecision(request.body.decision)
      const state = await repository.mutateState(ownerId, (current) => ({ ...current, decisions: [decision, ...current.decisions.filter((entry) => entry.id !== decision.id)] }))
      response.status(201).json({ decision: state.decisions.find((entry) => entry.id === decision.id), ...statePayload(state, persistence) })
    } catch (error) { next(error) }
  })

  memoryRouter.post('/decision-check', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    const validationError = validateMemoryPurchaseProduct(request.body?.product)
    if (validationError) return response.status(400).json({ error: 'invalid_input', message: validationError })
    if (!Number.isInteger(request.body?.expectedRevision) || request.body.expectedRevision < 0) {
      return response.status(400).json({ error: 'invalid_revision', message: 'expectedRevision must be a non-negative integer.' })
    }
    try {
      let savedDecision = null
      const state = await repository.mutateState(ownerId, (current) => {
        if (current.revision !== request.body.expectedRevision) throw new RevisionConflictError(request.body.expectedRevision, current.revision)
        const result = analyzeMemoryPurchase(request.body.product, current.memory, current.wardrobe)
        savedDecision = createDecision({ product: request.body.product, result, status: 'advised', engineVersion: 'memory-v2.1', memoryRevision: current.revision })
        return { ...current, decisions: [savedDecision, ...current.decisions] }
      })
      response.status(201).json({ decision: state.decisions.find((item) => item.id === savedDecision.id), ...statePayload(state, persistence) })
    } catch (error) {
      if (error instanceof RevisionConflictError) {
        return response.status(409).json({ error: error.code, message: error.message, currentRevision: error.currentRevision })
      }
      next(error)
    }
  })

  memoryRouter.patch('/decisions/:id', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    try {
      let changed = false
      const state = await repository.mutateState(ownerId, (current) => {
        const decisions = current.decisions.map((decision) => {
          if (decision.id !== request.params.id) return decision
          changed = true
          return { ...decision, status: request.body?.status || decision.status, updatedAt: new Date().toISOString() }
        })
        return changed ? { ...current, decisions } : NO_STATE_CHANGE
      })
      if (!changed) return response.status(404).json({ error: 'not_found', message: 'Decision does not exist.' })
      response.json({ decision: state.decisions.find((entry) => entry.id === request.params.id), ...statePayload(state, persistence) })
    } catch (error) { next(error) }
  })

  memoryRouter.post('/decisions/:id/outcome', async (request, response, next) => {
    const ownerId = getOwnerId(request, response)
    if (!ownerId) return
    const outcomeError = validateOutcome(request.body?.outcome)
    if (outcomeError) return response.status(400).json({ error: 'invalid_outcome', message: outcomeError })
    try {
      let decision = null
      let idempotent = false
      const state = await repository.mutateState(ownerId, (current) => {
        const result = applyOutcomeToState(current, request.params.id, request.body.outcome)
        if (!result) return NO_STATE_CHANGE
        decision = result.decision
        idempotent = !result.changed
        return result.changed ? current : NO_STATE_CHANGE
      })
      if (!decision) return response.status(404).json({ error: 'not_found', message: 'Decision does not exist.' })
      response.json({ decision: state.decisions.find((entry) => entry.id === request.params.id), ...statePayload(state, persistence, { idempotent }) })
    } catch (error) { next(error) }
  })

  return memoryRouter
}
