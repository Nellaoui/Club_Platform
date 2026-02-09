// Types for the platform
export type Role = 'admin' | 'student'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  grade?: number | null
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
