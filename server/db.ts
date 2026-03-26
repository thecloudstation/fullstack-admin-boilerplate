import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
import postgres from 'postgres'
import { mkdirSync } from 'fs'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePglite>

if (connectionString) {
  // Production: use real PostgreSQL
  const url = new URL(connectionString)
  const needsSsl = url.port === '443' || url.protocol === 'postgres+ssl:'
  const client = postgres(connectionString, {
    prepare: false,
    ssl: needsSsl ? 'require' : false,
  })
  db = drizzle(client, { schema })
} else {
  // Local dev: use PGlite (in-process PostgreSQL, no setup needed)
  mkdirSync('./data/pglite', { recursive: true })
  const pglite = new PGlite('./data/pglite')
  db = drizzlePglite(pglite, { schema })
}

export { db }
