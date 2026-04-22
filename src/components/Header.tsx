import { getCurrentUser } from '@/lib/auth'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import Image from 'next/image'

export default async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/75 backdrop-blur-md">
      <div className="app-shell px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="London Academy" width={42} height={42} className="rounded-full ring-2 ring-emerald-200" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-900 leading-tight">Tech Club Hub</h1>
            <p className="text-[11px] text-emerald-700/90 font-medium">London Academy</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="hidden sm:block text-right text-sm">
                <p className="font-semibold text-gray-900">{user.full_name || user.email}</p>
                <p className="text-xs text-emerald-700">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
              </div>
              <form action={signOut}>
                <button className="text-sm border border-emerald-900/10 text-emerald-900 hover:text-emerald-950 bg-white/80 font-semibold px-3 py-2 rounded-xl hover:bg-emerald-50">
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
