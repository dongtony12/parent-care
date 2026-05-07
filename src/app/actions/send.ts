'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { composeMessage } from '@/lib/ai/compose'
import { getOrCreateTodayEntry } from './today'

export async function previewMessage(): Promise<{ message: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const entry = await getOrCreateTodayEntry()

  const { data: recipients, error: recipientsError } = await supabase
    .from('recipients')
    .select('id, name')
    .eq('is_active', true)
  if (recipientsError) throw recipientsError
  if (!recipients || recipients.length === 0) {
    throw new Error('활성화된 부모님이 없습니다. 설정에서 등록해주세요')
  }

  const { data: photos } = await supabase
    .from('meal_photos')
    .select('meal_type')
    .eq('entry_id', entry.id)

  const hasLunch = photos?.some((p) => p.meal_type === 'lunch') ?? false
  const hasDinner = photos?.some((p) => p.meal_type === 'dinner') ?? false

  const recipientName = recipients.map((r) => r.name).join(', ')

  const message = await composeMessage({
    diaryText: entry.diary_text,
    hasLunch,
    hasDinner,
    recipientName,
  })

  const { error: updateError } = await supabase
    .from('daily_entries')
    .update({
      final_message: message,
      status: 'queued',
    })
    .eq('id', entry.id)
  if (updateError) throw updateError

  revalidatePath('/')
  return { message }
}

export async function confirmSend(text: string): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('메시지를 비워둘 수 없습니다')

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const entry = await getOrCreateTodayEntry()

  const { error } = await supabase
    .from('daily_entries')
    .update({
      final_message: trimmed,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', entry.id)
  if (error) throw error

  revalidatePath('/')
}

export async function revertToQueued(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const entry = await getOrCreateTodayEntry()

  const { error } = await supabase
    .from('daily_entries')
    .update({
      status: 'queued',
      sent_at: null,
    })
    .eq('id', entry.id)
  if (error) throw error

  revalidatePath('/')
}

export async function discardPreview(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const entry = await getOrCreateTodayEntry()

  const { error } = await supabase
    .from('daily_entries')
    .update({
      final_message: null,
      status: 'draft',
    })
    .eq('id', entry.id)
  if (error) throw error

  revalidatePath('/')
}
