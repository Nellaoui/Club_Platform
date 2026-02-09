import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerSupabaseClient()
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, description')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl">
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-700 font-semibold">Dashboard</p>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">
                  Welcome, {user.full_name || 'Student'}!
                </h1>
                <p className="text-gray-600 mt-1">Browse and engage with club resources</p>
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {typeof user.grade === 'number' ? `Grade ${user.grade}` : 'Grade not set'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects && subjects.length > 0 ? (
            subjects.map((subject) => (
              <Link
                key={subject.id}
                href={`/dashboard/subject/${subject.id}`}
                className="group block p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {subject.name}
                </h3>
                {subject.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{subject.description}</p>
                )}
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No subjects available yet</p>
            </div>
          )}
        </div>

        {subjects && subjects.length === 0 && (
          <div className="mt-8 p-6 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-emerald-900">Get started by exploring available subjects or checking back later for new content.</p>
          </div>
        )}
      </div>
    </div>
  )
}
