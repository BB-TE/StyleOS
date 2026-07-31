import { styleById } from '../data/styleTaxonomy.js'

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)))
const similarity = (item, product) => (item.category === product.category ? 45 : 0) + (item.color === product.color ? 25 : 0) + (item.fit === product.fit ? 20 : 0) + ((item.scenes || []).some((scene) => (product.scenes || []).includes(scene)) ? 10 : 0)

export function analyzeMemoryPurchase(product = {}, memory = {}, wardrobe = []) {
  const records = memory.records || []
  const monthlyBudget = Number(memory.profile?.monthlyBudget || product.monthlyBudget || 1200)
  const styleRecords = records.filter((record) => record.kind === 'styleAffinity').sort((a,b) => b.confidence - a.confidence)
  const keywords = String(product.styleKeywords || '').toLowerCase()
  const styleMatches = styleRecords.filter((record) => { const style = styleById[record.value]; return style && (keywords.includes(style.name.toLowerCase()) || style.keywords.some((keyword) => keywords.includes(keyword))) })
  const styleFit = clamp(48 + styleMatches.reduce((sum, record) => sum + record.confidence * 28, 0) + (keywords ? 8 : 0))
  const fitSuccess = records.filter((record) => record.kind === 'successfulFit' && record.value === product.fit)
  const fitFailure = records.filter((record) => record.kind === 'failedFit' && record.value === product.fit)
  const fitConfidence = clamp(58 + fitSuccess.reduce((sum, record) => sum + record.confidence * 30, 0) - fitFailure.reduce((sum, record) => sum + record.confidence * 48, 0))
  const similarItems = wardrobe.map((item) => ({ item, score: similarity(item, product) })).filter(({score}) => score >= 60).sort((a,b) => b.score - a.score)
  const duplicateRisk = clamp(similarItems.length * 27 + Math.max(0, similarItems[0]?.score - 75 || 0))
  const wardrobeCompatibility = clamp(72 - duplicateRisk * .38 + Math.min(24, (product.scenes || []).length * 8))
  const sceneRecords = records.filter((record) => record.kind === 'sceneNeed' && (product.scenes || []).includes(record.value))
  const useFrequency = clamp(38 + (product.scenes || []).length * 13 + sceneRecords.reduce((sum, record) => sum + record.confidence * 12, 0))
  const budgetFit = clamp(100 - Math.max(0, Number(product.price || 0) / Math.max(1, monthlyBudget) - .3) * 85)
  const reason = String(product.reason || '').toLowerCase()
  const impulseRisk = /discount|sale|折扣|便宜|限时|冲动/.test(reason) ? 72 : /replace|缺少|需要|gap|替换/.test(reason) ? 22 : 42
  const idleRisk = clamp(68 - useFrequency * .45 + duplicateRisk * .45 + impulseRisk * .2)
  const gates = []
  if (Number(product.price || 0) > monthlyBudget * .9) gates.push({ code:'budgetHardStop', severity:'high', value:Math.round(Number(product.price) / monthlyBudget * 100) })
  if (similarItems.length >= 3) gates.push({ code:'duplicateHardStop', severity:'high', value:similarItems.length })
  if (fitFailure.some((record) => record.confidence >= .65)) gates.push({ code:'fitConflict', severity:'high', value:product.fit })
  if (!(product.scenes || []).length) gates.push({ code:'missingScene', severity:'medium' })
  const missing = []
  if (!product.category) missing.push('category'); if (!product.fit) missing.push('fit'); if (!product.color) missing.push('color'); if (!product.fabric) missing.push('fabric'); if (!String(product.styleKeywords || '').trim()) missing.push('styleKeywords'); if (!product.scenes?.length) missing.push('scenes')
  const totalScore = clamp(styleFit * .25 + fitConfidence * .2 + wardrobeCompatibility * .2 + useFrequency * .15 + budgetFit * .1 + (100 - duplicateRisk) * .05 + (100 - idleRisk) * .05)
  const verdict = gates.some((gate) => gate.severity === 'high') || totalScore < 55 ? 'skip' : totalScore < 73 || missing.length >= 3 ? 'caution' : 'buy'
  const whatChanges = []
  if (missing.includes('fabric')) whatChanges.push('addFabric'); if (fitConfidence < 60) whatChanges.push('verifyMeasurements'); if (duplicateRisk >= 45) whatChanges.push('replaceExisting'); if (budgetFit < 60) whatChanges.push('waitNextBudget'); if (!whatChanges.length) whatChanges.push('nameThreeOutfits')
  return { verdict, totalScore, dimensions:{ styleFit, fitConfidence, wardrobeCompatibility, useFrequency, budgetFit, duplicateRisk, idleRisk }, gates, evidence:[{code:'styleEvidence',score:styleFit,confidence:styleRecords.length ? Math.max(...styleRecords.map((record) => record.confidence)) : .2,count:styleRecords.length},{code:'fitEvidence',score:fitConfidence,confidence:fitSuccess[0]?.confidence || fitFailure[0]?.confidence || .2,count:fitSuccess.length + fitFailure.length},{code:'wardrobeEvidence',score:wardrobeCompatibility,confidence:wardrobe.length ? .75 : .15,count:wardrobe.length,similarCount:similarItems.length},{code:'sceneEvidence',score:useFrequency,confidence:sceneRecords.length ? .7 : .25,count:sceneRecords.length},{code:'budgetEvidence',score:budgetFit,confidence:.98,monthlyBudget}], missing, similarItems:similarItems.slice(0,5).map(({item,score}) => ({id:item.id,name:item.name,score})), whatChanges, memorySnapshot:{recordCount:records.length,wardrobeCount:wardrobe.length,monthlyBudget} }
}
