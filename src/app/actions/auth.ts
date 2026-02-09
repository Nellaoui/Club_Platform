'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updateUserRole(userId: string, role: 'admin' | 'student') {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  // Check if current user is admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (adminUser?.role !== 'admin') {
    throw new Error('Only admins can update user roles')
  }

  return supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
}
