import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  serializers: {
    req: (req: Record<string, unknown>) => {
      const headers = req.headers as Record<string, unknown> | undefined
      if (headers) {
        const { authorization, cookie, ...safeHeaders } = headers
        return { ...req, headers: safeHeaders }
      }
      return req
    },
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }),
})
