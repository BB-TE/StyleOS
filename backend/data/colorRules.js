const palettes = [
  ['black','ivory','charcoal'], ['navy','ivory','oatmeal'], ['moss','charcoal','ivory'], ['denim','tobacco','ivory'],
  ['burgundy','navy','ivory'], ['olive','black','oatmeal'], ['sky','charcoal','ivory'], ['acid','black','charcoal'],
]
const types = ['basic','low-contrast','medium-contrast','high-contrast','monochrome','seasonal']
const styleIds = ['cleanFit','minimalJapanese','americanVintage','quietLuxury','oldMoney','gorpcore','streetwear','koreanMinimal']
const scenes = ['class','commute','date','travel','interview','daily','sport','photo','formal','weekend']

export const colorRules = Object.freeze(Array.from({ length: 40 }, (_, index) => {
  const colors = palettes[index % palettes.length]
  const type = types[index % types.length]
  const riskLevel = type === 'high-contrast' ? 'high' : type === 'medium-contrast' ? 'medium' : 'low'
  return Object.freeze({ id: `color-rule-${String(index + 1).padStart(2, '0')}`, colors, type, riskLevel, styles: [styleIds[index % 8], styleIds[(index + 3) % 8]], scenes: [scenes[index % 10], scenes[(index + 4) % 10]], ratioAdvice: riskLevel === 'high' ? '60/25/10/5' : '60/30/10', description: `${colors.join(' + ')} uses ${type} balance with a ${riskLevel} styling risk.` })
}))
