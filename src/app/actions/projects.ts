'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: roleRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleRow?.role !== 'admin') {
    throw new Error('Only admins can manage projects')
  }

  return user
}

export async function createProjectAction(formData: FormData) {
  const currentUser = await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const difficulty = String(formData.get('difficulty') || 'Beginner').trim()
  const subjectTag = String(formData.get('subjectTag') || 'Coding').trim()
  const clubCategory = String(formData.get('clubCategory') || 'Beginner Club').trim()
  const dueDateRaw = String(formData.get('dueDate') || '').trim()

  const allowedDifficulty = new Set(['Beginner', 'Medium', 'Advanced'])
  const allowedSubjectTag = new Set(['Coding', 'Robotics', 'AI', 'Game Development', 'STEM', 'Competition'])
  const allowedClubCategory = new Set(['Beginner Club', 'Coding Club', 'Robotics Club', 'AI Club', 'Competition Zone'])

  if (!title) {
    throw new Error('Project title is required')
  }

  if (!allowedDifficulty.has(difficulty)) {
    throw new Error('Invalid difficulty value')
  }

  if (!allowedSubjectTag.has(subjectTag)) {
    throw new Error('Invalid subject tag value')
  }

  if (!allowedClubCategory.has(clubCategory)) {
    throw new Error('Invalid club category value')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('projects').insert({
    title,
    description: description || null,
    difficulty,
    subject_tag: subjectTag,
    club_category: clubCategory,
    due_date: dueDateRaw || null,
    created_by: currentUser.id,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/admin/projects')
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard')
}

export async function seedDefaultProjectsAction() {
  const currentUser = await requireAdmin()

  const seedProjects = [
    { title: 'Build a Line-Following Robot', description: 'Robot uses sensors to follow a black line track.', difficulty: 'Beginner', subject_tag: 'Robotics', club_category: 'Robotics Club', featured_order: 1 },
    { title: 'Obstacle Avoiding Smart Car', description: 'Robot car detects walls and changes direction automatically.', difficulty: 'Beginner', subject_tag: 'Robotics', club_category: 'Robotics Club', featured_order: 2 },
    { title: 'Smart Traffic Light System', description: 'Create traffic lights with LEDs and timers.', difficulty: 'Beginner', subject_tag: 'Robotics', club_category: 'Robotics Club', featured_order: null },
    { title: 'Robot Arm Pick and Place', description: 'Program robotic arm to move objects.', difficulty: 'Advanced', subject_tag: 'Robotics', club_category: 'Robotics Club', featured_order: null },
    { title: 'Bluetooth Controlled Car', description: 'Control robot with phone app.', difficulty: 'Medium', subject_tag: 'Robotics', club_category: 'Robotics Club', featured_order: null },
    { title: 'Maze Solving Robot', description: 'Robot finds exit path in maze.', difficulty: 'Advanced', subject_tag: 'Robotics', club_category: 'Competition Zone', featured_order: null },
    { title: 'Automatic Plant Watering System', description: 'Soil sensor waters plant when dry.', difficulty: 'Beginner', subject_tag: 'STEM', club_category: 'Beginner Club', featured_order: 6 },
    { title: 'Smart Door Lock with Password', description: 'Use keypad and servo lock.', difficulty: 'Medium', subject_tag: 'Robotics', club_category: 'Robotics Club', featured_order: 10 },
    { title: 'Build a School Website', description: 'Students create HTML and CSS website.', difficulty: 'Beginner', subject_tag: 'Coding', club_category: 'Coding Club', featured_order: 3 },
    { title: 'Quiz Game App', description: 'Create quiz with score system.', difficulty: 'Beginner', subject_tag: 'Coding', club_category: 'Coding Club', featured_order: 4 },
    { title: 'Calculator Application', description: 'Simple desktop or web calculator.', difficulty: 'Beginner', subject_tag: 'Coding', club_category: 'Coding Club', featured_order: null },
    { title: 'Attendance Tracker', description: 'Student database plus attendance tracking.', difficulty: 'Medium', subject_tag: 'Coding', club_category: 'Coding Club', featured_order: 8 },
    { title: 'Weather App', description: 'Gets live weather data online.', difficulty: 'Medium', subject_tag: 'Coding', club_category: 'Coding Club', featured_order: null },
    { title: 'Typing Speed Tester', description: 'Measure typing speed.', difficulty: 'Beginner', subject_tag: 'Coding', club_category: 'Coding Club', featured_order: null },
    { title: 'Digital Clock with Alarm', description: 'Clock app with alarms.', difficulty: 'Beginner', subject_tag: 'Coding', club_category: 'Coding Club', featured_order: null },
    { title: 'Create a Maze Game', description: 'Player escapes maze.', difficulty: 'Medium', subject_tag: 'Game Development', club_category: 'Coding Club', featured_order: null },
    { title: 'Space Shooter Game', description: 'Classic shooting game.', difficulty: 'Medium', subject_tag: 'Game Development', club_category: 'Coding Club', featured_order: 7 },
    { title: 'Flappy Bird Clone', description: 'Fun physics game.', difficulty: 'Medium', subject_tag: 'Game Development', club_category: 'Coding Club', featured_order: null },
    { title: 'Math Challenge Game', description: 'Solve equations fast.', difficulty: 'Beginner', subject_tag: 'Game Development', club_category: 'Coding Club', featured_order: null },
    { title: 'Multiplayer Quiz Battle', description: 'Students compete live.', difficulty: 'Advanced', subject_tag: 'Game Development', club_category: 'Competition Zone', featured_order: null },
    { title: 'AI Poster Generator', description: 'Create posters with AI.', difficulty: 'Beginner', subject_tag: 'AI', club_category: 'AI Club', featured_order: 5 },
    { title: 'Make a Cartoon Video', description: 'Use AI tools for animation.', difficulty: 'Medium', subject_tag: 'AI', club_category: 'AI Club', featured_order: null },
    { title: 'Voice Assistant Bot', description: 'Basic chatbot with speech.', difficulty: 'Medium', subject_tag: 'AI', club_category: 'AI Club', featured_order: null },
    { title: 'Face Recognition Attendance', description: 'Camera recognizes students.', difficulty: 'Advanced', subject_tag: 'AI', club_category: 'AI Club', featured_order: null },
    { title: 'AI Story Generator', description: 'Generate stories with prompts.', difficulty: 'Beginner', subject_tag: 'AI', club_category: 'AI Club', featured_order: null },
    { title: 'Solar Powered Fan', description: 'Use solar panel energy.', difficulty: 'Beginner', subject_tag: 'STEM', club_category: 'Beginner Club', featured_order: null },
    { title: 'Earthquake Alarm Sensor', description: 'Vibration sensor alerts.', difficulty: 'Medium', subject_tag: 'STEM', club_category: 'Beginner Club', featured_order: null },
    { title: 'Mini Weather Station', description: 'Temperature and humidity display.', difficulty: 'Beginner', subject_tag: 'STEM', club_category: 'Beginner Club', featured_order: 9 },
    { title: 'Water Level Alarm', description: 'Tank overflow detector.', difficulty: 'Beginner', subject_tag: 'STEM', club_category: 'Beginner Club', featured_order: null },
    { title: 'Wind Turbine Generator', description: 'Build small turbine.', difficulty: 'Advanced', subject_tag: 'STEM', club_category: 'Competition Zone', featured_order: null },
    { title: 'Battle Bot Challenge', description: 'Robots push opponents.', difficulty: 'Advanced', subject_tag: 'Competition', club_category: 'Competition Zone', featured_order: null },
    { title: 'Fastest Line Robot Race', description: 'Speed competition.', difficulty: 'Advanced', subject_tag: 'Competition', club_category: 'Competition Zone', featured_order: null },
    { title: 'Best Smart City Model', description: 'Teams build future city.', difficulty: 'Advanced', subject_tag: 'Competition', club_category: 'Competition Zone', featured_order: null },
    { title: 'Innovation Challenge', description: 'Solve school problem using tech.', difficulty: 'Advanced', subject_tag: 'Competition', club_category: 'Competition Zone', featured_order: null },
  ]

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  for (const project of seedProjects) {
    const { data: existing } = await admin
      .from('projects')
      .select('id')
      .eq('title', project.title)
      .maybeSingle()

    if (existing) {
      await admin
        .from('projects')
        .update({
          description: project.description,
          difficulty: project.difficulty,
          subject_tag: project.subject_tag,
          club_category: project.club_category,
          featured_order: project.featured_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      continue
    }

    await admin.from('projects').insert({
      title: project.title,
      description: project.description,
      difficulty: project.difficulty,
      subject_tag: project.subject_tag,
      club_category: project.club_category,
      featured_order: project.featured_order,
      created_by: currentUser.id,
    })
  }

  revalidatePath('/dashboard/admin/projects')
  revalidatePath('/dashboard')
}

export async function createProjectTeamAction(formData: FormData) {
  await requireAdmin()

  const projectId = String(formData.get('projectId') || '').trim()
  const name = String(formData.get('teamName') || '').trim()

  if (!projectId || !name) {
    throw new Error('Project and team name are required')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('project_teams').insert({ project_id: projectId, name })

  if (error && !error.message.toLowerCase().includes('duplicate')) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/admin/projects')
}

export async function assignStudentToTeamAction(formData: FormData) {
  await requireAdmin()

  const teamId = String(formData.get('teamId') || '').trim()
  const userId = String(formData.get('userId') || '').trim()

  if (!teamId || !userId) {
    throw new Error('Team and student are required')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('project_team_members').insert({ team_id: teamId, user_id: userId })

  if (error && !error.message.toLowerCase().includes('duplicate')) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/admin/projects')
}

export async function addTeacherCommentToProgressAction(formData: FormData) {
  await requireAdmin()

  const progressId = String(formData.get('progressId') || '').trim()
  const comment = String(formData.get('teacherComment') || '').trim()

  if (!progressId || !comment) {
    throw new Error('Progress entry and comment are required')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('student_progress')
    .update({
      teacher_comment: comment,
      teacher_commented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', progressId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/students')
}

export async function awardBadgeAction(formData: FormData) {
  await requireAdmin()

  const userId = String(formData.get('userId') || '').trim()
  const projectId = String(formData.get('projectId') || '').trim()
  const badgeName = String(formData.get('badgeName') || '').trim()

  if (!userId || !badgeName) {
    throw new Error('Student and badge name are required')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('student_badges').insert({
    user_id: userId,
    project_id: projectId || null,
    badge_name: badgeName,
  })

  if (error && !error.message.toLowerCase().includes('duplicate')) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/admin/projects')
}

export async function issueCertificateAction(formData: FormData) {
  await requireAdmin()

  const userId = String(formData.get('userId') || '').trim()
  const projectId = String(formData.get('projectId') || '').trim()
  const certificateTitle = String(formData.get('certificateTitle') || '').trim()
  const certificateUrl = String(formData.get('certificateUrl') || '').trim()

  if (!userId || !certificateTitle) {
    throw new Error('Student and certificate title are required')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('student_certificates').insert({
    user_id: userId,
    project_id: projectId || null,
    certificate_title: certificateTitle,
    certificate_url: certificateUrl || null,
  })

  if (error && !error.message.toLowerCase().includes('duplicate')) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/admin/projects')
}

export async function assignProjectToStudentAction(formData: FormData) {
  await requireAdmin()

  const projectId = String(formData.get('projectId') || '').trim()
  const userId = String(formData.get('userId') || '').trim()

  if (!projectId || !userId) {
    throw new Error('Project and student are required')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('project_assignments')
    .insert({ project_id: projectId, user_id: userId })

  if (error && !error.message.toLowerCase().includes('duplicate')) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/admin/projects')
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/students')
}
