const createRoute = (id, path) =>
  Object.freeze({
    id,
    path,
    copyKey: `pages.${id}`,
  })

export const routes = Object.freeze([
  createRoute('home', '/'),
  createRoute('today', '/today'),
  createRoute('purchase', '/purchase'),
  createRoute('report', '/memory'),
  createRoute('wardrobe', '/wardrobe'),
  createRoute('history', '/decisions'),
  createRoute('analysis', '/setup'),
  createRoute('styles', '/styles'),
  createRoute('colorLab', '/color-lab'),
  createRoute('sampleReport', '/sample-report'),
])

export const routeById = Object.freeze(
  Object.fromEntries(routes.map((route) => [route.id, route])),
)

export const primaryNavigation = Object.freeze([
  routeById.today,
  routeById.purchase,
  routeById.report,
  routeById.wardrobe,
  routeById.history,
])

export const secondaryNavigation = Object.freeze([
  routeById.analysis,
  routeById.styles,
  routeById.colorLab,
  routeById.sampleReport,
])
