"use client"

import { setUserGrade } from '@/app/actions/onboarding'
import { useSearchParams } from 'next/navigation'

export default function OnboardingPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const msg = searchParams?.get('msg')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome — Tell us your grade</h2>

        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error === 'invalid_grade' && 'Please select a valid grade.'}
            {error === 'save_failed' && `Failed to save grade${msg ? `: ${decodeURIComponent(msg)}` : ''}`}
          </div>
        )}

        <form action={setUserGrade} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
            <select name="grade" className="w-full border rounded-md p-2">
              <option value="">Select your grade</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>{g} Grade</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
