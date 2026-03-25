import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Enable SSL for CloudStation TCP proxy (port 443) connections
const url = new URL(connectionString)
const needsSsl = url.port === '443' || url.protocol === 'postgres+ssl:'

const client = postgres(connectionString, {
  prepare: false,
  ssl: needsSsl ? 'require' : false,
})

export const db = drizzle(client, { schema })
