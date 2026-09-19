import { Router } from 'express'

export function createHealthRouter({ memorySyncEnabled = false, persistence = 'disabled' } = {}) {
  const healthRouter = Router()
  healthRouter.get('/', (_request, response) => {
    response.json({
      ok: true,
      service: 'styleos-api',
      version: '0.1.0',
      memorySync: memorySyncEnabled ? 'development_only' : 'disabled',
      persistence,
    })
  })
  return healthRouter
}
