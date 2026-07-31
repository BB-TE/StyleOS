import { styleById } from '../data/styleTaxonomy.js'

const clamp = (value) => Math.min(100, Math.max(0, Math.round(value)))

export function analyzePurchaseDecision(purchaseInput = {}, report = {}) {
  const preferred = report?.styleDNA?.map((item) => item.id) || report?.styles || ['cleanFit','minimalJapanese']
  const keywords = String(purchaseInput.styleKeywords || '').toLowerCase()
  const matched = preferred.filter((id) => { const style = styleById[id]; return style && (keywords.includes(style.name.toLowerCase()) || style.keywords.some((keyword) => keywords.includes(keyword))) }).length
  const monthlyBudget = Number(report?.profile?.monthlyBudget || purchaseInput.monthlyBudget || 1200)
  const price = Number(purchaseInput.price || 0)
  const sceneCount = Array.isArray(purchaseInput.scenes) ? purchaseInput.scenes.length : 0
  const similar = Number(purchaseInput.similarItems || 0)
  const styleMatch = clamp(58 + matched * 16 + (keywords ? 6 : 0))
  const budgetFit = clamp(100 - Math.max(0, price / Math.max(monthlyBudget, 1) - .35) * 70)
  const versatility = clamp(45 + sceneCount * 13 + (['black','ivory','charcoal'].includes(purchaseInput.color) ? 14 : 0))
  const duplicateRisk = clamp(similar * 24)
  const idleRisk = clamp(72 - versatility * .55 + duplicateRisk * .4 + (String(purchaseInput.reason).toLowerCase().includes('discount') ? 16 : 0))
  const trendRisk = clamp(keywords.includes('y2k') || keywords.includes('trend') ? 68 : 24)
  const totalScore = clamp(styleMatch * .28 + budgetFit * .22 + versatility * .25 + (100 - idleRisk) * .13 + (100 - duplicateRisk) * .08 + (100 - trendRisk) * .04)
  const verdict = totalScore >= 76 ? 'buy' : totalScore >= 58 ? 'caution' : 'skip'
  const reasons = [`Style match ${styleMatch}/100 based on current Style DNA.`, `Budget fit ${budgetFit}/100 against ¥${monthlyBudget} monthly reference.`, `Versatility ${versatility}/100 across ${sceneCount || 1} intended scene(s).`]
  const risks = []
  if (duplicateRisk >= 48) risks.push(`You already own ${similar} similar pieces; duplication is the main risk.`)
  if (budgetFit < 55) risks.push('The price occupies too much of the monthly clothing budget.')
  if (idleRisk > 55) risks.push('The use case is not specific enough to support frequent wear.')
  if (!risks.length) risks.push('No major structural risk; verify fabric, return terms, and two complete outfits.')
  return { verdict, totalScore, styleMatch, budgetFit, versatility, idleRisk, duplicateRisk, trendRisk, reasons, risks, alternatives: verdict === 'buy' ? ['Wait 24 hours, then verify three outfits.'] : ['Test the silhouette with an existing item first.','Redirect budget to the highest-priority wardrobe gap.'], finalAdvice: verdict === 'buy' ? 'Buy only if the fit check passes and you can name three outfits now.' : verdict === 'caution' ? 'Pause for 48 hours and compare it with the closest item you own.' : 'Skip and redirect the budget to a higher-use wardrobe gap.' }
}
