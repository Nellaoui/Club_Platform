import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const user = await getCurrentUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Redirect unauthenticated users to login
  redirect('/login')
}
