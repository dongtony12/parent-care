import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MealCard } from './MealCard'
import { NoteEditor } from './NoteEditor'

type Props = {
  userId: string
  entryId: string
  entryDate: string
  diaryText: string
  lunchUrl: string | null
  dinnerUrl: string | null
}

export function TodayCard(props: Props) {
  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(`${props.entryDate}T00:00:00+09:00`))

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>오늘의 카드</CardTitle>
        <CardDescription>{dateLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <MealCard
            userId={props.userId}
            entryId={props.entryId}
            mealType="lunch"
            label="점심"
            initialUrl={props.lunchUrl}
          />
          <MealCard
            userId={props.userId}
            entryId={props.entryId}
            mealType="dinner"
            label="저녁"
            initialUrl={props.dinnerUrl}
          />
        </div>
        <NoteEditor entryId={props.entryId} initialText={props.diaryText} />
      </CardContent>
    </Card>
  )
}
