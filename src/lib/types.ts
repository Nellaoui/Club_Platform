// Types for the platform
export type Role = 'admin' | 'student'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  grade?: number | null
  approved?: boolean | null
  role: Role
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  name: string
  description: string | null
  club_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Week {
  id: string
  subject_id: string
  week_number: number
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  week_id: string
  title: string
  description: string | null
  type: 'pdf' | 'image' | 'link'
  file_url: string | null
  external_url: string | null
  allowed_grade?: number | null
  created_by: string
  created_at: string
  updated_at: string
  _count?: {
    comments: number
  }
}

export interface Comment {
  id: string
  resource_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: User
}

export interface Attendance {
  id: string
  user_id: string
  event_date: string
  attended: boolean
  created_at: string
  updated_at: string
  user?: User
}

export interface ActivityImage {
  id: string
  title: string
  description: string | null
  image_url: string
  event_date: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface StudentProgress {
  id: string
  user_id: string
  project_id: string | null
  title: string
  notes: string | null
  teacher_comment?: string | null
  teacher_commented_at?: string | null
  progress_percent: number
  result_link: string | null
  is_final: boolean
  created_at: string
  updated_at: string
}

export type ProjectDifficulty = 'Beginner' | 'Medium' | 'Advanced'
export type ProjectSubjectTag = 'Coding' | 'Robotics' | 'AI' | 'Game Development' | 'STEM' | 'Competition'
export type ClubCategory = 'Beginner Club' | 'Coding Club' | 'Robotics Club' | 'AI Club' | 'Competition Zone'

export interface Project {
  id: string
  title: string
  description: string | null
  difficulty: ProjectDifficulty
  subject_tag: ProjectSubjectTag
  club_category: ClubCategory
  due_date: string | null
  featured_order: number | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectAssignment {
  id: string
  project_id: string
  user_id: string
  assigned_at: string
}

export interface ProjectMedia {
  id: string
  project_id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  caption: string | null
  created_at: string
}

export interface StudentBadge {
  id: string
  user_id: string
  project_id: string | null
  badge_name: string
  awarded_at: string
}

export interface StudentCertificate {
  id: string
  user_id: string
  project_id: string | null
  certificate_title: string
  certificate_url: string | null
  issued_at: string
}

export interface ProjectTeam {
  id: string
  project_id: string
  name: string
  created_at: string
}

export interface ProjectTeamMember {
  id: string
  team_id: string
  user_id: string
  joined_at: string
}
