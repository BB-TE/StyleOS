const STYLE_ORDER = [
  'cleanFit', 'minimalJapanese', 'quietLuxury', 'koreanMinimal',
  'americanVintage', 'oldMoney', 'gorpcore', 'streetwear',
  'minimalBusiness', 'darkStyle', 'y2k',
]

function stableHash(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash.toString(36)
}

export function generateLocalStyleReport(profile) {
  const selected = profile.styles.length ? profile.styles : ['cleanFit']
  const ordered = [
    ...selected,
    ...STYLE_ORDER.filter((style) => !selected.includes(style)),
  ].slice(0, 5)
  const baseScores = [34, 26, 18, 13, 9]
  const budget = Number(profile.monthlyBudget) || 1000

  return {
    id: `local-${stableHash(JSON.stringify(profile))}`,
    mode: 'local',
    profile,
    personaKey: selected.includes('quietLuxury') ? 'consideredBuilder' : 'cleanExplorer',
    styleDNA: ordered.map((id, index) => ({ id, score: baseScores[index] })),
    colorIds: selected.includes('darkStyle')
      ? ['charcoal', 'black', 'deepNavy', 'stone', 'silver']
      : ['charcoal', 'ivory', 'oatmeal', 'mistGray', 'deepNavy'],
    silhouetteIds: ['relaxedShoulder', 'straightLine', 'cleanWaist', 'moderateVolume'],
    itemIds: ['structuredJacket', 'qualityTee', 'straightTrousers', 'cleanSneakers', 'simpleBag'],
    avoidIds: ['extremeOversize', 'busyGraphics', 'fragileTrend'],
    pitfallIds: ['buyingDuplicates', 'ignoringScenes', 'tooManyStatements'],
    budgetPlan: {
      monthly: budget,
      foundation: Math.round(budget * 0.5),
      upgrade: Math.round(budget * 0.3),
      experiment: Math.round(budget * 0.2),
    },
    priorityIds: ['outerwearFirst', 'upgradeBasics', 'completeBottoms'],
  }
}
