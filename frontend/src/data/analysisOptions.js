export const sceneOptions = Object.freeze([
  'class', 'commute', 'date', 'travel', 'interview',
  'daily', 'sport', 'photo', 'formal', 'weekend',
])

export const styleOptions = Object.freeze([
  'cleanFit', 'minimalJapanese', 'americanVintage', 'quietLuxury',
  'oldMoney', 'gorpcore', 'streetwear', 'koreanMinimal',
  'y2k', 'darkStyle', 'minimalBusiness',
])

export const frequencyOptions = Object.freeze(['low', 'medium', 'high'])

export const initialAnalysisForm = Object.freeze({
  photoName: '',
  gender: '',
  age: '',
  height: '',
  weight: '',
  scenes: [],
  styles: [],
  monthlyBudget: '',
  shoppingFrequency: '',
  returnFrequency: '',
  impulseFrequency: '',
  similarItems: '0',
  expressionGoal: '',
  biggestConcern: '',
  dislikedElements: '',
})
