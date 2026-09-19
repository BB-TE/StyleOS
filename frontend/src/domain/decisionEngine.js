import { catalogById } from '../data/styleCatalog.js'

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)))
const neutralColors = new Set(['black', 'ivory', 'charcoal', 'oatmeal'])
const colorPairs = new Set([
  'black:acid', 'black:ivory', 'black:olive', 'burgundy:navy', 'charcoal:ivory',
  'charcoal:moss', 'charcoal:sky', 'denim:tobacco', 'ivory:navy', 'navy:oatmeal',
])
const pairingCategories = {
  tops: ['bottoms', 'outerwear', 'shoes'],
  bottoms: ['tops', 'outerwear', 'shoes'],
  outerwear: ['tops', 'bottoms', 'shoes'],
  shoes: ['tops', 'bottoms', 'outerwear'],
  accessories: ['tops', 'outerwear', 'shoes'],
}
const requiredOutfitCategories = {
  tops: ['bottoms', 'shoes'],
  bottoms: ['tops', 'shoes'],
  outerwear: ['tops', 'bottoms', 'shoes'],
  shoes: ['tops', 'bottoms'],
  accessories: ['tops', 'bottoms', 'shoes'],
}

function colorCompatibility(first, second) {
  if (!first || !second) return { score: 6, signal: 'colorUnverified' }
  if (first === second) return { score: 18, signal: 'tonalColor' }
  const key = [first, second].sort().join(':')
  if (colorPairs.has(key)) return { score: 30, signal: 'colorPair' }
  if (neutralColors.has(first) || neutralColors.has(second)) return { score: 24, signal: 'neutralBridge' }
  return { score: 9, signal: 'colorUnverified' }
}

function similarity(item, product) {
  let score = 0
  if (item.category === product.category) score += 45
  if (item.color === product.color) score += 25
  if (item.fit === product.fit) score += 20
  if ((item.scenes || []).some((scene) => (product.scenes || []).includes(scene))) score += 10
  return score
}

function compatibleWardrobeItems(product, wardrobe) {
  const usedCategories = new Set()
  const preferredCategories = pairingCategories[product.category] || pairingCategories.outerwear
  return wardrobe
    .filter((item) => item.category !== product.category && item.status !== 'retired')
    .map((item) => {
      const sceneOverlap = (item.scenes || []).some((scene) => (product.scenes || []).includes(scene))
      const color = colorCompatibility(item.color, product.color)
      const reliableWear = item.wearFrequency === 'weekly'
      const signals = [color.signal]
      if (sceneOverlap) signals.push('sceneOverlap')
      if (reliableWear) signals.push('reliableWear')
      const score = 8 + color.score + (sceneOverlap ? 24 : 5) + (item.liked !== false ? 8 : 0)
        + (reliableWear ? 10 : item.wearFrequency === 'monthly' ? 4 : 0)
        + (preferredCategories.includes(item.category) ? 10 : 0)
      return { item, score: clampScore(score), signals }
    })
    .sort((a, b) => b.score - a.score)
    .filter(({ score }) => score >= 45)
    .filter(({ item }) => {
      if (usedCategories.has(item.category)) return false
      usedCategories.add(item.category)
      return true
    })
    .slice(0, 3)
    .map(({ item, score, signals }) => ({ id: item.id, name: item.name, category: item.category, color: item.color, score, signals }))
}

function scoreOutfitItem(item, product) {
  const color = colorCompatibility(item.color, product.color)
  const sceneOverlap = (item.scenes || []).some((scene) => (product.scenes || []).includes(scene))
  const reliableWear = item.wearFrequency === 'weekly'
  const signals = [color.signal]
  if (sceneOverlap) signals.push('sceneOverlap')
  if (reliableWear) signals.push('reliableWear')
  const score = 18 + color.score + (sceneOverlap ? 24 : 4) + (item.liked === false ? -14 : 8)
    + (reliableWear ? 12 : item.wearFrequency === 'monthly' ? 5 : item.wearFrequency === 'unused' ? -10 : 0)
    + (item.status === 'idle' ? -8 : 0)
  return { item, score: clampScore(score), signals }
}

function buildOutfitPlans(product, wardrobe) {
  const requiredCategories = requiredOutfitCategories[product.category] || requiredOutfitCategories.outerwear
  const optionalCategories = product.category !== 'outerwear' && product.category !== 'accessories' ? ['outerwear'] : []
  const planCategories = [...requiredCategories, ...optionalCategories]
  const candidates = wardrobe
    .filter((item) => item.status !== 'retired' && item.category !== product.category)
    .map((item) => scoreOutfitItem(item, product))
  const grouped = Object.fromEntries(planCategories.map((category) => [
    category,
    candidates
      .filter(({ item }) => item.category === category)
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)),
  ]))
  const signatures = new Set()
  const plans = []

  for (let planIndex = 0; planIndex < 3; planIndex += 1) {
    const selected = planCategories.flatMap((category, categoryIndex) => {
      const options = grouped[category] || []
      if (!options.length) return []
      return [options[(planIndex + categoryIndex) % options.length]]
    })
    if (!selected.length) break
    const signature = selected.map(({ item }) => item.id).sort().join(':')
    if (signatures.has(signature)) continue
    signatures.add(signature)
    const presentCategories = new Set(selected.map(({ item }) => item.category))
    const missingCategories = requiredCategories.filter((category) => !presentCategories.has(category))
    const coverage = selected.length / requiredCategories.length
    const productAndItemColors = [product.color, ...selected.map(({ item }) => item.color)].filter(Boolean)
    const pairScores = productAndItemColors.flatMap((color, index) => productAndItemColors.slice(index + 1).map((other) => colorCompatibility(color, other).score))
    const pairAverage = pairScores.length ? pairScores.reduce((sum, score) => sum + score, 0) / pairScores.length : 10
    const averageScore = selected.reduce((sum, entry) => sum + entry.score, 0) / selected.length
    plans.push({
      id: `outfit-${plans.length + 1}`,
      scene: product.scenes?.[planIndex % Math.max(1, product.scenes.length)] || 'daily',
      confidence: clampScore(averageScore * .58 + pairAverage * .42 + coverage * 22),
      ready: missingCategories.length === 0,
      missingCategories,
      items: selected.map(({ item, score, signals }) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.color,
        fit: item.fit,
        score,
        signals,
      })),
    })
  }

  return plans
}

function buildUsagePlan(product, useFrequency, monthlyBudget, outfitPlans) {
  const expectedWearsPerMonth = useFrequency >= 82 ? 6 : useFrequency >= 68 ? 4 : useFrequency >= 52 ? 2 : 1
  const annualWears = expectedWearsPerMonth * 12
  const price = Math.max(0, Number(product.price || 0))
  return {
    expectedWearsPerMonth,
    costPerWear12m: price ? Math.round((price / annualWears) * 10) / 10 : 0,
    budgetShare: Math.round(price / Math.max(1, monthlyBudget) * 100),
    completeOutfitCount: outfitPlans.filter((plan) => plan.ready).length,
    draftOutfitCount: outfitPlans.length,
  }
}

function buildNextActions({ verdict, gates, missing, outfitPlans, wardrobe, similarItems }) {
  const actions = []
  const add = (code, extra = {}) => {
    if (!actions.some((action) => action.code === code)) actions.push({ code, ...extra })
  }
  if (gates.some((gate) => gate.code === 'duplicateHardStop')) add('replaceExisting', { itemName: similarItems[0]?.item?.name || '' })
  if (gates.some((gate) => gate.code === 'budgetHardStop')) add('waitBudget')
  if (gates.some((gate) => gate.code === 'fitConflict')) add('verifyMeasurements')
  if (missing.includes('fabric')) add('verifyFabric')
  if (!outfitPlans.some((plan) => plan.ready)) add(wardrobe.length < 3 ? 'recordWardrobe' : 'completeOutfit')
  if (verdict === 'caution') add('coolOff')
  if (verdict === 'buy') add('scheduleFirstWear')
  if (verdict === 'skip' && !actions.length) add('skipForNow')
  return actions.slice(0, 3)
}

function buildReasons({ styleFit, fitConfidence, budgetFit, duplicateRisk, useFrequency, similarItems, wardrobe, styleRecords, fitFailure, colorFailure, categoryFailure, avoidConflicts, colorSuccess, categorySuccess }) {
  const reasons = []
  if (similarItems.length >= 2) reasons.push({ code: 'duplicateEvidence', value: similarItems.length, itemNames: similarItems.slice(0, 2).map(({ item }) => item.name) })
  if (budgetFit < 60) reasons.push({ code: 'budgetPressure', value: budgetFit })
  if (fitFailure.some((record) => record.confidence >= .65)) reasons.push({ code: 'fitHistoryConflict', value: fitConfidence })
  if (colorFailure.length) reasons.push({ code: 'colorHistoryConflict', value: colorFailure[0].confidence })
  if (categoryFailure.length) reasons.push({ code: 'categoryHistoryConflict', value: categoryFailure[0].confidence })
  if (avoidConflicts.length) reasons.push({ code: 'avoidElementConflict', value: avoidConflicts[0].value })
  if (colorSuccess.length) reasons.push({ code: 'colorHistorySuccess', value: colorSuccess[0].confidence })
  if (categorySuccess.length) reasons.push({ code: 'categoryHistorySuccess', value: categorySuccess[0].confidence })
  if (styleFit >= 75) reasons.push({ code: 'styleEvidenceStrong', value: styleFit })
  if (useFrequency >= 70) reasons.push({ code: 'sceneEvidenceStrong', value: useFrequency })
  if (!wardrobe.length) reasons.push({ code: 'wardrobeStillEmpty', value: 0 })
  else if (wardrobe.length < 3) reasons.push({ code: 'wardrobeStillThin', value: wardrobe.length })
  if (!styleRecords.length) reasons.push({ code: 'memoryStillThin', value: 0 })
  if (!reasons.length && duplicateRisk < 45) reasons.push({ code: 'noStrongConflict', value: 0 })
  return reasons.slice(0, 4)
}

export function analyzePurchaseWithMemory(product, memory, wardrobe = []) {
  const records = memory?.records || []
  const rawBudget = Number(memory?.profile?.monthlyBudget || product.monthlyBudget || 1200)
  const monthlyBudget = Number.isFinite(rawBudget) && rawBudget > 0 ? rawBudget : 1200
  const rawPrice = Number(product.price)
  const price = Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0
  const styleRecords = records.filter((record) => record.kind === 'styleAffinity').sort((a, b) => b.confidence - a.confidence)
  const keywords = String(product.styleKeywords || '').toLowerCase()
  const productText = [product.name, product.styleKeywords, product.reason, product.fabric].filter(Boolean).join(' ').toLowerCase()
  const styleMatches = styleRecords.filter((record) => {
    const style = catalogById[record.value]
    const terms = style ? [style.name, style.chineseName, ...style.keywords].filter(Boolean).map((term) => String(term).toLowerCase()) : []
    return terms.some((term) => keywords.includes(term))
  })
  const colorSuccess = records.filter((record) => record.kind === 'successfulColor' && record.value === product.color)
  const colorFailure = records.filter((record) => record.kind === 'failedColor' && record.value === product.color)
  const categorySuccess = records.filter((record) => record.kind === 'successfulCategory' && record.value === product.category)
  const categoryFailure = records.filter((record) => record.kind === 'failedCategory' && record.value === product.category)
  const avoidConflicts = records.filter((record) => record.kind === 'avoidElement' && String(record.value || '').trim() && productText.includes(String(record.value).trim().toLowerCase()))
  const preferenceDelta = colorSuccess.reduce((sum, record) => sum + record.confidence * 16, 0)
    - colorFailure.reduce((sum, record) => sum + record.confidence * 30, 0)
    + categorySuccess.reduce((sum, record) => sum + record.confidence * 12, 0)
    - categoryFailure.reduce((sum, record) => sum + record.confidence * 22, 0)
    - avoidConflicts.reduce((sum, record) => sum + record.confidence * 26, 0)
  const styleFit = clampScore(48 + styleMatches.reduce((sum, record) => sum + record.confidence * 28, 0) + (keywords ? 8 : 0) + preferenceDelta)

  const fitSuccess = records.filter((record) => record.kind === 'successfulFit' && record.value === product.fit)
  const fitFailure = records.filter((record) => record.kind === 'failedFit' && record.value === product.fit)
  const fitConfidence = clampScore(58 + fitSuccess.reduce((sum, record) => sum + record.confidence * 30, 0) - fitFailure.reduce((sum, record) => sum + record.confidence * 48, 0))

  const activeWardrobe = wardrobe.filter((item) => item.status !== 'retired')
  const similarItems = activeWardrobe.map((item) => ({ item, score: similarity(item, product) })).filter(({ score }) => score >= 60).sort((a, b) => b.score - a.score)
  const duplicateRisk = clampScore(similarItems.length * 27 + Math.max(0, similarItems[0]?.score - 75 || 0))
  const compatibleItems = compatibleWardrobeItems(product, activeWardrobe)
  const compatibleAverage = compatibleItems.length ? compatibleItems.reduce((sum, item) => sum + item.score, 0) / compatibleItems.length : 0
  const wardrobeCompatibility = clampScore((activeWardrobe.length ? 38 : 24) + compatibleAverage * .48 + Math.min(14, compatibleItems.length * 5) - duplicateRisk * .32)

  const sceneRecords = records.filter((record) => record.kind === 'sceneNeed' && (product.scenes || []).includes(record.value))
  const useFrequency = clampScore(38 + (product.scenes || []).length * 13 + sceneRecords.reduce((sum, record) => sum + record.confidence * 12, 0))
  const budgetFit = clampScore(100 - Math.max(0, price / Math.max(1, monthlyBudget) - .3) * 85)
  const reason = String(product.reason || '').toLowerCase()
  const impulseRisk = /discount|sale|折扣|便宜|限时|冲动/.test(reason) ? 72 : /replace|缺少|需要|gap|替换/.test(reason) ? 22 : 42
  const idleRisk = clampScore(68 - useFrequency * .45 + duplicateRisk * .45 + impulseRisk * .2)

  const gates = []
  if (price > monthlyBudget * .9) gates.push({ code: 'budgetHardStop', severity: 'high', value: Math.round(price / monthlyBudget * 100) })
  if (similarItems.length >= 3) gates.push({ code: 'duplicateHardStop', severity: 'high', value: similarItems.length })
  if (fitFailure.some((record) => record.confidence >= .65)) gates.push({ code: 'fitConflict', severity: 'high', value: product.fit })
  if (!(product.scenes || []).length) gates.push({ code: 'missingScene', severity: 'medium' })

  const missing = []
  if (!product.category) missing.push('category')
  if (!product.fit) missing.push('fit')
  if (!product.color) missing.push('color')
  if (!product.fabric) missing.push('fabric')
  if (!String(product.styleKeywords || '').trim()) missing.push('styleKeywords')
  if (!product.scenes?.length) missing.push('scenes')

  const totalScore = clampScore(styleFit * .25 + fitConfidence * .2 + wardrobeCompatibility * .2 + useFrequency * .15 + budgetFit * .1 + (100 - duplicateRisk) * .05 + (100 - idleRisk) * .05)
  const highGate = gates.some((gate) => gate.severity === 'high')
  const verdict = highGate || totalScore < 55 ? 'skip' : totalScore < 73 || missing.length >= 3 ? 'caution' : 'buy'
  const evidence = [
    { code: 'styleEvidence', score: styleFit, confidence: styleRecords.length ? Math.max(...styleRecords.map((record) => record.confidence)) : .2, count: styleRecords.length + colorSuccess.length + colorFailure.length + categorySuccess.length + categoryFailure.length + avoidConflicts.length },
    { code: 'fitEvidence', score: fitConfidence, confidence: fitSuccess[0]?.confidence || fitFailure[0]?.confidence || .2, count: fitSuccess.length + fitFailure.length },
    { code: 'wardrobeEvidence', score: wardrobeCompatibility, confidence: activeWardrobe.length ? .75 : .15, count: activeWardrobe.length, similarCount: similarItems.length },
    { code: 'sceneEvidence', score: useFrequency, confidence: sceneRecords.length ? .7 : .25, count: sceneRecords.length },
    { code: 'budgetEvidence', score: budgetFit, confidence: .98, monthlyBudget },
  ]
  const whatChanges = []
  if (missing.includes('fabric')) whatChanges.push('addFabric')
  if (fitConfidence < 60) whatChanges.push('verifyMeasurements')
  if (duplicateRisk >= 45) whatChanges.push('replaceExisting')
  if (budgetFit < 60) whatChanges.push('waitNextBudget')
  if (!whatChanges.length) whatChanges.push('nameThreeOutfits')

  const reasons = buildReasons({ styleFit, fitConfidence, budgetFit, duplicateRisk, useFrequency, similarItems, wardrobe: activeWardrobe, styleRecords, fitFailure, colorFailure, categoryFailure, avoidConflicts, colorSuccess, categorySuccess })
  const outfitPlans = buildOutfitPlans(product, activeWardrobe)
  const usagePlan = buildUsagePlan({ ...product, price }, useFrequency, monthlyBudget, outfitPlans)
  const nextActions = buildNextActions({ verdict, gates, missing, outfitPlans, wardrobe: activeWardrobe, similarItems })

  return {
    verdict,
    totalScore,
    dimensions: { styleFit, fitConfidence, wardrobeCompatibility, useFrequency, budgetFit, duplicateRisk, idleRisk },
    gates,
    evidence,
    reasons,
    missing,
    similarItems: similarItems.slice(0, 5).map(({ item, score }) => ({ id: item.id, name: item.name, score })),
    compatibleItems,
    outfitPlans,
    usagePlan,
    nextActions,
    whatChanges,
    memorySnapshot: { recordCount: records.length, wardrobeCount: activeWardrobe.length, monthlyBudget },
  }
}
