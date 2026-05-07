'use server'

import { createSupabaseAdminClient } from '@/lib/supabase/admin'

type SubscriptionInput = {
  shareCode: string
  endpoint: string
  p256dh: string
  auth: string
  userAgent: string
}

export async function subscribeRecipient(
  input: SubscriptionInput,
): Promise<void> {
  const supabase = createSupabaseAdminClient()

  const { data: recipient } = await supabase
    .from('recipients')
    .select('id')
    .eq('share_code', input.shareCode)
    .maybeSingle()

  if (!recipient) throw new Error('잘못된 링크입니다')

  const { error } = await supabase.from('recipient_subscriptions').upsert(
    {
      recipient_id: recipient.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}

export async function unsubscribeRecipient(endpoint: string): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('recipient_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
  if (error) throw error
}
