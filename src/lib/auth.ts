import { createServerSupabaseClient } from './supabase/server'

export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Error getting auth user:', authError)
      return null
    }

    const user = authData?.user ?? null
    if (!user) return null

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return null
    }

    return profile
  } catch (err) {
    console.error('getCurrentUser unexpected error:', err)
    return null
  }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
}
