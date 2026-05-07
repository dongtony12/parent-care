import 'server-only'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { sendPush } from './send'

export async function notifyRecipients(args: {
  userId: string
  message: string
}): Promise<{ pushed: number; gone: number }> {
  const supabase = createSupabaseAdminClient()

  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, share_code')
    .eq('user_id', args.userId)
    .eq('is_active', true)

  const body =
    args.message.length > 100 ? `${args.message.slice(0, 100)}…` : args.message

  let pushed = 0
  let gone = 0
  for (const recipient of recipients ?? []) {
    const { data: subs } = await supabase
      .from('recipient_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('recipient_id', recipient.id)

    for (const sub of subs ?? []) {
      const result = await sendPush(sub, {
        title: '오늘 카드가 도착했어요',
        body,
        url: `/p/${recipient.share_code}`,
      })
      if (result.ok) pushed++
      else if (result.gone) {
        gone++
        await supabase
          .from('recipient_subscriptions')
          .delete()
          .eq('id', sub.id)
      }
    }
  }

  return { pushed, gone }
}
