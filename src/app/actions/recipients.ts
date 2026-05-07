'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/phone'

export async function addRecipient(input: { name: string; phone: string }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name = input.name.trim()
  if (!name) throw new Error('이름을 입력해주세요')

  const phone = normalizePhone(input.phone)
  if (!phone) throw new Error('올바른 전화번호 형식이 아닙니다')

  const { error } = await supabase.from('recipients').insert({
    user_id: user.id,
    name,
    phone,
  })
  if (error) throw error

  revalidatePath('/settings')
}

export async function updateRecipientActive(id: string, isActive: boolean) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('recipients')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error

  revalidatePath('/settings')
}

export async function deleteRecipient(id: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('recipients').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/settings')
}
