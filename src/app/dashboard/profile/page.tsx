import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
import { createProgressEntryAction, uploadProjectMediaAction } from '@/app/actions/progress'
import { updateProfileImageAction } from '@/app/actions/profile'

interface StudentProgressRow {
  id: string
  project_id: string
  title: string
  notes: string | null
  teacher_comment: string | null
  progress_percent: number
  result_link: string | null
  is_final: boolean
  created_at: string
}

interface ProjectMediaRow {
  id: string
  project_id: string
  media_url: string
  media_type: 'image' | 'video'
  caption: string | null
  created_at: string
}

interface StudentBadgeRow {
  id: string
  badge_name: string
  project_id: string | null
  awarded_at: string
}

interface StudentCertificateRow {
  id: string
  certificate_title: string
  certificate_url: string | null
  project_id: string | null
  issued_at: string
}

interface AssignedProjectRow {
  project_id: string
  projects: {
    id: string
    title: string
    description: string | null
    difficulty: 'Beginner' | 'Medium' | 'Advanced'
    subject_tag: 'Coding' | 'Robotics' | 'AI' | 'Game Development' | 'STEM' | 'Competition'
    club_category: 'Beginner Club' | 'Coding Club' | 'Robotics Club' | 'AI Club' | 'Competition Zone'
    due_date: string | null
  }[] | null
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: progressData }, { data: assignedProjectsData }, { data: mediaData }, { data: badgesData }, { data: certificatesData }] = await Promise.all([
    admin
      .from('student_progress')
      .select('id, project_id, title, notes, teacher_comment, progress_percent, result_link, is_final, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('project_assignments')
      .select('project_id, projects(id, title, description, difficulty, subject_tag, club_category, due_date)')
      .eq('user_id', user.id),
    admin
      .from('project_media')
      .select('id, project_id, media_url, media_type, caption, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('student_badges')
      .select('id, badge_name, project_id, awarded_at')
      .eq('user_id', user.id)
      .order('awarded_at', { ascending: false }),
    admin
      .from('student_certificates')
      .select('id, certificate_title, certificate_url, project_id, issued_at')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
  ])

  const entries = (progressData || []) as StudentProgressRow[]
  const assignedProjects = (assignedProjectsData || []) as AssignedProjectRow[]
  const mediaItems = (mediaData || []) as ProjectMediaRow[]
  const badges = (badgesData || []) as StudentBadgeRow[]
  const certificates = (certificatesData || []) as StudentCertificateRow[]

  const projectTitleById = new Map<string, string>()
  assignedProjects.forEach((row) => {
    const project = row.projects?.[0]
    if (project) {
      projectTitleById.set(project.id, project.title)
    }
  })
  const latestProgress = entries[0]?.progress_percent ?? 0
  const finalCount = entries.filter((e) => e.is_final).length

  const entriesByProject = new Map<string, StudentProgressRow[]>()
  entries.forEach((entry) => {
    const list = entriesByProject.get(entry.project_id) || []
    list.push(entry)
    entriesByProject.set(entry.project_id, list)
  })

  const mediaByProject = new Map<string, ProjectMediaRow[]>()
  mediaItems.forEach((item) => {
    const list = mediaByProject.get(item.project_id) || []
    list.push(item)
    mediaByProject.set(item.project_id, list)
  })

  return (
    <div className="p-4 sm:p-6 page-enter">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-emerald-950">My Profile & Track</h1>
          <p className="text-emerald-900/75 mt-2">Track your learning progress and upload your final result.</p>
        </div>

        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-emerald-950 mb-4">Profile Image</h2>
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
            <div className="flex items-center justify-center w-24 h-24 rounded-full overflow-hidden bg-emerald-50 border border-emerald-900/10">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <div className="text-emerald-700 font-black text-2xl">{(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-emerald-900/75 mb-3">
                Upload or paste a new image URL. This image will be used for your profile.
              </p>
              <form action={updateProfileImageAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Upload Photo</label>
                  <input name="imageFile" type="file" accept="image/*" className="w-full rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Or Image URL</label>
                  <input name="imageUrl" className="w-full rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800">
                    Update Profile Image
                  </button>
                  <span className="text-xs text-emerald-900/65">Admins can also update images from the Users page.</span>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-emerald-900/70">Current Progress</p>
            <p className="text-3xl font-black text-emerald-950 mt-1">{latestProgress}%</p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-emerald-900/70">Updates Logged</p>
            <p className="text-3xl font-black text-emerald-950 mt-1">{entries.length}</p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-emerald-900/70">Final Results</p>
            <p className="text-3xl font-black text-emerald-950 mt-1">{finalCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-bold text-emerald-950 mb-3">My Badges</h2>
            {badges.length > 0 ? (
              <div className="space-y-2">
                {badges.map((badge) => (
                  <div key={badge.id} className="rounded-xl border border-emerald-900/10 bg-white/60 p-3">
                    <p className="font-semibold text-emerald-950">{badge.badge_name}</p>
                    <p className="text-xs text-emerald-900/65 mt-1">
                      {badge.project_id ? `Project: ${projectTitleById.get(badge.project_id) || 'Unknown'}` : 'General badge'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-900/70">No badges yet.</p>
            )}
          </div>

          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-bold text-emerald-950 mb-3">My Certificates</h2>
            {certificates.length > 0 ? (
              <div className="space-y-2">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="rounded-xl border border-emerald-900/10 bg-white/60 p-3">
                    <p className="font-semibold text-emerald-950">{certificate.certificate_title}</p>
                    <p className="text-xs text-emerald-900/65 mt-1">
                      {certificate.project_id ? `Project: ${projectTitleById.get(certificate.project_id) || 'Unknown'}` : 'General certificate'}
                    </p>
                    {certificate.certificate_url && (
                      <a href={certificate.certificate_url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-emerald-800 mt-1 inline-block">
                        Open Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-900/70">No certificates yet.</p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-emerald-950">My Assigned Projects</h2>
            <Link href="/dashboard/students" className="px-4 py-2 rounded-xl border border-emerald-900/20 text-emerald-950 hover:bg-emerald-50 text-sm">
              View All Students Progress
            </Link>
          </div>

          {assignedProjects.length > 0 ? (
            <div className="space-y-4">
              {assignedProjects.map((assignment) => {
                const project = assignment.projects?.[0]
                if (!project) return null

                const projectEntries = entriesByProject.get(project.id) || []
                const latestProjectEntry = projectEntries[0]
                const projectFinalCount = projectEntries.filter((e) => e.is_final).length

                return (
                  <div key={project.id} className="glass-card rounded-xl p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-emerald-950">{project.title}</h3>
                          <span className="chip">{projectEntries.length} update(s)</span>
                          <span className="chip">{projectFinalCount} final</span>
                        </div>
                        {project.description && <p className="text-sm text-emerald-900/75 mt-2">{project.description}</p>}
                        <div className="text-xs text-emerald-900/70 mt-2 flex flex-wrap gap-2">
                          <span className="chip">{project.difficulty || 'Beginner'}</span>
                          <span className="chip">{project.subject_tag || 'Coding'}</span>
                          <span className="chip">{project.club_category || 'Beginner Club'}</span>
                          {project.due_date && <span className="chip">Due {new Date(project.due_date).toLocaleDateString()}</span>}
                        </div>
                        <p className="text-xs text-emerald-900/65 mt-2">
                          {latestProjectEntry ? `Latest progress: ${latestProjectEntry.progress_percent}%` : 'No progress logged yet'}
                        </p>
                      </div>

                      <div className="lg:w-[360px]">
                        <form action={createProgressEntryAction} className="space-y-3">
                          <input type="hidden" name="projectId" value={project.id} />
                          <div>
                            <label className="block text-sm font-medium text-emerald-900 mb-1">Update Title</label>
                            <input
                              name="title"
                              required
                              className="w-full rounded-xl px-3 py-2 text-sm"
                              placeholder="Milestone or task name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-emerald-900 mb-1">Progress %</label>
                            <input
                              name="progressPercent"
                              type="number"
                              min={0}
                              max={100}
                              required
                              className="w-full rounded-xl px-3 py-2 text-sm"
                              placeholder="75"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-emerald-900 mb-1">Notes</label>
                            <textarea
                              name="notes"
                              className="w-full rounded-xl px-3 py-2 text-sm min-h-20"
                              placeholder="What changed in this project step?"
                            />
                          </div>
                          <div className="flex gap-3">
                            <input id={`isFinal-${project.id}`} name="isFinal" type="checkbox" />
                            <label htmlFor={`isFinal-${project.id}`} className="text-sm text-emerald-900">
                              Final result for this project
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-emerald-900 mb-1">Result File (optional)</label>
                            <input name="resultFile" type="file" className="w-full rounded-xl px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-emerald-900 mb-1">Result Link (optional)</label>
                            <input name="resultLink" className="w-full rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
                          </div>
                          <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800 w-full">
                            Save Project Progress
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <form action={uploadProjectMediaAction} className="rounded-xl border border-emerald-900/10 bg-white/60 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input type="hidden" name="projectId" value={project.id} />
                        <div>
                          <label className="block text-sm font-medium text-emerald-900 mb-1">Photo/Video</label>
                          <input name="mediaFile" type="file" accept="image/*,video/*" className="w-full rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-emerald-900 mb-1">Or Media URL</label>
                          <input name="mediaUrl" className="w-full rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-emerald-900 mb-1">Caption</label>
                          <input name="caption" className="w-full rounded-xl px-3 py-2 text-sm" placeholder="Project demo" />
                        </div>
                        <div className="sm:col-span-3">
                          <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800 w-full sm:w-auto">
                            Upload Project Media
                          </button>
                        </div>
                      </form>

                      {(mediaByProject.get(project.id) || []).slice(0, 3).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {(mediaByProject.get(project.id) || []).slice(0, 3).map((item) => (
                            <div key={item.id} className="rounded-xl border border-emerald-900/10 bg-white/60 p-2">
                              {item.media_type === 'video' ? (
                                <video src={item.media_url} controls className="w-full h-36 object-cover rounded-lg" />
                              ) : (
                                <img src={item.media_url} alt={item.caption || 'Project media'} className="w-full h-36 object-cover rounded-lg" />
                              )}
                              {item.caption && <p className="text-xs text-emerald-900/70 mt-2">{item.caption}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {projectEntries.length > 0 ? (
                        projectEntries.map((entry) => (
                          <div key={entry.id} className="rounded-xl border border-emerald-900/10 bg-white/60 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-emerald-950">{entry.title}</h4>
                                {entry.notes && <p className="text-sm text-emerald-900/75 mt-1">{entry.notes}</p>}
                              </div>
                              <span className="chip">{entry.progress_percent}% complete</span>
                            </div>
                            <div className="mt-3 text-xs text-emerald-900/65 flex flex-wrap gap-3">
                              <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                              {entry.is_final && <span className="font-semibold text-emerald-800">Final Result</span>}
                              {entry.result_link && (
                                <a href={entry.result_link} target="_blank" rel="noopener noreferrer" className="underline text-emerald-800">
                                  Open Result
                                </a>
                              )}
                            </div>
                            {entry.teacher_comment && (
                              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                                <p className="text-xs font-semibold text-emerald-900">Teacher Comment</p>
                                <p className="text-sm text-emerald-900/80 mt-1">{entry.teacher_comment}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-emerald-900/70">No progress updates yet for this project.</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6">
              <p className="text-emerald-900/70">No projects assigned yet. Ask the admin to assign a project first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
