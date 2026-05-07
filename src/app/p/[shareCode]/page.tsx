import { notFound } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  MonthlyView,
  type EntryWithPhotos,
  type MonthGroup,
} from '@/components/family/MonthlyView'

const SIGNED_URL_TTL = 60 * 60
const MONTHS_VISIBLE = 3

type Params = Promise<{ shareCode: string }>

function todayKst(): { year: number; month: number } {
  const str = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date())
  const [y, m] = str.split('-').map(Number)
  return { year: y, month: m }
}

function recentMonthKeys(count: number): string[] {
  const { year, month } = todayKst()
  const keys: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(year, month - 1 - i, 1)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    keys.push(k)
  }
  return keys
}

function formatMonthLabel(monthKey: string, todayYear: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  return y === todayYear ? `${m}월` : `${y}년 ${m}월`
}

export default async function FamilyPage({ params }: { params: Params }) {
  const { shareCode } = await params
  const supabase = createSupabaseAdminClient()

  const { data: recipient } = await supabase
    .from('recipients')
    .select('id, name, user_id')
    .eq('share_code', shareCode)
    .maybeSingle()

  if (!recipient) notFound()

  const { year: todayYear } = todayKst()
  const monthKeys = recentMonthKeys(MONTHS_VISIBLE)
  const oldestKey = monthKeys[monthKeys.length - 1]
  const sinceDate = `${oldestKey}-01`

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('id, entry_date, diary_text, final_message')
    .eq('user_id', recipient.user_id)
    .eq('status', 'sent')
    .gte('entry_date', sinceDate)
    .order('entry_date', { ascending: false })

  const entryIds = (entries ?? []).map((e) => e.id)
  const { data: photos } = entryIds.length
    ? await supabase
        .from('meal_photos')
        .select('entry_id, meal_type, storage_path')
        .in('entry_id', entryIds)
    : { data: [] }

  const signedByEntry = new Map<
    string,
    { lunch: string | null; dinner: string | null }
  >()
  await Promise.all(
    (photos ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from('meal-photos')
        .createSignedUrl(p.storage_path, SIGNED_URL_TTL)
      const url = data?.signedUrl ?? null
      const slot = signedByEntry.get(p.entry_id) ?? {
        lunch: null,
        dinner: null,
      }
      if (p.meal_type === 'lunch') slot.lunch = url
      if (p.meal_type === 'dinner') slot.dinner = url
      signedByEntry.set(p.entry_id, slot)
    }),
  )

  const groups: MonthGroup[] = monthKeys.map((monthKey) => ({
    monthKey,
    monthLabel: formatMonthLabel(monthKey, todayYear),
    entries: [],
  }))

  for (const entry of entries ?? []) {
    const key = entry.entry_date.slice(0, 7)
    const group = groups.find((g) => g.monthKey === key)
    if (!group) continue
    const photoSlot = signedByEntry.get(entry.id)
    const item: EntryWithPhotos = {
      id: entry.id,
      entry_date: entry.entry_date,
      diary_text: entry.diary_text,
      final_message: entry.final_message,
      lunch_url: photoSlot?.lunch ?? null,
      dinner_url: photoSlot?.dinner ?? null,
    }
    group.entries.push(item)
  }

  return (
    <main className="flex-1 flex flex-col items-center p-6">
      <div className="w-full max-w-md">
        <MonthlyView
          recipientName={recipient.name}
          shareCode={shareCode}
          groups={groups}
        />
      </div>
    </main>
  )
}
