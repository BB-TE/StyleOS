import { Router } from 'express'

export const healthRouter = Router()

healthRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    service: 'styleos-api',
    version: '0.1.0',
  })
})

