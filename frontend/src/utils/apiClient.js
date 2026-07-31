import { styleCatalog } from '../data/styleCatalog.js'
import { analyzeColorLocal, analyzePurchaseLocal } from './localEngines.js'
import { generateLocalStyleReport } from './localStyleReport.js'
import { analyzePurchaseWithMemory } from '../domain/decisionEngine.js'
import { saveLocalSupportRequest } from './supportStore.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const LOCAL_DEMO_ONLY = import.meta.env.VITE_LOCAL_DEMO_ONLY === 'true'

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2200)
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`StyleOS API ${response.status}`)
    return await response.json()
  } finally { clearTimeout(timeout) }
}

async function withFallback(remote, local) {
  if (LOCAL_DEMO_ONLY) return { data: await local(), mode: 'local' }
  try { return { data: await remote(), mode: 'api' } }
  catch { return { data: await local(), mode: 'local' } }
}

export const analyzeStyle = (userProfile) => withFallback(
  () => request('/api/analyze-style', { method: 'POST', body: JSON.stringify({ userProfile }) }),
  () => generateLocalStyleReport(userProfile),
)

export const analyzePurchase = (purchaseInput, userProfileOrReport) => withFallback(
  () => request('/api/analyze-purchase', { method: 'POST', body: JSON.stringify({ purchaseInput, report: userProfileOrReport }) }),
  () => analyzePurchaseLocal(purchaseInput, userProfileOrReport),
)

export const analyzePurchaseV2 = (product, memory, wardrobe) => withFallback(
  () => request('/api/analyze-purchase-v2', { method: 'POST', body: JSON.stringify({ product, memory, wardrobe }) }),
  () => analyzePurchaseWithMemory(product, memory, wardrobe),
)

export const analyzeColor = (input) => withFallback(
  () => request('/api/analyze-color', { method: 'POST', body: JSON.stringify(input) }),
  () => analyzeColorLocal(input),
)

export const getStyleLibrary = () => withFallback(
  () => request('/api/style-library'),
  () => ({ styleTaxonomy: styleCatalog, clothingItems: [], colorRules: [], outfitExamples: [] }),
)

export const submitFeedback = (feedback) => withFallback(
  () => request('/api/feedback', { method: 'POST', body: JSON.stringify(feedback) }),
  () => ({ ok: true, id: `local-feedback-${Date.now()}` }),
)

export const submitSupportRequest = (supportInput) => withFallback(
  () => request('/api/support', { method: 'POST', body: JSON.stringify(supportInput) }),
  () => saveLocalSupportRequest(supportInput),
)
