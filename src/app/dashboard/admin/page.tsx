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
    <div className="p-4 sm:p-6 page-enter">
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-emerald-950">Admin Dashboard</h1>
          <p className="text-emerald-900/75 mt-1">Manage club content and users</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-xl p-6">
            <p className="text-emerald-900/75 text-sm font-semibold">Total Users</p>
            <p className="text-3xl font-black text-emerald-950 mt-2">{users?.length || 0}</p>
          </div>
          <div className="glass-card rounded-xl p-6">
            <p className="text-emerald-900/75 text-sm font-semibold">Subjects</p>
            <p className="text-3xl font-black text-emerald-950 mt-2">{subjects?.length || 0}</p>
          </div>
          <div className="glass-card rounded-xl p-6">
            <p className="text-emerald-900/75 text-sm font-semibold">Present Today</p>
            <p className="text-3xl font-black text-emerald-950 mt-2">
              {todayAttendance?.filter((a) => a.attended).length || 0}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6">
            <p className="text-emerald-900/75 text-sm font-semibold">Absent Today</p>
            <p className="text-3xl font-black text-emerald-950 mt-2">
              {todayAttendance?.filter((a) => !a.attended).length || 0}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            href="/dashboard/admin/subjects"
            className="glass-card block p-4 rounded-xl hover:border-emerald-300 transition-all"
          >
            <h3 className="font-bold text-emerald-950">Manage Subjects</h3>
            <p className="text-sm text-emerald-900/75 mt-1">Create and organize subjects</p>
          </Link>
          <Link
            href="/dashboard/admin/weeks"
            className="glass-card block p-4 rounded-xl hover:border-emerald-300 transition-all"
          >
            <h3 className="font-bold text-emerald-950">Manage Weeks</h3>
            <p className="text-sm text-emerald-900/75 mt-1">Organize content by week</p>
          </Link>
          <Link
            href="/dashboard/admin/resources"
            className="glass-card block p-4 rounded-xl hover:border-emerald-300 transition-all"
          >
            <h3 className="font-bold text-emerald-950">Manage Resources</h3>
            <p className="text-sm text-emerald-900/75 mt-1">Upload files and links</p>
          </Link>
          <Link
            href="/dashboard/admin/users"
            className="glass-card block p-4 rounded-xl hover:border-emerald-300 transition-all"
          >
            <h3 className="font-bold text-emerald-950">Manage Users</h3>
            <p className="text-sm text-emerald-900/75 mt-1">Control user roles</p>
          </Link>
          <Link
            href="/dashboard/admin/attendance"
            className="glass-card block p-4 rounded-xl hover:border-emerald-300 transition-all"
          >
            <h3 className="font-bold text-emerald-950">Attendance</h3>
            <p className="text-sm text-emerald-900/75 mt-1">Track club attendance</p>
          </Link>
          <Link
            href="/dashboard/admin/inventory"
            className="glass-card block p-4 rounded-xl hover:border-emerald-300 transition-all"
          >
            <h3 className="font-bold text-emerald-950">Inventory</h3>
            <p className="text-sm text-emerald-900/75 mt-1">Manage items and stock</p>
          </Link>
          <Link
            href="/dashboard/admin/gallery"
            className="glass-card block p-4 rounded-xl hover:border-emerald-300 transition-all"
          >
            <h3 className="font-bold text-emerald-950">Activity Gallery</h3>
            <p className="text-sm text-emerald-900/75 mt-1">Post and manage club activity images</p>
          </Link>
          <Link
            href="/dashboard/admin/projects"
            className="glass-card block p-4 rounded-xl hover:border-emerald-300 transition-all"
          >
            <h3 className="font-bold text-emerald-950">Student Projects</h3>
            <p className="text-sm text-emerald-900/75 mt-1">Create projects and assign them to students</p>
          </Link>
        </div>

        {/* Recent Users */}
        <div className="glass-card rounded-xl">
          <div className="p-6 border-b border-emerald-900/10">
            <h2 className="text-lg font-bold text-emerald-950">Recent Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50/70 border-b border-emerald-900/10">
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
                      <td className="px-6 py-3 text-sm text-emerald-950">{u.full_name || '—'}</td>
                      <td className="px-6 py-3 text-sm text-emerald-900/80">{u.email}</td>
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
                      <td className="px-6 py-3 text-sm text-emerald-900/70">
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
