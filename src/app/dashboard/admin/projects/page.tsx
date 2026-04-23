import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
import {
  assignProjectToStudentAction,
  assignStudentToTeamAction,
  awardBadgeAction,
  createProjectAction,
  createProjectTeamAction,
  issueCertificateAction,
  seedDefaultProjectsAction,
} from '@/app/actions/projects'

interface ProjectRow {
  id: string
  title: string
  description: string | null
  difficulty: 'Beginner' | 'Medium' | 'Advanced'
  subject_tag: 'Coding' | 'Robotics' | 'AI' | 'Game Development' | 'STEM' | 'Competition'
  club_category: 'Beginner Club' | 'Coding Club' | 'Robotics Club' | 'AI Club' | 'Competition Zone'
  due_date: string | null
  featured_order: number | null
  created_at: string
}

interface StudentRow {
  id: string
  full_name: string | null
  email: string
}

interface AssignmentRow {
  id: string
  user_id: string
  project_id: string
}

interface TeamRow {
  id: string
  project_id: string
  name: string
}

interface TeamMemberRow {
  id: string
  team_id: string
  user_id: string
}

export default async function AdminProjectsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: projectsData }, { data: studentsData }, { data: assignmentsData }, { data: teamsData }, { data: teamMembersData }] = await Promise.all([
    admin.from('projects').select('id, title, description, difficulty, subject_tag, club_category, due_date, featured_order, created_at').order('created_at', { ascending: false }),
    admin.from('users').select('id, full_name, email').eq('role', 'student').order('full_name', { ascending: true }),
    admin.from('project_assignments').select('id, user_id, project_id'),
    admin.from('project_teams').select('id, project_id, name').order('created_at', { ascending: false }),
    admin.from('project_team_members').select('id, team_id, user_id'),
  ])

  const projects = (projectsData || []) as ProjectRow[]
  const students = (studentsData || []) as StudentRow[]
  const assignments = (assignmentsData || []) as AssignmentRow[]
  const teams = (teamsData || []) as TeamRow[]
  const teamMembers = (teamMembersData || []) as TeamMemberRow[]

  const assignedCountByProject = new Map<string, number>()
  assignments.forEach((a) => {
    assignedCountByProject.set(a.project_id, (assignedCountByProject.get(a.project_id) || 0) + 1)
  })

  const teamsByProject = new Map<string, TeamRow[]>()
  teams.forEach((team) => {
    const list = teamsByProject.get(team.project_id) || []
    list.push(team)
    teamsByProject.set(team.project_id, list)
  })

  const memberCountByTeam = new Map<string, number>()
  teamMembers.forEach((member) => {
    memberCountByTeam.set(member.team_id, (memberCountByTeam.get(member.team_id) || 0) + 1)
  })

  return (
    <div className="p-4 sm:p-6 page-enter">
      <div className="max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard/admin" className="text-emerald-700 text-sm font-medium underline decoration-emerald-300 hover:text-emerald-800 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-emerald-950">Manage Student Projects</h1>
          <p className="text-emerald-900/75 mt-1">Create projects, assign students, build teams, and issue rewards.</p>
          <form action={seedDefaultProjectsAction} className="mt-4">
            <button type="submit" className="bg-emerald-900 text-white px-4 py-2 rounded-xl hover:bg-emerald-950 text-sm">
              Seed Full Project Catalog (34 Projects)
            </button>
          </form>
        </div>

        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Create Project</h2>
          <form action={createProjectAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Project Title</label>
              <input name="title" required className="w-full rounded-xl px-3 py-2 text-sm" placeholder="Build a line-following robot" />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Description</label>
              <input name="description" className="w-full rounded-xl px-3 py-2 text-sm" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Difficulty</label>
              <select name="difficulty" defaultValue="Beginner" className="w-full rounded-xl px-3 py-2 text-sm">
                <option value="Beginner">Beginner</option>
                <option value="Medium">Medium</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Subject Tag</label>
              <select name="subjectTag" defaultValue="Coding" className="w-full rounded-xl px-3 py-2 text-sm">
                <option value="Coding">Coding</option>
                <option value="Robotics">Robotics</option>
                <option value="AI">AI</option>
                <option value="Game Development">Game Development</option>
                <option value="STEM">STEM</option>
                <option value="Competition">Competition</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Club Category</label>
              <select name="clubCategory" defaultValue="Beginner Club" className="w-full rounded-xl px-3 py-2 text-sm">
                <option value="Beginner Club">Beginner Club</option>
                <option value="Coding Club">Coding Club</option>
                <option value="Robotics Club">Robotics Club</option>
                <option value="AI Club">AI Club</option>
                <option value="Competition Zone">Competition Zone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Due Date</label>
              <input name="dueDate" type="date" className="w-full rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800">
                Create Project
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Assign Project to Student</h2>
          <form action={assignProjectToStudentAction} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Project</label>
              <select name="projectId" required className="w-full rounded-xl px-3 py-2 text-sm">
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Student</label>
              <select name="userId" required className="w-full rounded-xl px-3 py-2 text-sm">
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800 w-full">
                Assign
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Team Projects</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <form action={createProjectTeamAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-emerald-900/10 bg-white/60">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Project</label>
                <select name="projectId" required className="w-full rounded-xl px-3 py-2 text-sm">
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Team Name</label>
                <input name="teamName" required className="w-full rounded-xl px-3 py-2 text-sm" placeholder="Team Alpha" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800 w-full">
                  Create Team
                </button>
              </div>
            </form>

            <form action={assignStudentToTeamAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-emerald-900/10 bg-white/60">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Team</label>
                <select name="teamId" required className="w-full rounded-xl px-3 py-2 text-sm">
                  <option value="">Select team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Student</label>
                <select name="userId" required className="w-full rounded-xl px-3 py-2 text-sm">
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800 w-full">
                  Add Student To Team
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Badges & Certificates</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <form action={awardBadgeAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-emerald-900/10 bg-white/60">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Student</label>
                <select name="userId" required className="w-full rounded-xl px-3 py-2 text-sm">
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Project (optional)</label>
                <select name="projectId" className="w-full rounded-xl px-3 py-2 text-sm">
                  <option value="">General badge</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-emerald-900 mb-1">Badge Name</label>
                <input name="badgeName" required className="w-full rounded-xl px-3 py-2 text-sm" placeholder="Top Innovator" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800 w-full">
                  Award Badge
                </button>
              </div>
            </form>

            <form action={issueCertificateAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-emerald-900/10 bg-white/60">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Student</label>
                <select name="userId" required className="w-full rounded-xl px-3 py-2 text-sm">
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Project (optional)</label>
                <select name="projectId" className="w-full rounded-xl px-3 py-2 text-sm">
                  <option value="">General certificate</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Certificate Title</label>
                <input name="certificateTitle" required className="w-full rounded-xl px-3 py-2 text-sm" placeholder="Project Completion Certificate" />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Certificate URL</label>
                <input name="certificateUrl" className="w-full rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800 w-full">
                  Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Project List</h2>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="rounded-xl border border-emerald-900/10 bg-white/60 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-emerald-950">{project.title}</h3>
                      {project.description && <p className="text-sm text-emerald-900/75 mt-1">{project.description}</p>}
                      <div className="text-xs text-emerald-900/70 mt-2 flex flex-wrap gap-2">
                        <span className="chip">{project.difficulty}</span>
                        <span className="chip">{project.subject_tag}</span>
                        <span className="chip">{project.club_category}</span>
                        {project.due_date && <span className="chip">Due {new Date(project.due_date).toLocaleDateString()}</span>}
                        {project.featured_order && <span className="chip">Launch Top 10 #{project.featured_order}</span>}
                      </div>
                      {(teamsByProject.get(project.id) || []).length > 0 && (
                        <div className="text-xs text-emerald-900/70 mt-2">
                          Teams: {(teamsByProject.get(project.id) || []).map((team) => `${team.name} (${memberCountByTeam.get(team.id) || 0})`).join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="chip">{assignedCountByProject.get(project.id) || 0} student(s)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-emerald-900/70">No projects created yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
