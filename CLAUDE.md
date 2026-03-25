# Fullstack Admin Boilerplate

A production-ready full-stack starter for building authenticated web apps with AI capabilities, contract-first APIs, and 30+ shadcn/ui components.

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS 4, shadcn/ui, TanStack Router, TanStack React Query, Framer Motion
- **Backend**: Hono (port 3100) with `@hono/zod-openapi` for typed routes
- **Auth**: Better Auth (email/password + optional Google/GitHub OAuth) with httpOnly cookie sessions
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI SDK (gpt-4o-mini) with mock fallback when no API key is set
- **API Contract**: OpenAPI 3.1.0 auto-generated from route definitions, Orval generates typed React Query hooks
- **Logging**: Pino (pretty in dev, JSON in prod)

## Project Structure

```
server/                     # Hono backend (runs on port 3100)
  index.ts                  # App entry — OpenAPIHono, middleware, route mounting
  auth.ts                   # Better Auth config (email/password + OAuth)
  db.ts                     # Drizzle + postgres connection
  schema.ts                 # Drizzle DB schema (user, session, account, verification)
  ai.ts                     # OpenAI client + draftEmail function
  env.ts                    # Zod env validation
  logger.ts                 # Pino logger
  routes/                   # OpenAPI route definitions
    health.ts               # GET /health
    ai.ts                   # POST /api/ai/draft-email
src/                        # React frontend (Vite, port 5174)
  lib/
    auth-client.ts          # Better Auth React client (signIn, signUp, signOut, useSession)
    api/
      custom-fetch.ts       # Fetch wrapper for generated hooks
      generated.ts          # Auto-generated React Query hooks (DO NOT EDIT)
  features/                 # Feature modules (auth, dashboard, etc.)
  components/               # shadcn/ui components + layout
  routes/                   # TanStack Router file-based routes
    _authenticated/         # Protected routes (requires session)
    (auth)/                 # Auth pages (sign-in, sign-up, etc.)
drizzle.config.ts           # Drizzle Kit config
orval.config.ts             # Orval codegen config
.env                        # Local env vars (gitignored)
.env.example                # Env var template
```

## Commands

```bash
npm run dev                 # Start both servers (Hono + Vite) concurrently
npm run dev:server          # Start Hono backend only (port 3100)
npm run dev:client          # Start Vite frontend only (port 5174)
npm run db:push             # Push Drizzle schema to PostgreSQL
npm run db:studio           # Open Drizzle Studio (DB browser)
npm run api:generate        # Generate React Query hooks from OpenAPI spec (backend must be running)
npm run build               # Production build
npm run lint                # ESLint
```

## How to Add a New API Endpoint

This is a contract-first workflow. The route definition IS the contract — it generates the OpenAPI spec, validates requests, and produces typed frontend hooks.

### Step 1: Define the route in `server/routes/`

Create a new file, e.g., `server/routes/leads.ts`:

```typescript
import { createRoute, z } from '@hono/zod-openapi'

const createLeadSchema = z.object({
  name: z.string().min(1).openapi({ example: 'Jane Smith' }),
  email: z.string().email().openapi({ example: 'jane@acme.com' }),
  company: z.string().min(1).openapi({ example: 'Acme Corp' }),
}).openapi('CreateLeadRequest')

const leadSchema = z.object({
  id: z.string().openapi({ example: 'abc123' }),
  name: z.string(),
  email: z.string(),
  company: z.string(),
  createdAt: z.string().openapi({ example: '2025-01-01T00:00:00Z' }),
}).openapi('Lead')

export const createLeadRoute = createRoute({
  method: 'post',
  path: '/api/leads',
  tags: ['Leads'],
  summary: 'Create a new lead',
  request: {
    body: { required: true, content: { 'application/json': { schema: createLeadSchema } } },
  },
  responses: {
    201: { description: 'Lead created', content: { 'application/json': { schema: leadSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: errorResponseSchema } } },
  },
})

export const listLeadsRoute = createRoute({
  method: 'get',
  path: '/api/leads',
  tags: ['Leads'],
  summary: 'List all leads',
  responses: {
    200: { description: 'Lead list', content: { 'application/json': { schema: z.array(leadSchema) } } },
  },
})
```

### Step 2: Mount the route in `server/index.ts`

```typescript
import { createLeadRoute, listLeadsRoute } from './routes/leads'

app.openapi(createLeadRoute, async (c) => {
  const body = c.req.valid('json')  // Already validated by Zod
  const [lead] = await db.insert(leadsTable).values(body).returning()
  return c.json(lead, 201)
})

app.openapi(listLeadsRoute, async (c) => {
  const leads = await db.select().from(leadsTable)
  return c.json(leads, 200)
})
```

### Step 3: Generate frontend hooks

```bash
npm run dev:server          # Backend must be running
npm run api:generate        # Orval reads /api/doc and generates hooks
```

This creates typed hooks in `src/lib/api/generated.ts`:

```typescript
// Auto-generated — use in any React component:
import { useListLeads, useCreateLead } from '@/lib/api/generated'

const { data: leads, isLoading } = useListLeads()
const { mutate: createLead } = useCreateLead()

createLead({ data: { name: 'Jane', email: 'jane@acme.com', company: 'Acme' } })
```

## How to Add a Database Table

### Step 1: Add the table to `server/schema.ts`

```typescript
export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

### Step 2: Push to database

```bash
npm run db:push
```

### Step 3: Query with Drizzle in route handlers

```typescript
import { db } from '../db'
import { leads } from '../schema'

const allLeads = await db.select().from(leads)
const [newLead] = await db.insert(leads).values({ id: crypto.randomUUID(), ...body }).returning()
```

## Authentication

Auth is handled by Better Auth. The frontend uses these functions from `src/lib/auth-client.ts`:

```typescript
import { signIn, signUp, signOut, useSession, getSession } from '@/lib/auth-client'

// Sign up
await signUp.email({ name: 'Jane', email: 'jane@test.com', password: 'pass123' })

// Sign in
await signIn.email({ email: 'jane@test.com', password: 'pass123' })

// Sign out
await signOut()

// Get session in components
const { data: session } = useSession()
session.user.name   // "Jane"
session.user.email  // "jane@test.com"

// Check session in route guards (beforeLoad)
const { data: session } = await getSession()
if (!session) throw redirect({ to: '/sign-in' })
```

Auth routes are managed by Better Auth at `/api/auth/*` and are NOT in the OpenAPI spec (they're a black-box handler).

## Route Guards

- **Protected routes** (`src/routes/_authenticated/route.tsx`): `beforeLoad` checks `getSession()`, redirects to `/sign-in` if no session.
- **Guest routes** (`src/routes/(auth)/sign-in.tsx`, `sign-up.tsx`, `sign-in-2.tsx`): `beforeLoad` checks `getSession()`, redirects to `/` if already logged in.

To add a new protected page, create it under `src/routes/_authenticated/`. The guard is inherited automatically.

## AI Integration

The AI module is at `server/ai.ts`. It exports `draftEmail()` which:
- Uses OpenAI (`gpt-4o-mini`) when `OPENAI_API_KEY` is set in `.env`
- Returns a mock personalized email when no key is set (boilerplate works without OpenAI)

To add new AI features, create functions in `server/ai.ts` and expose them via new OpenAPI routes.

## API Documentation

- **Swagger UI**: `http://localhost:3100/api/reference` (interactive)
- **OpenAPI JSON**: `http://localhost:3100/api/doc` (raw spec)

## Environment Variables

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — 32+ char secret for session signing

Optional:
- `BETTER_AUTH_URL` — Backend URL (defaults to http://localhost:3100)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth
- `OPENAI_API_KEY` — Enables real AI email drafting (mock without it)
- `OPENAI_BASE_URL` — Custom OpenAI-compatible endpoint

## Key Patterns

- **Contract-first API**: Route definitions in `server/routes/` auto-generate OpenAPI spec + frontend hooks. Never write fetch calls manually.
- **Zod everywhere**: Env validation (`server/env.ts`), request validation (route schemas), form validation (React Hook Form + Zod).
- **Session from hooks**: Use `useSession()` in components for user data. Use `getSession()` in route guards.
- **shadcn/ui components**: Import from `@/components/ui/`. 30+ components available (button, dialog, table, card, etc.).
- **File-based routing**: TanStack Router. Add files to `src/routes/` and they become routes automatically.
- **Dark mode**: Built-in via `ThemeProvider`. Toggle with the appearance settings page.
