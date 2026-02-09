import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()

  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: false })

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0]
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('*, user:users(*)')
    .eq('event_date', today)

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage club content and users</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{users?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Subjects</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{subjects?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Present Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {todayAttendance?.filter((a) => a.attended).length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Absent Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {todayAttendance?.filter((a) => !a.attended).length || 0}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            href="/dashboard/admin/subjects"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-gray-900">Manage Subjects</h3>
            <p className="text-sm text-gray-600 mt-1">Create and organize subjects</p>
          </Link>
          <Link
            href="/dashboard/admin/weeks"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-gray-900">Manage Weeks</h3>
            <p className="text-sm text-gray-600 mt-1">Organize content by week</p>
          </Link>
          <Link
            href="/dashboard/admin/resources"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-gray-900">Manage Resources</h3>
            <p className="text-sm text-gray-600 mt-1">Upload files and links</p>
          </Link>
          <Link
            href="/dashboard/admin/users"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-600 mt-1">Control user roles</p>
          </Link>
          <Link
            href="/dashboard/admin/attendance"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-gray-900">Attendance</h3>
            <p className="text-sm text-gray-600 mt-1">Track club attendance</p>
          </Link>
          <Link
            href="/dashboard/admin/inventory"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-gray-900">Inventory</h3>
            <p className="text-sm text-gray-600 mt-1">Manage items and stock</p>
          </Link>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users && users.length > 0 ? (
                  users.slice(0, 10).map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{u.full_name || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            u.role === 'admin'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No users yet
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
