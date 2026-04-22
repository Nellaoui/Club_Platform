'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const supabaseRef = useRef(createClient())
  const isAuthStartingRef = useRef(false)

  const handleGoogleLogin = async () => {
    if (isAuthStartingRef.current) {
      return
    }

    isAuthStartingRef.current = true
    setIsLoading(true)

    // Always use current origin so localhost keeps users on local callback during development.
    const siteUrl = window.location.origin

    const { error } = await supabaseRef.current.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Login error:', error)
      isAuthStartingRef.current = false
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <div className="app-shell page-enter grid lg:grid-cols-2 gap-6 items-stretch">
        <section className="hero-panel rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="chip w-fit mb-5">Creative Tech Club</p>
            <h1 className="text-4xl sm:text-5xl font-black text-emerald-950 leading-tight">Build. Explore. Share.</h1>
            <p className="mt-4 text-emerald-900/80 max-w-md">
              A vibrant hub where students showcase projects, discover resources, and learn together week by week.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="glass-card rounded-xl py-3 px-2">
              <p className="text-lg font-bold text-emerald-900">8</p>
              <p className="text-xs text-emerald-800/80">Grades</p>
            </div>
            <div className="glass-card rounded-xl py-3 px-2">
              <p className="text-lg font-bold text-emerald-900">1</p>
              <p className="text-xs text-emerald-800/80">Platform</p>
            </div>
            <div className="glass-card rounded-xl py-3 px-2">
              <p className="text-lg font-bold text-emerald-900">100%</p>
              <p className="text-xs text-emerald-800/80">Team Spirit</p>
            </div>
          </div>
        </section>

        <section className="glass-card w-full rounded-3xl p-8 sm:p-10 self-center">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Image src="/logo.png" alt="London Academy" width={78} height={78} className="rounded-full ring-4 ring-emerald-100" />
            </div>
            <h2 className="text-3xl font-black text-emerald-950 mb-1">Tech Club Hub</h2>
            <p className="text-emerald-800 font-medium">London Academy</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-emerald-900/15 text-emerald-900 font-semibold py-3.5 px-4 rounded-xl hover:bg-emerald-50 disabled:opacity-50 flex items-center justify-center gap-3"
          >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <p className="mt-6 text-center text-sm text-emerald-950/75">
            Sign in with your school Google account to access resources, projects, and activity updates.
          </p>
        </section>
      </div>
    </div>
  )
}
