'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

async function requireAdminUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRole?.role !== 'admin') {
    throw new Error('Only admins can manage gallery images')
  }

  return { supabase, user }
}

export async function createActivityImageAction(
  title: string,
  imageUrl: string,
  description?: string,
  eventDate?: string
) {
  await upsertActivityImage(title, imageUrl, description, eventDate)
}

async function upsertActivityImage(
  title: string,
  imageUrl: string,
  description?: string,
  eventDate?: string
) {
  const cleanedTitle = title.trim()
  const cleanedImageUrl = imageUrl.trim()

  if (!cleanedTitle) {
    throw new Error('Title is required')
  }

  if (!cleanedImageUrl) {
    throw new Error('Image URL is required')
  }

  const { supabase, user } = await requireAdminUser()

  const { error } = await supabase.from('activity_images').insert({
    title: cleanedTitle,
    image_url: cleanedImageUrl,
    description: description?.trim() || null,
    event_date: eventDate || null,
    created_by: user.id,
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function uploadActivityImageFile(file: File) {
  const { supabase } = await requireAdminUser()
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `gallery/${crypto.randomUUID()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage.from('images').upload(filePath, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: publicUrlData } = admin.storage.from('images').getPublicUrl(filePath)
  return { supabase, publicUrl: publicUrlData.publicUrl }
}

export async function createActivityImagesAction(formData: FormData) {
  const title = String(formData.get('title') || '')
  const imageUrl = String(formData.get('imageUrl') || '').trim()
  const description = String(formData.get('description') || '')
  const eventDate = String(formData.get('eventDate') || '')
  const imageFiles = formData
    .getAll('imageFiles')
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (!title.trim()) {
    return { ok: false, error: 'Title is required' }
  }

  if (imageFiles.length > 0 && imageUrl) {
    return { ok: false, error: 'Use either uploaded files or an image URL, not both' }
  }

  if (imageFiles.length === 0 && !imageUrl) {
    return { ok: false, error: 'Please upload at least one image file or provide an image URL' }
  }

  try {
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const { supabase, publicUrl } = await uploadActivityImageFile(file)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          redirect('/login')
        }

        const { error } = await supabase.from('activity_images').insert({
          title: title.trim(),
          image_url: publicUrl,
          description: description.trim() || null,
          event_date: eventDate || null,
          created_by: user.id,
        })

        if (error) {
          return { ok: false, error: error.message }
        }
      }
    } else {
      await upsertActivityImage(title, imageUrl, description, eventDate)
    }

    revalidatePath('/dashboard/gallery')
    revalidatePath('/dashboard/admin/gallery')

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to post activity images'
    return { ok: false, error: message }
  }
}

export async function deleteActivityImageAction(id: string) {
  if (!id) {
    throw new Error('Image id is required')
  }

  const { supabase } = await requireAdminUser()

  const { error } = await supabase.from('activity_images').delete().eq('id', id)

  if (error) {
    throw error
  }

  revalidatePath('/dashboard/gallery')
  revalidatePath('/dashboard/admin/gallery')
}
