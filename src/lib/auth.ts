import { createServerSupabaseClient } from './supabase/server'

export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      const isMissingSession =
        (authError as { name?: string }).name === 'AuthSessionMissingError' ||
        (authError as { code?: string }).code === 'auth_session_missing'

      if (!isMissingSession) {
        console.error('Error getting auth user:', authError)
      }
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
    const name = (err as { name?: string }).name
    if (name !== 'AuthSessionMissingError') {
      console.error('getCurrentUser unexpected error:', err)
    }
    return null
  }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
}
