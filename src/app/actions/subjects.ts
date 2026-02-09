'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createSubjectAction(name: string, description?: string) {
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
    throw new Error('Only admins can create subjects')
  }

  const { data, error } = await supabase.from('subjects').insert({
    name,
    description,
    created_by: user.id,
  })

  if (error) throw error
  return data
}

export async function updateSubjectAction(
  id: string,
  name: string,
  description?: string
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
    throw new Error('Only admins can update subjects')
  }

  const { data, error } = await supabase
    .from('subjects')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  return data
}

export async function deleteSubjectAction(id: string) {
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
    throw new Error('Only admins can delete subjects')
  }

  const { data, error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)

  if (error) throw error
  return data
}
