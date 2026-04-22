import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.approved === false) {
    redirect('/pending-approval')
  }

  const supabase = await createServerSupabaseClient()
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen page-enter px-2 sm:px-4 py-3 sm:py-5">
      <div className="app-shell flex gap-3 sm:gap-5">
        {/* Sidebar - hidden on small screens */}
        <aside className="hidden sm:flex w-72 glass-card rounded-2xl flex-col overflow-hidden">
          <div className="p-4 border-b border-emerald-900/10">
            <h2 className="font-bold text-emerald-950 text-lg">Navigation</h2>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <Link
              href="/dashboard"
              className="nav-pill block px-3 py-2 text-sm text-emerald-950"
            >
              Dashboard Home
            </Link>
            <Link
              href="/dashboard/gallery"
              className="nav-pill block px-3 py-2 text-sm text-emerald-950"
            >
              Activity Gallery
            </Link>

            <p className="text-xs uppercase tracking-wide text-emerald-800/75 px-3 pt-4">Subjects</p>
            {subjects && subjects.length > 0 ? (
              subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/dashboard/subject/${subject.id}`}
                  className="nav-pill block px-3 py-2 text-sm text-emerald-950"
                >
                  {subject.name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-emerald-900/70 px-3">No subjects yet</p>
            )}
          </nav>

          {user.role === 'admin' && (
            <div className="p-4 border-t border-emerald-900/10">
              <Link
                href="/dashboard/admin"
                className="block w-full bg-emerald-700 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-800 text-center"
              >
                Admin Panel
              </Link>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
