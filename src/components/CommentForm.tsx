'use client'

import { useState } from 'react'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
}

export default function CommentForm({ onSubmit }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    try {
      await onSubmit(content)
      setContent('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        disabled={isLoading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        rows={3}
      />
      <button
        type="submit"
        disabled={isLoading || !content.trim()}
        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  )
}
