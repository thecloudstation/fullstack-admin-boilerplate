import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/auth-client'
import { SignIn2 } from '@/features/auth/sign-in/sign-in-2'

export const Route = createFileRoute('/(auth)/sign-in-2')({
  beforeLoad: async () => {
    const { data: session } = await getSession()
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: SignIn2,
})
