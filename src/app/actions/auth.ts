'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin/users')
}

export async function updateUserGrade(userId: string, grade: number | null) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (adminUser?.role !== 'admin') {
    throw new Error('Only admins can update user grades')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('users')
    .update({ grade })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin/users')
}
