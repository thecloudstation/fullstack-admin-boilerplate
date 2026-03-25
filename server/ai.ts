import OpenAI from 'openai'
import { getEnv } from './env'

interface DraftEmailInput {
  recipientName: string
  company: string
  jobTitle: string
  industry: string
  context?: string
}

interface DraftEmailOutput {
  subject: string
  body: string
}

function getOpenAIClient(): OpenAI | null {
  const env = getEnv()
  if (!env.OPENAI_API_KEY) return null

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
  })
}

function getMockResponse(input: DraftEmailInput): DraftEmailOutput {
  return {
    subject: `Helping ${input.company} accelerate growth in ${input.industry}`,
    body: [
      `Hi ${input.recipientName},`,
      '',
      `I came across ${input.company} and was impressed by what your team is doing in the ${input.industry} space.`,
      '',
      `As ${input.jobTitle}, you likely deal with the challenge of scaling operations while keeping quality high. We have been helping similar companies streamline that exact problem, and I thought it might be worth a quick conversation.`,
      '',
      `Would you be open to a brief 15-minute call this week to see if there is a fit?`,
      '',
      'Best,',
      'Alex',
    ].join('\n'),
  }
}

const SYSTEM_PROMPT = `You are a world-class B2B sales copywriter who specializes in cold outreach that actually gets replies. Your emails are concise, personalized, and value-driven.

Guidelines:
- Keep the email under 150 words (shorter emails get higher response rates)
- Open with something specific to the recipient's company or role — never generic flattery
- Focus on a single, concrete pain point relevant to their industry and job title
- Articulate value in terms of outcomes (revenue, time saved, risk reduced), not features
- Close with a low-friction call to action (e.g., "Would a 15-minute call this week make sense?")
- Tone: confident, conversational, and respectful of their time
- Write as a real person named Alex — no placeholders like [Your Name] or [Company]
- Use line breaks (\\n) between paragraphs for readability

You MUST respond with a JSON object in this exact format:
{"subject": "Short, compelling subject line", "body": "Full email body with \\n for line breaks"}`

export async function draftEmail(
  input: DraftEmailInput
): Promise<DraftEmailOutput> {
  const client = getOpenAIClient()

  if (!client) {
    return getMockResponse(input)
  }

  const userPrompt = `Draft a cold outreach email for the following lead:

- Name: ${input.recipientName}
- Company: ${input.company}
- Job Title: ${input.jobTitle}
- Industry: ${input.industry}${input.context ? `\n- Additional context: ${input.context}` : ''}`

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content returned from AI model')
  }

  const parsed: unknown = JSON.parse(content)

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).subject !== 'string' ||
    typeof (parsed as Record<string, unknown>).body !== 'string'
  ) {
    throw new Error('AI returned an invalid response format')
  }

  return {
    subject: (parsed as DraftEmailOutput).subject,
    body: (parsed as DraftEmailOutput).body,
  }
}
