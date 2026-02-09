import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSubjectAction, deleteSubjectAction } from '@/app/actions/subjects'

export default async function AdminSubjectsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard/admin" className="text-emerald-600 text-sm hover:text-emerald-700 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manage Subjects</h1>
          <p className="text-gray-600 mt-1">Create and organize subjects</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create Subject</h2>
          <form
            action={async (formData) => {
              'use server'
              const name = String(formData.get('name') || '').trim()
              const description = String(formData.get('description') || '').trim()
              if (name) {
                await createSubjectAction(name, description || undefined)
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                name="name"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Mathematics"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                name="description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
              >
                Create Subject
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subjects && subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">{subject.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{subject.description || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(subject.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-right text-sm">
                        <form
                          action={async () => {
                            'use server'
                            await deleteSubjectAction(subject.id)
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
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No subjects yet
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
