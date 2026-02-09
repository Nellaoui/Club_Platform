import { createServerSupabaseClient } from './supabase/server'
import type { Subject, Week, Resource, Comment } from './types'

// ============ SUBJECTS ============
export async function getSubjects() {
  const supabase = await createServerSupabaseClient()
  return supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function createSubject(name: string, description?: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  return supabase.from('subjects').insert({
    name,
    description,
    created_by: user.id,
  })
}

export async function updateSubject(
  id: string,
  name: string,
  description?: string
) {
  const supabase = await createServerSupabaseClient()
  return supabase
    .from('subjects')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteSubject(id: string) {
  const supabase = await createServerSupabaseClient()
  return supabase.from('subjects').delete().eq('id', id)
}

// ============ WEEKS ============
export async function getWeeksBySubject(subjectId: string) {
  const supabase = await createServerSupabaseClient()
  return supabase
    .from('weeks')
    .select('*')
    .eq('subject_id', subjectId)
    .order('week_number', { ascending: true })
}

export async function createWeek(
  subjectId: string,
  weekNumber: number,
  title: string,
  description?: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createServerSupabaseClient()
  return supabase.from('weeks').insert({
    subject_id: subjectId,
    week_number: weekNumber,
    title,
    description,
    start_date: startDate,
    end_date: endDate,
  })
}

export async function updateWeek(id: string, updates: Partial<Week>) {
  const supabase = await createServerSupabaseClient()
  return supabase
    .from('weeks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteWeek(id: string) {
  const supabase = await createServerSupabaseClient()
  return supabase.from('weeks').delete().eq('id', id)
}

// ============ RESOURCES ============
export async function getResourcesByWeek(weekId: string) {
  const supabase = await createServerSupabaseClient()
  return supabase
    .from('resources')
    .select(
      `
      *,
      comments:comments(count)
    `
    )
    .eq('week_id', weekId)
    .order('created_at', { ascending: false })
}

export async function createResource(
  weekId: string,
  title: string,
  type: 'pdf' | 'image' | 'link',
  fileUrl?: string,
  externalUrl?: string,
  description?: string
) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  return supabase.from('resources').insert({
    week_id: weekId,
    title,
    description,
    type,
    file_url: fileUrl,
    external_url: externalUrl,
    created_by: user.id,
  })
}

export async function deleteResource(id: string) {
  const supabase = await createServerSupabaseClient()
  return supabase.from('resources').delete().eq('id', id)
}

// ============ COMMENTS ============
export async function getResourceComments(resourceId: string) {
  const supabase = await createServerSupabaseClient()
  return supabase
    .from('comments')
    .select('*, user:users(*)')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
}

export async function addComment(resourceId: string, content: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  return supabase.from('comments').insert({
    resource_id: resourceId,
    user_id: user.id,
    content,
  })
}

export async function deleteComment(id: string) {
  const supabase = await createServerSupabaseClient()
  return supabase.from('comments').delete().eq('id', id)
}

// ============ STORAGE ============
export async function uploadFile(bucket: string, path: string, file: File) {
  const supabase = await createServerSupabaseClient()
  return supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
}

export async function getPublicUrl(bucket: string, path: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = await createServerSupabaseClient()
  return supabase.storage.from(bucket).remove([path])
}

// ============ ATTENDANCE ============
export async function getAttendanceRecords(eventDate?: string) {
  const supabase = await createServerSupabaseClient()
  let query = supabase.from('attendance').select('*, user:users(*)')

  if (eventDate) {
    query = query.eq('event_date', eventDate)
  }

  return query.order('event_date', { ascending: false })
}

export async function recordAttendance(
  userId: string,
  eventDate: string,
  attended: boolean
) {
  const supabase = await createServerSupabaseClient()
  return supabase.from('attendance').upsert({
    user_id: userId,
    event_date: eventDate,
    attended,
    updated_at: new Date().toISOString(),
  })
}
