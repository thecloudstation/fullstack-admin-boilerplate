import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import { readFileSync, existsSync } from 'fs'
import { getEnv } from './env'
import { auth } from './auth'
import { draftEmail } from './ai'
import { logger } from './logger'
import { migrate } from './migrate'
import { healthRoute } from './routes/health'
import { draftEmailRoute } from './routes/ai'

// Validate environment on startup
getEnv()

const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!fieldErrors[key]) fieldErrors[key] = []
        fieldErrors[key].push(issue.message)
      }
      return c.json(
        {
          error: 'Validation failed',
          details: fieldErrors,
        },
        400
      )
    }
  },
})

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
    },
    `${c.req.method} ${c.req.path} ${c.res.status} ${duration}ms`
  )
})

app.use(
  '/api/auth/*',
  cors({
    origin: 'http://localhost:5174',
    credentials: true,
  })
)

app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))

// --- OpenAPI Routes ---

app.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok' as const }, 200)
})

app.openapi(draftEmailRoute, async (c) => {
  const body = c.req.valid('json')

  try {
    const result = await draftEmail(body)
    return c.json(result, 200)
  } catch (err) {
    logger.error({ err }, 'Failed to draft email')
    return c.json({ error: 'Failed to generate email draft' }, 500)
  }
})

// --- OpenAPI Spec & Swagger UI ---

app.doc('/api/doc', {
  openapi: '3.1.0',
  info: {
    title: 'Admin Starter API',
    version: '1.0.0',
    description:
      'Full-stack admin boilerplate API with AI-powered email drafting.',
  },
})

app.get('/api/reference', swaggerUI({ url: '/api/doc' }))

// --- Static file serving (production) ---
const distPath = './dist'
if (existsSync(distPath)) {
  app.use('/*', serveStatic({ root: distPath }))
  app.get('*', (c) => {
    const html = readFileSync(`${distPath}/index.html`, 'utf-8')
    return c.html(html)
  })
}

const port = Number(process.env.PORT) || 3100

migrate()
  .then(() => {
    logger.info('Database tables ready')
    serve({ fetch: app.fetch, port })
    logger.info(`Server running on http://localhost:${port}`)
  })
  .catch((err) => {
    logger.warn({ err }, 'Migration skipped (DB may not be available)')
    serve({ fetch: app.fetch, port })
    logger.info(`Server running on http://localhost:${port}`)
  })

