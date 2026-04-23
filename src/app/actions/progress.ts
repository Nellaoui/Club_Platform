'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function createProgressEntryAction(formData: FormData) {
  const projectId = String(formData.get('projectId') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const progressPercentRaw = String(formData.get('progressPercent') || '').trim()
  const notes = String(formData.get('notes') || '').trim()
  const resultLink = String(formData.get('resultLink') || '').trim()
  const isFinal = String(formData.get('isFinal') || '') === 'on'
  const resultFile = formData.get('resultFile') as File | null

  if (!projectId) {
    throw new Error('Please select one of your assigned projects')
  }

  if (!title) {
    throw new Error('Title is required')
  }

  const progressPercent = Number(progressPercentRaw)
  if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    throw new Error('Progress must be a number between 0 and 100')
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminCheck = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: assignment } = await adminCheck
    .from('project_assignments')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!assignment) {
    throw new Error('You can only update progress for projects assigned to you')
  }

  let uploadedResultUrl = resultLink || null

  if (resultFile && resultFile.size > 0) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const safeName = resultFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `student-results/${user.id}/${Date.now()}-${safeName}`
    const buffer = Buffer.from(await resultFile.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('pdfs')
      .upload(filePath, buffer, {
        contentType: resultFile.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data: publicUrlData } = admin.storage.from('pdfs').getPublicUrl(filePath)
    uploadedResultUrl = publicUrlData.publicUrl
  }

  if (isFinal && !uploadedResultUrl) {
    throw new Error('Please upload or provide a final result link before marking as final')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('student_progress').insert({
    user_id: user.id,
    project_id: projectId,
    title,
    notes: notes || null,
    progress_percent: progressPercent,
    result_link: uploadedResultUrl,
    is_final: isFinal,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/students')
}

export async function uploadProjectMediaAction(formData: FormData) {
  const projectId = String(formData.get('projectId') || '').trim()
  const caption = String(formData.get('caption') || '').trim()
  const mediaFile = formData.get('mediaFile') as File | null
  const mediaUrlInput = String(formData.get('mediaUrl') || '').trim()

  if (!projectId) {
    throw new Error('Project is required')
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminCheck = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: assignment } = await adminCheck
    .from('project_assignments')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!assignment) {
    throw new Error('You can only upload media for projects assigned to you')
  }

  let mediaUrl = mediaUrlInput
  let mediaType: 'image' | 'video' = 'image'

  if (mediaFile && mediaFile.size > 0) {
    const safeName = mediaFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `project-media/${user.id}/${Date.now()}-${safeName}`
    const buffer = Buffer.from(await mediaFile.arrayBuffer())

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: uploadError } = await admin.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: mediaFile.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data: publicUrlData } = admin.storage.from('images').getPublicUrl(filePath)
    mediaUrl = publicUrlData.publicUrl
    mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image'
  } else if (mediaUrl) {
    mediaType = /\.(mp4|webm|ogg)(\?.*)?$/i.test(mediaUrl) ? 'video' : 'image'
  } else {
    throw new Error('Upload a media file or provide a media URL')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('project_media').insert({
    project_id: projectId,
    user_id: user.id,
    media_url: mediaUrl,
    media_type: mediaType,
    caption: caption || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/students')
}
