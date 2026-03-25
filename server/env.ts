import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

export type Env = z.infer<typeof envSchema>

let env: Env | null = null

export function getEnv(): Env {
  if (env) return env

  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error(
      'Environment validation failed:',
      result.error.flatten().fieldErrors
    )
    throw new Error('Missing or invalid environment variables')
  }

  env = result.data
  return env
}
