import cors from 'cors'
import express from 'express'
import { createHealthRouter } from './routes/health.js'
import { decisionRouter } from './routes/decision.js'
import { createMemoryRouter } from './routes/memory.js'
import { createMemoryRepository } from './repositories/createMemoryRepository.js'
import { config } from './utils/config.js'

export const app = express()
export const memoryPersistence = createMemoryRepository(config)
export const memoryRepository = memoryPersistence.repository

app.disable('x-powered-by')
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.clientOrigins.includes(origin)) return callback(null, true)
      return callback(new Error(`Origin ${origin} is not allowed by StyleOS CORS.`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-StyleOS-Owner'],
  }),
)
app.use(express.json({ limit: '1mb' }))

app.use('/api/health', createHealthRouter({ memorySyncEnabled: memoryPersistence.enabled, persistence: memoryPersistence.persistence }))
app.use('/api', decisionRouter)
if (memoryPersistence.enabled) app.use('/api/memory', createMemoryRouter(memoryRepository, { persistence: memoryPersistence.persistence }))

app.use('/api', (_request, response) => {
  response.status(404).json({
    error: 'not_found',
    message: 'The requested StyleOS API endpoint does not exist.',
  })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({
    error: 'internal_error',
    message: 'StyleOS could not complete this request.',
  })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, config.host, () => {
    console.log(`StyleOS API listening on http://${config.host}:${config.port}`)
  })
}
