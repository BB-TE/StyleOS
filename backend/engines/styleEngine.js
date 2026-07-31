import { clothingItems } from '../data/clothingItems.js'
import { outfitExamples } from '../data/outfitExamples.js'
import { styleById, styleTaxonomy } from '../data/styleTaxonomy.js'

const STYLE_ORDER = ['cleanFit','minimalJapanese','quietLuxury','koreanMinimal','americanVintage','oldMoney','gorpcore','streetwear','minimalBusiness','darkStyle','y2k']
const stableHash = (value) => { let hash = 0; for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0; return hash.toString(36) }

export function analyzeStyleProfile(userProfile = {}) {
  const selected = Array.isArray(userProfile.styles) && userProfile.styles.length ? userProfile.styles : ['cleanFit']
  const ordered = [...selected, ...STYLE_ORDER.filter((id) => !selected.includes(id))].slice(0, 5)
  const baseScores = [34, 26, 18, 13, 9]
  const budget = Math.max(1, Number(userProfile.monthlyBudget) || 1000)
  const primary = styleById[selected[0]] || styleTaxonomy[0]
  const styleDNA = ordered.map((id, index) => ({ id, score: baseScores[index] }))
  const recommendedColors = [...new Set(selected.flatMap((id) => styleById[id]?.coreColors || []))].slice(0, 5)
  const recommendedSilhouettes = [...new Set(selected.flatMap((id) => styleById[id]?.silhouettes || []))].slice(0, 4)
  const recommendedItems = clothingItems.filter((item) => item.styles.some((id) => selected.includes(id))).slice(0, 8)
  const outfitRecommendations = outfitExamples.filter((example) => selected.includes(example.style) && (!userProfile.scenes?.length || userProfile.scenes.includes(example.scene))).slice(0, 6)
  const avoidItems = [...new Set(selected.flatMap((id) => styleById[id]?.avoidItems || []))].slice(0, 4)
  const personaKey = selected.includes('quietLuxury') ? 'consideredBuilder' : 'cleanExplorer'
  const colorIds = selected.includes('darkStyle') ? ['charcoal','black','deepNavy','stone','silver'] : ['charcoal','ivory','oatmeal','mistGray','deepNavy']
  return {
    id: `api-${stableHash(JSON.stringify(userProfile))}`,
    persona: personaKey === 'consideredBuilder' ? 'The considered ease builder' : 'The clear style explorer',
    personaKey,
    styleDNA,
    recommendedColors,
    colorIds,
    recommendedSilhouettes,
    silhouetteIds: ['relaxedShoulder','straightLine','cleanWaist','moderateVolume'],
    recommendedItems,
    itemIds: ['structuredJacket','qualityTee','straightTrousers','cleanSneakers','simpleBag'],
    avoidItems,
    avoidIds: ['extremeOversize','busyGraphics','fragileTrend'],
    outfitRecommendations,
    purchasePlan: ['outerwearFirst','upgradeBasics','completeBottoms'],
    priorityIds: ['outerwearFirst','upgradeBasics','completeBottoms'],
    budgetAdvice: { foundation: 50, upgrade: 30, experiment: 20 },
    budgetPlan: { monthly: budget, foundation: Math.round(budget * .5), upgrade: Math.round(budget * .3), experiment: Math.round(budget * .2) },
    pitfalls: ['buyingDuplicates','ignoringScenes','tooManyStatements'],
    pitfallIds: ['buyingDuplicates','ignoringScenes','tooManyStatements'],
    summary: `Your strongest direction is ${primary.name}. Build a stable silhouette and scene coverage before adding trend-led pieces.`,
    profile: userProfile,
  }
}
