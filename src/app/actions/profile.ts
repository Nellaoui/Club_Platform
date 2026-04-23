'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateProfileImageAction(formData: FormData) {
  const imageFile = formData.get('imageFile') as File | null
  const imageUrl = String(formData.get('imageUrl') || '').trim()

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let avatarUrl = imageUrl || ''

  if (imageFile && imageFile.size > 0) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `profile-images/${user.id}/${Date.now()}-${safeName}`
    const buffer = Buffer.from(await imageFile.arrayBuffer())

    const { error: uploadError } = await admin.storage.from('images').upload(filePath, buffer, {
      contentType: imageFile.type || 'application/octet-stream',
      upsert: false,
    })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data: publicUrlData } = admin.storage.from('images').getPublicUrl(filePath)
    avatarUrl = publicUrlData.publicUrl
  }

  if (!avatarUrl) {
    throw new Error('Please upload an image or provide an image URL')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin/users')
}
