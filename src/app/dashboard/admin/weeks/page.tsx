import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createWeekAction, deleteWeekAction } from '@/app/actions/weeks'

export default async function AdminWeeksPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()
  const { data: subjects } = await supabase.from('subjects').select('id, name').order('created_at', { ascending: false })
  const { data: weeks } = await supabase.from('weeks').select('*').order('week_number', { ascending: true })

  const subjectMap = new Map(subjects?.map((s) => [s.id, s.name]) || [])

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard/admin" className="text-emerald-600 text-sm hover:text-emerald-700 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manage Weeks</h1>
          <p className="text-gray-600 mt-1">Organize content by week</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create Week</h2>
          <form
            action={async (formData) => {
              'use server'
              const subjectId = String(formData.get('subjectId') || '')
              const weekNumber = Number(formData.get('weekNumber') || 0)
              const title = String(formData.get('title') || '').trim()
              const description = String(formData.get('description') || '').trim()
              const startDate = String(formData.get('startDate') || '')
              const endDate = String(formData.get('endDate') || '')

              if (subjectId && weekNumber > 0 && title) {
                await createWeekAction(
                  subjectId,
                  weekNumber,
                  title,
                  description || undefined,
                  startDate || undefined,
                  endDate || undefined
                )
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select name="subjectId" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select subject</option>
                {subjects?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Number</label>
              <input
                name="weekNumber"
                type="number"
                min={1}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                name="title"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Week 1 Introduction"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                name="description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input name="startDate" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input name="endDate" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
              >
                Create Week
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Week</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dates</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {weeks && weeks.length > 0 ? (
                  weeks.map((week) => (
                    <tr key={week.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                        {subjectMap.get(week.subject_id) || '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{week.week_number}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{week.title}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {week.start_date || '—'} → {week.end_date || '—'}
                      </td>
                      <td className="px-6 py-3 text-right text-sm">
                        <form
                          action={async () => {
                            'use server'
                            await deleteWeekAction(week.id)
                          }}
                        >
                          <button type="submit" className="text-red-600 hover:text-red-700 font-medium">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No weeks yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
