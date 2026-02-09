import { getCurrentUser } from '@/lib/auth'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import Image from 'next/image'

export default async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="London Academy" width={40} height={40} className="rounded-full" />
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Tech Club Hub</h1>
            <p className="text-xs text-emerald-600">London Academy</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                <p className="text-gray-600 text-xs">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
              </div>
              <form action={signOut}>
                <button className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100">
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
