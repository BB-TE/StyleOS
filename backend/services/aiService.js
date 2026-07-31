export const analyzeUserPhotoMock = async () => ({ posture: 'neutral', visibleSilhouette: 'balanced', confidence: .62, note: 'Mock only; no image is stored.' })
export const analyzeProductImageMock = async () => ({ category: 'unknown', colors: [], fit: 'regular', confidence: .55 })
export const extractAestheticPreferencesMock = async (text = '') => ({ keywords: String(text).toLowerCase().split(/[,，\s]+/).filter(Boolean).slice(0, 8) })
export const generateNaturalLanguageSummaryMock = async (structuredResult = {}) => structuredResult.summary || 'StyleOS organized this deterministic result into a concise report.'

// Replace these mocks on the server only with OpenAI Vision, Gemini Vision, or Claude Vision.
// API keys must remain in server environment variables and must never be sent to the frontend.

export const getImageAnalysisStatus = () => ({
  enabled: process.env.IMAGE_ANALYSIS_ENABLED === 'true',
  provider: process.env.IMAGE_ANALYSIS_PROVIDER || null,
  endpointConfigured: Boolean(process.env.IMAGE_ANALYSIS_ENDPOINT),
  apiKeyConfigured: Boolean(process.env.IMAGE_ANALYSIS_API_KEY),
})
