import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error)
    return redirect(`/login?error=${error}`)
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return redirect('/login?error=auth_code_exchange_failed')
    }

    if (data?.user) {
      // Use a server-side admin client (service role) to create the profile
      // This bypasses RLS for initial profile creation safely on the server
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Check if user profile exists (use maybeSingle to avoid errors when 0 rows)
      const { data: existingUser } = await admin
        .from('users')
        .select('id, grade')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!existingUser) {
        // Create user profile (default role: student)
        const { error: insertError } = await admin.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || null,
          avatar_url: data.user.user_metadata?.avatar_url || null,
          role: 'student',
        })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
        } else {
          // New user without grade -> send to onboarding
          return redirect('/onboarding')
        }
      }

      // If profile exists but grade is missing, send to onboarding
      if (existingUser && (existingUser.grade === null || existingUser.grade === undefined)) {
        return redirect('/onboarding')
      }

      return redirect('/dashboard')
    }
  }

  return redirect('/login?error=no_code_provided')
}
