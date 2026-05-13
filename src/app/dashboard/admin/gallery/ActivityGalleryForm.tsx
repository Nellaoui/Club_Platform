'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createActivityImagesAction } from '@/app/actions/gallery'

export default function ActivityGalleryForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const form = event.currentTarget

    startTransition(async () => {
      try {
        if (!title.trim()) {
          throw new Error('Title is required')
        }

        const formData = new FormData()
        formData.set('title', title.trim())
        formData.set('description', description)
        formData.set('eventDate', eventDate)
        formData.set('imageUrl', imageUrl.trim())

        for (const file of files.filter((file) => file.size > 0)) {
          formData.append('imageFiles', file)
        }

        await createActivityImagesAction(formData)

        setTitle('')
        setDescription('')
        setEventDate('')
        setImageUrl('')
        setFiles([])
        form.reset()
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create gallery image'
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Coding workshop highlights"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
        <input
          type="date"
          value={eventDate}
          onChange={(event) => setEventDate(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {files.length > 0 && <p className="mt-1 text-xs text-gray-500">{files.length} file(s) selected</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="https://..."
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-24"
          placeholder="Optional description of this activity"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
        >
          {isPending ? 'Posting...' : 'Post Activity Image'}
        </button>
      </div>
    </form>
  )
}
