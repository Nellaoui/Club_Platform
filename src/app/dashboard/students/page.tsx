import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
import { addTeacherCommentToProgressAction } from '@/app/actions/projects'

interface UserRow {
  id: string
  full_name: string | null
  email: string
  grade: number | null
}

interface ProgressRow {
  id: string
  user_id: string
  project_id: string
  title: string
  progress_percent: number
  teacher_comment: string | null
  is_final: boolean
  created_at: string
}

interface ProjectRow {
  id: string
  title: string
}

export default async function StudentsProgressPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: usersData }, { data: progressData }, { data: projectsData }] = await Promise.all([
    admin
      .from('users')
      .select('id, full_name, email, grade')
      .eq('role', 'student')
      .order('full_name', { ascending: true }),
    admin
      .from('student_progress')
      .select('id, user_id, project_id, title, progress_percent, teacher_comment, is_final, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('projects')
      .select('id, title'),
  ])

  const users = (usersData || []) as UserRow[]
  const progress = (progressData || []) as ProgressRow[]
  const projects = (projectsData || []) as ProjectRow[]

  const projectTitleById = new Map(projects.map((p) => [p.id, p.title]))

  const progressByUser = new Map<string, ProgressRow[]>()
  progress.forEach((entry) => {
    const list = progressByUser.get(entry.user_id) || []
    list.push(entry)
    progressByUser.set(entry.user_id, list)
  })

  const leaderboard = users
    .map((student) => {
      const entries = progressByUser.get(student.id) || []
      const maxProgress = entries.reduce((max, e) => Math.max(max, e.progress_percent), 0)
      const finalCount = entries.filter((e) => e.is_final).length
      return {
        id: student.id,
        name: student.full_name || student.email,
        maxProgress,
        finalCount,
      }
    })
    .sort((a, b) => {
      if (b.maxProgress !== a.maxProgress) return b.maxProgress - a.maxProgress
      return b.finalCount - a.finalCount
    })
    .slice(0, 10)

  return (
    <div className="p-4 sm:p-6 page-enter">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-emerald-950">Students Progress Board</h1>
            <p className="text-emerald-900/75 mt-2">See your classmates' latest track updates and final results.</p>
          </div>
          <Link href="/dashboard/profile" className="w-fit px-4 py-2 rounded-xl border border-emerald-900/20 text-emerald-950 hover:bg-emerald-50">
            Back to My Profile
          </Link>
        </div>

        <div className="glass-card rounded-xl p-5 mb-8">
          <h2 className="text-xl font-bold text-emerald-950 mb-3">Leaderboard</h2>
          {leaderboard.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {leaderboard.map((entry, index) => (
                <div key={entry.id} className="rounded-xl border border-emerald-900/10 bg-white/60 p-3">
                  <p className="font-semibold text-emerald-950">#{index + 1} {entry.name}</p>
                  <p className="text-xs text-emerald-900/70 mt-1">Best Progress: {entry.maxProgress}%</p>
                  <p className="text-xs text-emerald-900/70">Final Results: {entry.finalCount}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-emerald-900/70">No leaderboard data yet.</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {users.length > 0 ? (
            users.map((student) => {
              const entries = progressByUser.get(student.id) || []
              const latest = entries[0]
              const finalCount = entries.filter((e) => e.is_final).length

              return (
                <article key={student.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-emerald-950">{student.full_name || student.email}</h2>
                      <p className="text-xs text-emerald-900/65 mt-1">
                        {student.grade ? `Grade ${student.grade}` : 'Grade not set'}
                      </p>
                    </div>
                    <span className="chip">{finalCount} final result(s)</span>
                  </div>

                  {latest ? (
                    <div className="mt-4 rounded-xl bg-white/70 border border-emerald-900/10 p-4">
                      <p className="text-sm font-semibold text-emerald-950">Latest Track: {latest.title}</p>
                      <p className="text-xs text-emerald-900/65 mt-1">
                        Project: {projectTitleById.get(latest.project_id) || 'Unknown project'}
                      </p>
                      <p className="text-sm text-emerald-900/75 mt-1">Progress: {latest.progress_percent}%</p>
                      <p className="text-xs text-emerald-900/60 mt-2">Updated {new Date(latest.created_at).toLocaleDateString()}</p>
                      {latest.teacher_comment && (
                        <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2">
                          <p className="text-xs font-semibold text-emerald-900">Teacher comment</p>
                          <p className="text-sm text-emerald-900/80 mt-1">{latest.teacher_comment}</p>
                        </div>
                      )}

                      {user.role === 'admin' && (
                        <form action={addTeacherCommentToProgressAction} className="mt-3 space-y-2">
                          <input type="hidden" name="progressId" value={latest.id} />
                          <textarea
                            name="teacherComment"
                            className="w-full rounded-xl px-3 py-2 text-sm min-h-20"
                            placeholder="Add teacher feedback"
                            defaultValue={latest.teacher_comment || ''}
                          />
                          <button type="submit" className="bg-emerald-700 text-white px-3 py-2 rounded-xl hover:bg-emerald-800 text-sm">
                            Save Comment
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-emerald-900/70">No updates yet.</p>
                  )}
                </article>
              )
            })
          ) : (
            <p className="text-emerald-900/70">No students found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
