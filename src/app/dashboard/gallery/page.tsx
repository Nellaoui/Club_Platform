import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ActivityImageRow {
  id: string
  title: string
  description: string | null
  image_url: string
  event_date: string | null
  created_at: string
}

export default async function GalleryPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('activity_images')
    .select('id, title, description, image_url, event_date, created_at')
    .order('created_at', { ascending: false })

  const images = (data || []) as ActivityImageRow[]

  return (
    <div className="p-4 sm:p-6 page-enter">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-emerald-700 text-sm font-semibold hover:text-emerald-800 mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-emerald-950">Club Activity Gallery</h1>
          <p className="text-emerald-900/75 mt-2">Photos from club activities and learning moments.</p>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {images.map((image) => (
              <article key={image.id} className="glass-card rounded-xl overflow-hidden">
                <div className="w-full aspect-[4/3] bg-gray-100">
                  <img src={image.image_url} alt={image.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-emerald-950 line-clamp-2">{image.title}</h2>
                  {image.description && (
                    <p className="text-sm text-emerald-900/75 mt-2 line-clamp-3">{image.description}</p>
                  )}
                  <p className="text-xs text-emerald-900/70 mt-3">
                    {image.event_date
                      ? `Activity date: ${new Date(image.event_date).toLocaleDateString()}`
                      : `Posted: ${new Date(image.created_at).toLocaleDateString()}`}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-10 text-center text-emerald-900/70">
            No activity photos posted yet.
          </div>
        )}
      </div>
    </div>
  )
}
