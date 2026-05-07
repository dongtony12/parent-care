import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>부모님 안심 케어</CardTitle>
          <CardDescription>
            매일 점심·저녁 사진과 한 줄 일기를 모아 부모님께 전합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {user?.email} 님, 환영합니다.
          </p>
          <p className="text-sm">
            셋업 진행 중 — 곧 오늘의 카드 화면이 여기에 표시됩니다.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
