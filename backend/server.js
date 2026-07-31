import cors from 'cors'
import express from 'express'
import { healthRouter } from './routes/health.js'
import { decisionRouter } from './routes/decision.js'
import { config } from './utils/config.js'

export const app = express()

app.disable('x-powered-by')
app.use(
  cors({
    origin: config.clientOrigin,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  }),
)
app.use(express.json({ limit: '1mb' }))

app.use('/api/health', healthRouter)
app.use('/api', decisionRouter)

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
  app.listen(config.port, () => {
    console.log(`StyleOS API listening on http://localhost:${config.port}`)
  })
}
