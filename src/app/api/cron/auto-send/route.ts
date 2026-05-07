import { NextResponse, type NextRequest } from 'next/server'
import { verifyCronRequest } from '@/lib/cron/verify'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { composeMessage } from '@/lib/ai/compose'
import { notifyRecipients } from '@/lib/push/notify'

function todayKstDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(),
  )
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request)
  if (unauthorized) return unauthorized

  const supabase = createSupabaseAdminClient()
  const today = todayKstDate()

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('id, user_id, diary_text')
    .eq('entry_date', today)
    .in('status', ['draft', 'queued'])

  let processed = 0
  let pushed = 0
  let failed = 0

  for (const entry of entries ?? []) {
    try {
      const { data: recipients } = await supabase
        .from('recipients')
        .select('name')
        .eq('user_id', entry.user_id)
        .eq('is_active', true)

      if (!recipients?.length) continue

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
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', entry.id)
      if (updateError) throw updateError

      const { pushed: p } = await notifyRecipients({
        userId: entry.user_id,
        message,
      })
      pushed += p
      processed++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ processed, pushed, failed })
}
