const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const config = Object.freeze({
  port: parsePort(process.env.PORT, 3001),
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  environment: process.env.NODE_ENV || 'development',
})
