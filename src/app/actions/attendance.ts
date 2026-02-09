'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function recordAttendanceAction(
  userId: string,
  eventDate: string,
  attended: boolean
) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRole?.role !== 'admin') {
    throw new Error('Only admins can record attendance')
  }

  const { data, error } = await supabase.from('attendance').upsert({
    user_id: userId,
    event_date: eventDate,
    attended,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
  return data
}
