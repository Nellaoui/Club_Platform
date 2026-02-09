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

  const supabase = await createServerSupabaseClient()
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - hidden on small screens */}
        <aside className="hidden sm:flex w-64 bg-white border-r border-gray-200 flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 text-lg">Subjects</h2>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {subjects && subjects.length > 0 ? (
              subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/dashboard/subject/${subject.id}`}
                  className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                >
                  {subject.name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 px-3">No subjects yet</p>
            )}
          </nav>

          {user.role === 'admin' && (
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/dashboard/admin"
                className="block w-full bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 text-center"
              >
                Admin Panel
              </Link>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
