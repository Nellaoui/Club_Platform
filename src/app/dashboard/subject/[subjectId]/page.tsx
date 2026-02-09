import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface SubjectPageProps {
  params: Promise<{
    subjectId: string
  }>
  searchParams: Promise<{
    week?: string
  }>
}

export default async function SubjectPage({ params, searchParams }: SubjectPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const { subjectId } = await params
  const { week: selectedWeekId } = await searchParams

  const supabase = await createServerSupabaseClient()

  // Get subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single()

  if (!subject) {
    notFound()
  }

  // Get weeks
  const { data: weeks } = await supabase
    .from('weeks')
    .select('*')
    .eq('subject_id', subjectId)
    .order('week_number', { ascending: true })

  // Get resources for each week
  const weekResources: Record<string, any[]> = {}

  if (weeks) {
    for (const week of weeks) {
      let resourcesQuery = supabase
        .from('resources')
        .select('*')
        .eq('week_id', week.id)
        .order('created_at', { ascending: false })

      if (user.role !== 'admin') {
        if (typeof user.grade === 'number') {
          resourcesQuery = resourcesQuery.or(`allowed_grade.is.null,allowed_grade.eq.${user.grade}`)
        } else {
          resourcesQuery = resourcesQuery.is('allowed_grade', null)
        }
      }

      const { data: resources } = await resourcesQuery
      weekResources[week.id] = resources || []
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-emerald-600 text-sm hover:text-emerald-700 mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
          {subject.description && (
            <p className="text-gray-600 mt-2">{subject.description}</p>
          )}
        </div>

        {/* Weeks and Resources */}
        <div className="space-y-6">
          {weeks && weeks.length > 0 ? (
            weeks.map((week) => (
              <div
                key={week.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">
                    Week {week.week_number}: {week.title}
                  </h2>
                  {week.description && (
                    <p className="text-gray-600 text-sm mt-1">{week.description}</p>
                  )}
                </div>

                <div className="p-6">
                  {weekResources[week.id] && weekResources[week.id].length > 0 ? (
                    <div className="space-y-3">
                      {weekResources[week.id].map((resource) => (
                        <Link
                          key={resource.id}
                          href={`/dashboard/resource/${resource.id}`}
                          className="block p-3 border border-gray-300 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 group-hover:text-emerald-600 truncate">
                                {resource.title}
                              </h3>
                              {resource.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {resource.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {resource.type.toUpperCase()}
                              </p>
                            </div>
                            <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded whitespace-nowrap">
                              {resource.type}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-6">No resources for this week yet</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No weeks have been created for this subject yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
