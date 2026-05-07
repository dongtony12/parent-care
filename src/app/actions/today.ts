'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/types'

type MealType = 'lunch' | 'dinner'

function todayKstDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(),
  )
}

export async function getOrCreateTodayEntry(): Promise<Tables<'daily_entries'>> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const entryDate = todayKstDate()

  const { data: existing, error: selectError } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', entryDate)
    .maybeSingle()
  if (selectError) throw selectError
  if (existing) return existing

  const { data, error } = await supabase
    .from('daily_entries')
    .insert({ user_id: user.id, entry_date: entryDate })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function attachMealPhoto(input: {
  entryId: string
  mealType: MealType
  storagePath: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { data: prev } = await supabase
    .from('meal_photos')
    .select('storage_path')
    .eq('entry_id', input.entryId)
    .eq('meal_type', input.mealType)
    .maybeSingle()

  const { error } = await supabase.from('meal_photos').upsert(
    {
      entry_id: input.entryId,
      meal_type: input.mealType,
      storage_path: input.storagePath,
      captured_at: new Date().toISOString(),
    },
    { onConflict: 'entry_id,meal_type' },
  )
  if (error) throw error

  if (prev?.storage_path && prev.storage_path !== input.storagePath) {
    await supabase.storage.from('meal-photos').remove([prev.storage_path])
  }

  revalidatePath('/')
}

export async function saveDiaryText(
  entryId: string,
  text: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('daily_entries')
    .update({ diary_text: text.trim() || null })
    .eq('id', entryId)
  if (error) throw error
}
