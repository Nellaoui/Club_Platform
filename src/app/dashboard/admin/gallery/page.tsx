import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { deleteActivityImageAction } from '@/app/actions/gallery'
import ActivityGalleryForm from './ActivityGalleryForm'

interface RawActivityImageRow {
  id: string
  title: string
  description: string | null
  image_url: string
  event_date: string | null
  created_at: string
  user: Array<{
    full_name: string | null
  }> | null
}

interface ActivityImageRow {
  id: string
  title: string
  description: string | null
  image_url: string
  event_date: string | null
  created_at: string
  postedByName: string | null
}

export default async function AdminGalleryPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('activity_images')
    .select('id, title, description, image_url, event_date, created_at, user:users(full_name)')
    .order('created_at', { ascending: false })

  const images: ActivityImageRow[] = ((data || []) as RawActivityImageRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    event_date: row.event_date,
    created_at: row.created_at,
    postedByName: row.user?.[0]?.full_name ?? null,
  }))

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard/admin" className="text-emerald-700 text-sm font-medium underline decoration-emerald-300 hover:text-emerald-800 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Activity Gallery</h1>
          <p className="text-gray-600 mt-1">Post and manage club activity photos</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Post New Activity</h2>
          <ActivityGalleryForm />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Published Images</h2>

          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="w-full aspect-[4/3] bg-gray-100">
                    <img src={image.image_url} alt={image.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{image.title}</h3>
                    {image.description && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{image.description}</p>}
                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                      <p>Posted by: {image.postedByName || 'Admin'}</p>
                      <p>
                        {image.event_date
                          ? `Activity date: ${new Date(image.event_date).toLocaleDateString()}`
                          : `Posted: ${new Date(image.created_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <form
                      className="mt-4"
                      action={async () => {
                        'use server'
                        await deleteActivityImageAction(image.id)
                      }}
                    >
                      <button type="submit" className="text-sm text-red-600 hover:text-red-700 font-medium">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-10 text-center">No activity images posted yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
