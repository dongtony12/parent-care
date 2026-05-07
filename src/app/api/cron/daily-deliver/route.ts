import { NextResponse, type NextRequest } from 'next/server'
import { verifyCronRequest } from '@/lib/cron/verify'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { notifyRecipients } from '@/lib/push/notify'

function yesterdayKstDate(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    yesterday,
  )
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request)
  if (unauthorized) return unauthorized

  const supabase = createSupabaseAdminClient()
  const targetDate = yesterdayKstDate()

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('id, user_id, final_message')
    .eq('entry_date', targetDate)
    .eq('status', 'sent')
    .is('delivered_at', null)

  let processed = 0
  let pushed = 0

  for (const entry of entries ?? []) {
    if (!entry.final_message) continue

    const { pushed: p } = await notifyRecipients({
      userId: entry.user_id,
      message: entry.final_message,
    })
    pushed += p

    await supabase
      .from('daily_entries')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', entry.id)

    processed++
  }

  return NextResponse.json({ processed, pushed, targetDate })
}
