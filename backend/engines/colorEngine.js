const colors = {
  black: [40,10,5,true], ivory: [46,88,20,true], charcoal: [100,22,5,true], oatmeal: [42,65,23,true],
  navy: [210,18,31,false], denim: [209,37,33,false], moss: [89,39,14,false], olive: [57,37,21,false],
  burgundy: [348,32,34,false], tobacco: [24,38,38,false], sky: [198,62,16,false], acid: [73,64,100,false],
}
const clamp = (value) => Math.min(100, Math.max(0, Math.round(value)))
const hueDistance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

export function analyzeColorCombination(input = {}) {
  const ids = [input.topColor, input.bottomColor, input.outerColor, input.shoesColor].filter(Boolean)
  const selected = ids.map((id) => colors[id] || colors.black)
  const pairs = selected.flatMap((color, index) => selected.slice(index + 1).map((other) => [color, other]))
  const hue = pairs.reduce((sum, [a,b]) => sum + hueDistance(a[0], b[0]), 0) / Math.max(1, pairs.length)
  const light = pairs.reduce((sum, [a,b]) => sum + Math.abs(a[1] - b[1]), 0) / Math.max(1, pairs.length)
  const neutralCount = selected.filter((color) => color[3]).length
  const highSat = selected.filter((color) => color[2] > 65).length
  const harmonyScore = clamp(88 - Math.max(0, hue - 70) * .28 + neutralCount * 3 - Math.max(0, highSat - 1) * 16)
  const contrastScore = clamp(hue * .38 + light * .75 + highSat * 9)
  const wearability = clamp(harmonyScore * .62 + (100 - contrastScore) * .24 + neutralCount * 4)
  const riskLevel = wearability >= 78 ? 'low' : wearability >= 58 ? 'medium' : 'high'
  const suggestions = []
  if (highSat > 1) suggestions.push('Keep only one high-saturation color and reduce the other to accessory area.')
  if (light < 12) suggestions.push('Add one lightness break near the face or footwear.')
  if (contrastScore > 72) suggestions.push('Keep the strongest color below 10% of visible area.')
  if (!suggestions.length) suggestions.push('Repeat one color once in a smaller area to make the palette intentional.')
  return { harmonyScore, contrastScore, wearability, riskLevel, ratioAdvice: input.mode === 'bold' ? '60 / 25 / 10 / 5' : '60 / 30 / 10', suggestions, colors: ids, styleId: input.styleId || 'cleanFit', mode: input.mode || 'basic' }
}
