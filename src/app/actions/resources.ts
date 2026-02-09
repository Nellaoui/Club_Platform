'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function createResourceAction(
  weekId: string,
  title: string,
  type: 'pdf' | 'image' | 'link',
  fileUrl?: string,
  externalUrl?: string,
  description?: string,
  allowedGrade?: number | null
) {
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
    throw new Error('Only admins can create resources')
  }

  const { data, error } = await supabase.from('resources').insert({
    week_id: weekId,
    title,
    description,
    type,
    file_url: fileUrl,
    external_url: externalUrl,
    allowed_grade: allowedGrade ?? null,
    created_by: user.id,
  })

  if (error) throw error
  return data
}

export async function createResourceFromForm(formData: FormData): Promise<void> {
  const weekId = String(formData.get('weekId') || '')
  const title = String(formData.get('title') || '').trim()
  const type = String(formData.get('type') || 'link') as 'pdf' | 'image' | 'link'
  const description = String(formData.get('description') || '').trim()
  const allowedGradeRaw = String(formData.get('allowedGrade') || '')
  const allowedGrade = allowedGradeRaw ? Number(allowedGradeRaw) : null
  const fileUrlInput = String(formData.get('fileUrl') || '').trim()
  const externalUrl = String(formData.get('externalUrl') || '').trim()
  const file = formData.get('file') as File | null

  if (!weekId || !title) {
    throw new Error('Week and title are required')
  }

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
    throw new Error('Only admins can create resources')
  }

  let uploadedFileUrl = fileUrlInput || undefined

  if (type === 'pdf' || type === 'image') {
    if (file && file.size > 0) {
      const { data: week } = await supabase
        .from('weeks')
        .select('subject_id')
        .eq('id', weekId)
        .single()

      const bucket = type === 'pdf' ? 'pdfs' : 'images'
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const subjectId = week?.subject_id || 'unknown'
      const filePath = `resources/${subjectId}/${weekId}/${Date.now()}-${safeName}`

      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await admin.storage.from(bucket).upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = admin.storage.from(bucket).getPublicUrl(filePath)
      uploadedFileUrl = publicUrlData.publicUrl
    }

    if (!uploadedFileUrl) {
      throw new Error('File URL is required for PDF or image resources')
    }
  }

  if (type === 'link' && !externalUrl) {
    throw new Error('External URL is required for link resources')
  }

  const { error } = await supabase.from('resources').insert({
    week_id: weekId,
    title,
    description: description || undefined,
    type,
    file_url: type === 'link' ? undefined : uploadedFileUrl,
    external_url: type === 'link' ? externalUrl : undefined,
    allowed_grade: Number.isFinite(allowedGrade) ? allowedGrade : null,
    created_by: user.id,
  })

  if (error) throw error
}

export async function deleteResourceAction(id: string) {
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
    throw new Error('Only admins can delete resources')
  }

  const { data, error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)

  if (error) throw error
  return data
}

export async function addCommentAction(resourceId: string, content: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase.from('comments').insert({
    resource_id: resourceId,
    user_id: user.id,
    content,
  })

  if (error) throw error
  return data
}

export async function deleteCommentAction(id: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is comment author or admin
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!comment) {
    throw new Error('Comment not found')
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (comment.user_id !== user.id && userRole?.role !== 'admin') {
    throw new Error('You can only delete your own comments')
  }

  const { data, error } = await supabase.from('comments').delete().eq('id', id)

  if (error) throw error
  return data
}
