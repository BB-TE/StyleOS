const catalog = {
  tops: ['refined tee','oxford shirt','linen shirt','fine knit','boxy sweatshirt','polo knit','mock neck','ribbed top','work shirt','soft cardigan','technical base layer','minimal hoodie'],
  bottoms: ['straight trousers','wide trousers','high-rise trousers','chinos','raw denim','washed denim','work trousers','nylon trousers','pleated trousers','long skirt','column skirt','tailored shorts'],
  outerwear: ['structured jacket','boxy jacket','denim jacket','soft coat','trench coat','shell jacket','utility vest','bomber jacket','cardigan jacket','field jacket','light blazer','cropped coat'],
  shoes: ['clean sneakers','retro runners','minimal loafers','derby shoes','trail sneakers','canvas shoes','ankle boots','ballet flats','mules','court sneakers','technical sandals','slim boots'],
  accessories: ['medium bag','canvas tote','leather belt','minimal cap','silk scarf','wool scarf','technical pouch','simple watch','silver ring','nylon backpack','structured bag','soft beanie'],
}
const styleIds = ['cleanFit','minimalJapanese','americanVintage','quietLuxury','oldMoney','gorpcore','streetwear','koreanMinimal']
const sceneIds = ['class','commute','date','travel','interview','daily','sport','photo','formal','weekend']
const colorIds = ['black','ivory','charcoal','oatmeal','navy','denim','moss','olive','burgundy','tobacco','sky','acid']
const fitIds = ['slim','regular','relaxed','oversized','straight','wide']

export const clothingItems = Object.freeze(Object.entries(catalog).flatMap(([category, names]) => names.map((name, index) => Object.freeze({
  id: `${category}-${String(index + 1).padStart(2, '0')}`,
  name,
  chineseName: name,
  category,
  styles: [styleIds[index % styleIds.length], styleIds[(index + 2) % styleIds.length]],
  colors: [colorIds[index % colorIds.length], colorIds[(index + 3) % colorIds.length]],
  fits: [fitIds[index % fitIds.length], fitIds[(index + 1) % fitIds.length]],
  scenes: [sceneIds[index % sceneIds.length], sceneIds[(index + 3) % sceneIds.length]],
  riskLevel: index % 5 === 0 ? 'medium' : 'low',
  pairingTips: `Pair ${name} with one quieter silhouette and repeat one color in a smaller area.`,
  avoidTips: `Avoid combining ${name} with two other high-detail focal pieces.`,
}))))
