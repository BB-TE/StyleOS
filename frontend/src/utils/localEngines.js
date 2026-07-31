import { catalogById, styleCatalog } from '../data/styleCatalog.js'
import { generateLocalStyleReport } from './localStyleReport.js'

export const colorOptions = Object.freeze([
  { id: 'black', zh: '暖黑', en: 'Warm black', hex: '#171816', hue: 40, light: 10, sat: 5, neutral: true },
  { id: 'ivory', zh: '象牙白', en: 'Ivory', hex: '#e8e4d8', hue: 46, light: 88, sat: 20, neutral: true },
  { id: 'charcoal', zh: '炭灰', en: 'Charcoal', hex: '#343733', hue: 100, light: 22, sat: 5, neutral: true },
  { id: 'oatmeal', zh: '燕麦', en: 'Oatmeal', hex: '#bcae91', hue: 42, light: 65, sat: 23, neutral: true },
  { id: 'navy', zh: '深海军蓝', en: 'Deep navy', hex: '#1f2d3b', hue: 210, light: 18, sat: 31 },
  { id: 'denim', zh: '靛蓝', en: 'Indigo', hex: '#3f5f7d', hue: 209, light: 37, sat: 33 },
  { id: 'moss', zh: '苔藓绿', en: 'Moss', hex: '#657257', hue: 89, light: 39, sat: 14 },
  { id: 'olive', zh: '军橄榄', en: 'Olive', hex: '#72704a', hue: 57, light: 37, sat: 21 },
  { id: 'burgundy', zh: '酒红', en: 'Burgundy', hex: '#6c3540', hue: 348, light: 32, sat: 34 },
  { id: 'tobacco', zh: '烟草棕', en: 'Tobacco', hex: '#875b3d', hue: 24, light: 38, sat: 38 },
  { id: 'sky', zh: '雾霾蓝', en: 'Mist blue', hex: '#8da3ad', hue: 198, light: 62, sat: 16 },
  { id: 'acid', zh: '荧光黄绿', en: 'Acid lime', hex: '#d7ff45', hue: 73, light: 64, sat: 100 },
])

const colorMap = Object.freeze(Object.fromEntries(colorOptions.map((color) => [color.id, color])))
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)))
const circularHueDistance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

export function analyzeColorLocal(input) {
  const ids = [input.topColor, input.bottomColor, input.outerColor, input.shoesColor].filter(Boolean)
  const colors = ids.map((id) => colorMap[id] || colorMap.black)
  const pairs = colors.flatMap((color, i) => colors.slice(i + 1).map((other) => [color, other]))
  const averageHue = pairs.reduce((sum, [a, b]) => sum + circularHueDistance(a.hue, b.hue), 0) / Math.max(1, pairs.length)
  const averageLight = pairs.reduce((sum, [a, b]) => sum + Math.abs(a.light - b.light), 0) / Math.max(1, pairs.length)
  const neutrals = colors.filter((color) => color.neutral).length
  const highSat = colors.filter((color) => color.sat > 65).length
  const harmonyScore = clamp(88 - Math.max(0, averageHue - 70) * .28 + neutrals * 3 - Math.max(0, highSat - 1) * 16)
  const contrastScore = clamp(averageHue * .38 + averageLight * .75 + highSat * 9)
  const wearability = clamp(harmonyScore * .62 + (100 - contrastScore) * .24 + neutrals * 4)
  const riskLevel = wearability >= 78 ? 'low' : wearability >= 58 ? 'medium' : 'high'
  const mode = input.mode || 'basic'
  const ratioAdvice = mode === 'bold' ? '60 / 25 / 10 / 5' : mode === 'contrast' ? '60 / 30 / 10' : '60 / 30 / 10'
  const suggestions = []
  if (highSat > 1) suggestions.push('Keep only one high-saturation color and move the other to a small accessory area.')
  if (averageLight < 12) suggestions.push('Add one clear lightness break near the face or footwear.')
  if (contrastScore > 72) suggestions.push('Let the strongest color occupy no more than 10% of the visible area.')
  if (!suggestions.length) suggestions.push('The palette is stable. Repeat one color once in a smaller area to make it intentional.')
  return { harmonyScore, contrastScore, wearability, riskLevel, ratioAdvice, suggestions, colors: ids, styleId: input.styleId || 'cleanFit', mode }
}

export function analyzePurchaseLocal(purchaseInput, profileOrReport = {}) {
  const report = profileOrReport?.styleDNA ? profileOrReport : profileOrReport?.styles ? generateLocalStyleReport(profileOrReport) : null
  const preferred = report?.styleDNA?.map((item) => item.id) || ['cleanFit', 'minimalJapanese']
  const keywords = String(purchaseInput.styleKeywords || '').toLowerCase()
  const matched = preferred.filter((id) => {
    const style = catalogById[id] || styleCatalog[0]
    return keywords.includes(style.name.toLowerCase()) || style.keywords.some((keyword) => keywords.includes(keyword))
  }).length
  const monthlyBudget = Number(report?.profile?.monthlyBudget || purchaseInput.monthlyBudget || 1200)
  const price = Number(purchaseInput.price || 0)
  const sceneCount = Array.isArray(purchaseInput.scenes) ? purchaseInput.scenes.length : 0
  const similar = Number(purchaseInput.similarItems || 0)
  const styleMatch = clamp(58 + matched * 16 + (keywords ? 6 : 0))
  const budgetFit = clamp(100 - Math.max(0, price / Math.max(monthlyBudget, 1) - .35) * 70)
  const versatility = clamp(45 + sceneCount * 13 + (purchaseInput.color === 'black' || purchaseInput.color === 'ivory' || purchaseInput.color === 'charcoal' ? 14 : 0))
  const duplicateRisk = clamp(similar * 24)
  const idleRisk = clamp(72 - versatility * .55 + duplicateRisk * .4 + (String(purchaseInput.reason).toLowerCase().includes('discount') ? 16 : 0))
  const trendRisk = clamp(keywords.includes('y2k') || keywords.includes('trend') ? 68 : 24)
  const totalScore = clamp(styleMatch * .28 + budgetFit * .22 + versatility * .25 + (100 - idleRisk) * .13 + (100 - duplicateRisk) * .08 + (100 - trendRisk) * .04)
  const verdict = totalScore >= 76 ? 'buy' : totalScore >= 58 ? 'caution' : 'skip'
  const reasons = [
    `Style match ${styleMatch}/100 based on your current Style DNA.`,
    `Budget fit ${budgetFit}/100 against a monthly reference of ¥${monthlyBudget}.`,
    `Versatility ${versatility}/100 across ${sceneCount || 1} intended scene(s).`,
  ]
  const risks = []
  if (duplicateRisk >= 48) risks.push(`You already own ${similar} similar pieces; duplication is the main risk.`)
  if (budgetFit < 55) risks.push('The price occupies too much of the monthly clothing budget.')
  if (idleRisk > 55) risks.push('The intended use is not yet specific enough to support frequent wear.')
  if (!risks.length) risks.push('No major structural risk; still verify fabric, return terms, and two complete outfits.')
  const alternatives = verdict === 'buy'
    ? ['Wait 24 hours, then confirm it completes at least three existing outfits.']
    : ['Borrow the same silhouette from an existing piece first.', 'Move the budget to the highest-priority wardrobe gap.']
  return { verdict, totalScore, styleMatch, budgetFit, versatility, idleRisk, duplicateRisk, trendRisk, reasons, risks, alternatives, finalAdvice: verdict === 'buy' ? 'Buy only if the fit check passes and you can name three outfits now.' : verdict === 'caution' ? 'Pause for 48 hours and compare it with the closest item you already own.' : 'Skip this purchase and redirect the budget to a higher-use wardrobe gap.' }
}
