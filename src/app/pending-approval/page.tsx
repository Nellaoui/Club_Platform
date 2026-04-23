import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { signOut } from '@/app/actions/auth'

export default async function PendingApprovalPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'student' || user.approved === true) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 page-enter">
      <div className="w-full max-w-xl hero-panel rounded-3xl p-8 sm:p-10">
        <p className="chip w-fit mb-4">Access Control</p>
        <h1 className="text-3xl sm:text-4xl font-black text-emerald-950">Account Pending Approval</h1>
        <p className="text-emerald-900/80 mt-4">
          Thanks for signing in. Your account has been created, but access is currently waiting for admin approval.
        </p>
        <p className="text-emerald-900/80 mt-2">
          Once the club admin approves your account, you can sign in again and access the dashboard.
        </p>

        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-900 text-white text-sm font-semibold hover:bg-emerald-950"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
