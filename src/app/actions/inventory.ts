'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function requireAdmin() {
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
    throw new Error('Only admins can manage inventory')
  }

  return { supabase, userId: user.id }
}

export async function createInventoryItem(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const quantity = Number(formData.get('quantity') || 0)
  const status = String(formData.get('status') || 'available') as 'available' | 'in_use'
  const notes = String(formData.get('notes') || '').trim()

  if (!name) {
    throw new Error('Item name is required')
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('Quantity must be 0 or more')
  }

  const { supabase, userId } = await requireAdmin()

  const { error } = await supabase.from('inventory').insert({
    name,
    quantity,
    status,
    notes: notes || undefined,
    created_by: userId,
  })

  if (error) throw error
}

export async function deleteInventoryItem(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('inventory').delete().eq('id', id)
  if (error) throw error
}
