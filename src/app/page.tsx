import Link from 'next/link'
import { Settings } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { TodayCard } from '@/components/today/TodayCard'
import { SendButton } from '@/components/today/SendButton'
import { getOrCreateTodayEntry } from './actions/today'

const SIGNED_URL_TTL = 60 * 60

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const entry = await getOrCreateTodayEntry()

  const { data: photos } = await supabase
    .from('meal_photos')
    .select('meal_type, storage_path')
    .eq('entry_id', entry.id)

  const signed = await Promise.all(
    (photos ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from('meal-photos')
        .createSignedUrl(p.storage_path, SIGNED_URL_TTL)
      return { meal_type: p.meal_type, url: data?.signedUrl ?? null }
    }),
  )

  const lunchUrl = signed.find((s) => s.meal_type === 'lunch')?.url ?? null
  const dinnerUrl = signed.find((s) => s.meal_type === 'dinner')?.url ?? null

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
      <div className="flex w-full max-w-md justify-end">
        <Link
          href="/settings"
          aria-label="설정"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <Settings className="size-5" />
        </Link>
      </div>
      <TodayCard
        userId={user.id}
        entryId={entry.id}
        entryDate={entry.entry_date}
        diaryText={entry.diary_text ?? ''}
        lunchUrl={lunchUrl}
        dinnerUrl={dinnerUrl}
      />
      <SendButton status={entry.status} finalMessage={entry.final_message} />
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          로그아웃 ({user.email})
        </Button>
      </form>
    </main>
  )
}
