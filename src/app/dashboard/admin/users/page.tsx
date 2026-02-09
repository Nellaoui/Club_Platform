import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateUserGrade, updateUserRole } from '@/app/actions/auth'

export default async function AdminUsersPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()
  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false })

  const admins = (users || []).filter((u) => u.role === 'admin')
  const students = (users || []).filter((u) => u.role === 'student')

  const studentsByGrade = new Map<number | null, typeof users>()
  students.forEach((u) => {
    const key = typeof u.grade === 'number' ? u.grade : null
    const list = studentsByGrade.get(key) || []
    list.push(u)
    studentsByGrade.set(key, list)
  })

  const sortedGrades = Array.from(studentsByGrade.keys())
    .filter((g): g is number => typeof g === 'number')
    .sort((a, b) => a - b)

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard/admin" className="text-emerald-700 text-sm font-medium underline decoration-emerald-300 hover:text-emerald-800 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>

        <div className="space-y-6">
          {users && users.length > 0 ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Admins</h2>
                  <p className="text-sm text-gray-600">{admins.length} admin(s)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {admins.length > 0 ? (
                        admins.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm text-gray-900 font-medium">{u.full_name || '—'}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                            <td className="px-6 py-3">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                admin
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <form
                                action={async (formData) => {
                                  'use server'
                                  const gradeValue = String(formData.get('grade') || '')
                                  const grade = gradeValue ? Number(gradeValue) : null
                                  await updateUserGrade(u.id, Number.isFinite(grade) ? grade : null)
                                }}
                              >
                                <select
                                  name="grade"
                                  defaultValue={typeof u.grade === 'number' ? String(u.grade) : ''}
                                  className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                                >
                                  <option value="">Unassigned</option>
                                  {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                                <button type="submit" className="ml-2 text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                                  Save
                                </button>
                              </form>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              {u.id !== user.id && (
                                <form
                                  action={async () => {
                                    'use server'
                                    await updateUserRole(u.id, 'student')
                                  }}
                                >
                                  <button type="submit" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                    Make Student
                                  </button>
                                </form>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                            No admins found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {sortedGrades.map((grade) => {
                const gradeUsers = studentsByGrade.get(grade) || []
                return (
                  <div key={grade} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900">Grade {grade}</h2>
                      <p className="text-sm text-gray-600">{gradeUsers.length} student(s)</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {gradeUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-sm text-gray-900 font-medium">{u.full_name || '—'}</td>
                              <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                              <td className="px-6 py-3">
                                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                                  student
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm">
                                <form
                                  action={async (formData) => {
                                    'use server'
                                    const gradeValue = String(formData.get('grade') || '')
                                    const grade = gradeValue ? Number(gradeValue) : null
                                    await updateUserGrade(u.id, Number.isFinite(grade) ? grade : null)
                                  }}
                                >
                                  <select
                                    name="grade"
                                    defaultValue={typeof u.grade === 'number' ? String(u.grade) : ''}
                                    className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                                  >
                                    <option value="">Unassigned</option>
                                    {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
                                      <option key={g} value={g}>{g}</option>
                                    ))}
                                  </select>
                                  <button type="submit" className="ml-2 text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                                    Save
                                  </button>
                                </form>
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-500">
                                {new Date(u.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-3 text-sm">
                                {u.id !== user.id && (
                                  <form
                                    action={async () => {
                                      'use server'
                                      await updateUserRole(u.id, 'admin')
                                    }}
                                  >
                                    <button
                                      type="submit"
                                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                      Make Admin
                                    </button>
                                  </form>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}

              {studentsByGrade.has(null) && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Unassigned Grade</h2>
                    <p className="text-sm text-gray-600">{studentsByGrade.get(null)?.length || 0} student(s)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grade</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(studentsByGrade.get(null) || []).map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm text-gray-900 font-medium">{u.full_name || '—'}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                            <td className="px-6 py-3">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                                student
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <form
                                action={async (formData) => {
                                  'use server'
                                  const gradeValue = String(formData.get('grade') || '')
                                  const grade = gradeValue ? Number(gradeValue) : null
                                  await updateUserGrade(u.id, Number.isFinite(grade) ? grade : null)
                                }}
                              >
                                <select
                                  name="grade"
                                  defaultValue={typeof u.grade === 'number' ? String(u.grade) : ''}
                                  className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                                >
                                  <option value="">Unassigned</option>
                                  {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                                <button type="submit" className="ml-2 text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                                  Save
                                </button>
                              </form>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              {u.id !== user.id && (
                                <form
                                  action={async () => {
                                    'use server'
                                    await updateUserRole(u.id, 'admin')
                                  }}
                                >
                                  <button type="submit" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                    Make Admin
                                  </button>
                                </form>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
