"use server"

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function setUserGrade(formData: FormData) {
  const gradeStr = formData.get('grade') as string | null
  const grade = gradeStr ? parseInt(gradeStr, 10) : null

  if (!grade || grade < 1 || grade > 8) {
    return redirect('/onboarding?error=invalid_grade')
  }

  const supabase = await createServerSupabaseClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth getUser error:', authError)
    return redirect('/login')
  }

  const user = authData?.user
  if (!user) {
    return redirect('/login')
  }

  // Use service-role admin client to bypass RLS for this profile update
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('users').update({ grade }).eq('id', user.id)

  if (error) {
    // Log full error for debugging
    console.error('Error saving grade with admin client:', error)
    const msg = encodeURIComponent(error.message || 'unknown')
    return redirect(`/onboarding?error=save_failed&msg=${msg}`)
  }

  // After successful save, redirect to dashboard
  return redirect('/dashboard')
}
