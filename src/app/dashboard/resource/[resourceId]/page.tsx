import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CommentForm from '@/components/CommentForm'
import { addCommentAction, deleteCommentAction } from '@/app/actions/resources'

interface ResourcePageProps {
  params: Promise<{
    resourceId: string
  }>
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const { resourceId } = await params
  const supabase = await createServerSupabaseClient()

  // Get resource
  const { data: resource } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single()

  if (!resource) {
    notFound()
  }

  // Get comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, user:users(id, full_name, avatar_url)')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })

  // Get week and subject for breadcrumb
  const { data: week } = await supabase
    .from('weeks')
    .select('id, title, subject_id')
    .eq('id', resource.week_id)
    .single()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('id', week?.subject_id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-emerald-600">
            Home
          </Link>
          <span>/</span>
          {subject && (
            <>
              <Link href={`/dashboard/subject/${subject.id}`} className="hover:text-emerald-600">
                {subject.name}
              </Link>
              <span>/</span>
            </>
          )}
          {week && (
            <>
              <Link
                href={`/dashboard/subject/${week.subject_id}?week=${week.id}`}
                className="hover:text-emerald-600"
              >
                {week.title}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{resource.title}</span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Resource Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {resource.title}
            </h1>
            {resource.description && (
              <p className="text-gray-600 mb-4">{resource.description}</p>
            )}
            <div className="text-sm text-gray-500">
              Type: {resource.type.toUpperCase()}
            </div>
          </div>

          {/* Resource Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            {resource.type === 'link' && resource.external_url && (
              <a
                href={resource.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700"
              >
                Open Link →
              </a>
            )}
            {resource.type === 'pdf' && resource.file_url && (
              <div>
                <a
                  href={resource.file_url}
                  download
                  className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700"
                >
                  Download PDF
                </a>
              </div>
            )}
            {resource.type === 'image' && resource.file_url && (
              <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={resource.file_url}
                  alt={resource.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Comments ({comments?.length || 0})
            </h2>

            {/* Comment Form */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <CommentForm
                onSubmit={async (content: string) => {
                  'use server'
                  await addCommentAction(resourceId, content)
                }}
              />
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {comment.user?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {(user.id === comment.user_id || user.role === 'admin') && (
                        <form
                          action={async () => {
                            'use server'
                            await deleteCommentAction(comment.id)
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No comments yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
