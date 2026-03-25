import { createRoute, z } from '@hono/zod-openapi'

const draftEmailRequestSchema = z
  .object({
    recipientName: z
      .string()
      .min(1, 'recipientName is required')
      .openapi({ example: 'Jane Smith' }),
    company: z
      .string()
      .min(1, 'company is required')
      .openapi({ example: 'Acme Corp' }),
    jobTitle: z
      .string()
      .min(1, 'jobTitle is required')
      .openapi({ example: 'VP of Engineering' }),
    industry: z
      .string()
      .min(1, 'industry is required')
      .openapi({ example: 'SaaS' }),
    context: z
      .string()
      .optional()
      .openapi({ example: 'Recently raised Series B' }),
  })
  .openapi('DraftEmailRequest')

const draftEmailResponseSchema = z
  .object({
    subject: z
      .string()
      .openapi({ example: 'Helping Acme Corp accelerate growth in SaaS' }),
    body: z.string().openapi({
      example:
        'Hi Jane,\n\nI came across Acme Corp and was impressed...\n\nBest,\nAlex',
    }),
  })
  .openapi('DraftEmailResponse')

const errorResponseSchema = z
  .object({
    error: z.string().openapi({ example: 'Validation failed' }),
    details: z.record(z.array(z.string())).optional().openapi({
      example: { recipientName: ['recipientName is required'] },
    }),
  })
  .openapi('ErrorResponse')

export const draftEmailRoute = createRoute({
  method: 'post',
  path: '/api/ai/draft-email',
  tags: ['AI'],
  summary: 'Draft a cold outreach email',
  description:
    'Uses AI to generate a personalized B2B cold outreach email based on lead information.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: draftEmailRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully generated email draft',
      content: {
        'application/json': {
          schema: draftEmailResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
})
