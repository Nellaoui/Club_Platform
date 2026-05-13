'use client'

import { useEffect } from 'react'

export default function AdminGalleryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin gallery route error:', error)
  }, [error])

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-2xl font-bold">Activity Gallery could not load</h1>
        <p className="mt-2 text-sm">
          The gallery page hit an unexpected server error. Try again, and if it keeps failing, check the gallery
          database migration.
        </p>
        {error.digest && <p className="mt-2 text-xs text-red-700">Digest: {error.digest}</p>}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    </div>
  )
}