import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createResourceFromForm, deleteResourceAction } from '@/app/actions/resources'

export default async function AdminResourcesPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()
  const { data: subjects } = await supabase.from('subjects').select('id, name').order('created_at', { ascending: false })
  const { data: weeks } = await supabase.from('weeks').select('*').order('week_number', { ascending: true })
  const { data: resources } = await supabase.from('resources').select('*').order('created_at', { ascending: false })

  const subjectMap = new Map(subjects?.map((s) => [s.id, s.name]) || [])
  const weekMap = new Map(weeks?.map((w) => [w.id, w]) || [])

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard/admin" className="text-emerald-600 text-sm hover:text-emerald-700 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manage Resources</h1>
          <p className="text-gray-600 mt-1">Upload files or add links</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create Resource</h2>
          <form action={createResourceFromForm} encType="multipart/form-data" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
              <select name="weekId" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select week</option>
                {weeks?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {subjectMap.get(w.subject_id) || 'Subject'} — Week {w.week_number}: {w.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                name="title"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Lesson PDF"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="link">Link</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF/Image)</label>
              <input name="file" type="file" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input name="description" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
              <input name="fileUrl" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
              <input name="externalUrl" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
              >
                Create Resource
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Week</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resources && resources.length > 0 ? (
                  resources.map((resource) => {
                    const week = weekMap.get(resource.week_id)
                    return (
                      <tr key={resource.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{resource.title}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {week ? `${subjectMap.get(week.subject_id) || 'Subject'} — Week ${week.week_number}` : '—'}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{resource.type}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {new Date(resource.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-right text-sm">
                          <form
                            action={async () => {
                              'use server'
                              await deleteResourceAction(resource.id)
                            }}
                          >
                            <button type="submit" className="text-red-600 hover:text-red-700 font-medium">
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No resources yet
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
