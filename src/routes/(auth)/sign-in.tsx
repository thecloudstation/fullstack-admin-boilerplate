import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/auth-client'
import { SignIn } from '@/features/auth/sign-in'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  beforeLoad: async () => {
    const { data: session } = await getSession()
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: SignIn,
  validateSearch: searchSchema,
})
