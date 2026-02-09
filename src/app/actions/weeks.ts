'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createWeekAction(
  subjectId: string,
  weekNumber: number,
  title: string,
  description?: string,
  startDate?: string,
  endDate?: string
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
    throw new Error('Only admins can create weeks')
  }

  const { data, error } = await supabase.from('weeks').insert({
    subject_id: subjectId,
    week_number: weekNumber,
    title,
    description,
    start_date: startDate,
    end_date: endDate,
  })

  if (error) throw error
  return data
}

export async function updateWeekAction(
  id: string,
  updates: {
    title?: string
    description?: string
    week_number?: number
    start_date?: string
    end_date?: string
  }
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
    throw new Error('Only admins can update weeks')
  }

  const { data, error } = await supabase
    .from('weeks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  return data
}

export async function deleteWeekAction(id: string) {
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
    throw new Error('Only admins can delete weeks')
  }

  const { data, error } = await supabase.from('weeks').delete().eq('id', id)

  if (error) throw error
  return data
}
