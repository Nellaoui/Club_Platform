'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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
    throw error
  }

  revalidatePath('/dashboard/gallery')
  revalidatePath('/dashboard/admin/gallery')
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
