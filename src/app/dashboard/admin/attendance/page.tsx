import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { recordAttendanceAction as recordAttendance } from '@/app/actions/attendance'

export default async function AdminAttendancePage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()

  // Get today's date
  const today = new Date().toISOString().split('T')[0]

  // Get all users
  const { data: users } = await supabase.from('users').select('*').order('full_name', { ascending: true })

  // Get today's attendance
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('event_date', today)

  const attendanceMap = new Map(attendance?.map((a) => [a.user_id, a.attended]) || [])

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard/admin" className="text-emerald-600 text-sm hover:text-emerald-700 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
          <p className="text-gray-600 mt-1">Date: {new Date(today).toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users && users.length > 0 ? (
                  users.map((u) => {
                    const isAttendant = attendanceMap.get(u.id)
                    return (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{u.full_name || '—'}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              isAttendant === true
                                ? 'bg-green-100 text-green-700'
                                : isAttendant === false
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {isAttendant === true ? 'Present' : isAttendant === false ? 'Absent' : 'Not Marked'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center space-x-2">
                          <form
                            action={async () => {
                              'use server'
                              await recordAttendance(u.id, today, true)
                            }}
                            className="inline"
                          >
                            <button
                              type="submit"
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                isAttendant === true
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-green-100 hover:text-green-700'
                              }`}
                            >
                              ✓ Present
                            </button>
                          </form>
                          <form
                            action={async () => {
                              'use server'
                              await recordAttendance(u.id, today, false)
                            }}
                            className="inline"
                          >
                            <button
                              type="submit"
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                isAttendant === false
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700'
                              }`}
                            >
                              ✗ Absent
                            </button>
                          </form>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No users found
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
