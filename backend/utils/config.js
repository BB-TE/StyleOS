import { resolve } from 'node:path'

const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const environment = process.env.NODE_ENV || 'development'
const persistenceMode = process.env.PERSISTENCE_MODE || 'file'
const parseBoolean = (value) => String(value || '').toLowerCase() === 'true'

export const config = Object.freeze({
  port: parsePort(process.env.PORT, 3001),
  host: process.env.HOST || (environment === 'production' ? '0.0.0.0' : '127.0.0.1'),
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  environment,
  persistenceMode,
  allowUnauthenticatedMemorySync: environment !== 'production' || parseBoolean(process.env.ENABLE_UNAUTHENTICATED_MEMORY_SYNC),
  storagePath: resolve(process.cwd(), process.env.STYLEOS_STORAGE_PATH || 'storage/styleos-memory.json'),
})
