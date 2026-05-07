import { NextResponse, type NextRequest } from 'next/server'
import { verifyCronRequest } from '@/lib/cron/verify'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push/send'

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request)
  if (unauthorized) return unauthorized

  const supabase = createSupabaseAdminClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')

  let pushed = 0
  let gone = 0
  for (const sub of subs ?? []) {
    const result = await sendPush(sub, {
      title: '저녁은 어떻게 드셨어요?',
      body: '저녁 사진과 한 줄 일과를 적고 부모님께 카드 보내보세요.',
      url: '/',
    })
    if (result.ok) pushed++
    else if (result.gone) {
      gone++
      await supabase.from('push_subscriptions').delete().eq('id', sub.id)
    }
  }

  return NextResponse.json({ pushed, gone })
}
