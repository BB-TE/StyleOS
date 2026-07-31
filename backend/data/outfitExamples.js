import { styleTaxonomy } from './styleTaxonomy.js'

const scenes = ['class','commute','date','travel','interview','weekend']
const baseItems = [
  ['refined top','straight trousers','clean shoes'], ['soft knit','wide-straight trousers','light outerwear'],
  ['structured jacket','plain base layer','straight trousers'], ['short outerwear','high-rise trousers','minimal shoes'],
  ['textured shirt','controlled bottom','quiet accessory'], ['light coat','tonal top','clean trousers'],
]

export const outfitExamples = Object.freeze(styleTaxonomy.flatMap((style) => scenes.map((scene, index) => Object.freeze({
  id: `${style.id}-${scene}`,
  style: style.id,
  scene,
  items: baseItems[index],
  colors: style.coreColors.slice(0, 3),
  silhouette: style.silhouettes[index % style.silhouettes.length],
  keywords: style.keywords,
  whyItWorks: `One ${style.name} anchor controls the outfit while the remaining pieces support real ${scene} use.`,
  whatToAvoid: style.avoidItems[0],
  imageRef: `/assets/outfits/${style.id}-${scene}.webp`,
}))))
