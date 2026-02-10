'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createResourceAction } from '@/app/actions/resources'

interface WeekOption {
  id: string
  subject_id: string
  week_number: number
  title: string
}

interface ResourceFormProps {
  weeks: WeekOption[]
  subjectMap: Record<string, string>
}

export default function ResourceForm({ weeks, subjectMap }: ResourceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [weekId, setWeekId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'pdf' | 'image' | 'link'>('pdf')
  const [description, setDescription] = useState('')
  const [allowedGrade, setAllowedGrade] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const selectedWeek = useMemo(() => weeks.find((w) => w.id === weekId), [weeks, weekId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        if (!weekId || !title.trim()) {
          throw new Error('Week and title are required')
        }

        let uploadedFileUrl = fileUrl.trim() || undefined

        if (type === 'pdf' || type === 'image') {
          if (file && file.size > 0) {
            const supabase = createClient()
            const bucket = type === 'pdf' ? 'pdfs' : 'images'
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
            const subjectId = selectedWeek?.subject_id || 'unknown'
            const filePath = `resources/${subjectId}/${weekId}/${Date.now()}-${safeName}`

            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, file, { contentType: file.type || 'application/octet-stream', upsert: false })

            if (uploadError) {
              throw uploadError
            }

            const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
            uploadedFileUrl = publicUrlData.publicUrl
          }

          if (!uploadedFileUrl) {
            throw new Error('File or file URL is required for PDF or image resources')
          }
        }

        if (type === 'link' && !externalUrl.trim()) {
          throw new Error('External URL is required for link resources')
        }

        await createResourceAction(
          weekId,
          title.trim(),
          type,
          type === 'link' ? undefined : uploadedFileUrl,
          type === 'link' ? externalUrl.trim() : undefined,
          description.trim() || undefined,
          allowedGrade ? Number(allowedGrade) : null
        )

        setTitle('')
        setDescription('')
        setFileUrl('')
        setExternalUrl('')
        setFile(null)
        setAllowedGrade('')
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {error && (
        <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
        <select
          name="weekId"
          required
          value={weekId}
          onChange={(event) => setWeekId(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select week</option>
          {weeks.map((w) => (
            <option key={w.id} value={w.id}>
              {subjectMap[w.subject_id] || 'Subject'} — Week {w.week_number}: {w.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Lesson PDF"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as 'pdf' | 'image' | 'link')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
          <option value="link">Link</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Grade</label>
        <select
          name="allowedGrade"
          value={allowedGrade}
          onChange={(event) => setAllowedGrade(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Grades</option>
          {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF/Image)</label>
        <input
          name="file"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Optional"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
        <input
          name="fileUrl"
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
        <input
          name="externalUrl"
          value={externalUrl}
          onChange={(event) => setExternalUrl(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="https://..."
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
        >
          {isPending ? 'Creating...' : 'Create Resource'}
        </button>
      </div>
    </form>
  )
}
