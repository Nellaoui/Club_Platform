import { Suspense } from 'react'
import OnboardingClient from './OnboardingClient'

export const dynamic = 'force-dynamic'

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-64 bg-gray-200 rounded mb-8" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  )
}
