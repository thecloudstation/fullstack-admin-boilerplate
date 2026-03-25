import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/auth-client'
import { SignUp } from '@/features/auth/sign-up'

export const Route = createFileRoute('/(auth)/sign-up')({
  beforeLoad: async () => {
    const { data: session } = await getSession()
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: SignUp,
})
