import { Router } from 'express'
import { clothingItems } from '../data/clothingItems.js'
import { colorRules } from '../data/colorRules.js'
import { outfitExamples } from '../data/outfitExamples.js'
import { styleTaxonomy } from '../data/styleTaxonomy.js'
import { analyzeColorCombination } from '../engines/colorEngine.js'
import { analyzePurchaseDecision } from '../engines/purchaseEngine.js'
import { analyzeStyleProfile } from '../engines/styleEngine.js'
import { analyzeMemoryPurchase } from '../engines/memoryDecisionEngine.js'
import { validateMemoryPurchaseProduct } from '../utils/purchaseValidation.js'

export const decisionRouter = Router()

decisionRouter.post('/analyze-style', (request, response) => {
  if (!request.body?.userProfile) return response.status(400).json({ error: 'invalid_input', message: 'userProfile is required.' })
  response.json(analyzeStyleProfile(request.body.userProfile))
})

decisionRouter.post('/analyze-purchase', (request, response) => {
  if (!request.body?.purchaseInput) return response.status(400).json({ error: 'invalid_input', message: 'purchaseInput is required.' })
  response.json(analyzePurchaseDecision(request.body.purchaseInput, request.body.report || request.body.userProfile || {}))
})

decisionRouter.post('/analyze-purchase-v2', (request, response) => {
  const validationError = validateMemoryPurchaseProduct(request.body?.product)
  if (validationError) return response.status(400).json({ error: 'invalid_input', message: validationError })
  response.json(analyzeMemoryPurchase(request.body.product, request.body.memory || {}, request.body.wardrobe || []))
})

decisionRouter.post('/analyze-color', (request, response) => response.json(analyzeColorCombination(request.body || {})))

decisionRouter.get('/style-library', (_request, response) => response.json({ styleTaxonomy, clothingItems, colorRules, outfitExamples }))

decisionRouter.post('/feedback', (request, response) => {
  if (!request.body?.reportId || !request.body?.rating) return response.status(400).json({ error: 'invalid_input', message: 'reportId and rating are required.' })
  response.status(201).json({ ok: true, id: `feedback-${request.body.reportId}-${Date.now()}`, saved: 'mock' })
})

decisionRouter.post('/support', (request, response) => {
  const categories = new Set(['feature', 'decision', 'privacy', 'image', 'other'])
  const category = request.body?.category
  const message = typeof request.body?.message === 'string' ? request.body.message.trim() : ''

  if (!categories.has(category) || message.length < 10 || message.length > 1200) {
    return response.status(400).json({
      error: 'invalid_input',
      message: 'A valid category and a message between 10 and 1200 characters are required.',
    })
  }

  response.status(201).json({
    ok: true,
    id: `support-${Date.now()}`,
    saved: 'mock',
  })
})
