import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { RecipientForm } from '@/components/settings/RecipientForm'
import { RecipientItem } from '@/components/settings/RecipientItem'

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, name, phone, is_active, share_code')
    .order('created_at', { ascending: true })

  return (
    <main className="flex-1 flex flex-col items-center p-6">
      <div className="w-full max-w-md space-y-3">
        <Link
          href="/"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'self-start',
          })}
        >
          <ArrowLeft className="size-4" />
          홈으로
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>부모님 등록</CardTitle>
            <CardDescription>
              매일 저녁 다정한 메시지를 받을 분들을 등록해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {(recipients ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  아직 등록된 분이 없어요
                </p>
              ) : (
                (recipients ?? []).map((r) => (
                  <RecipientItem
                    key={r.id}
                    id={r.id}
                    name={r.name}
                    phone={r.phone}
                    isActive={r.is_active}
                    shareCode={r.share_code}
                  />
                ))
              )}
            </div>

            <Separator />

            <RecipientForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
