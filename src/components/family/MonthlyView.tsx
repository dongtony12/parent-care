'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type EntryWithPhotos = {
  id: string
  entry_date: string
  diary_text: string | null
  final_message: string | null
  lunch_url: string | null
  dinner_url: string | null
}

export type MonthGroup = {
  monthKey: string
  monthLabel: string
  entries: EntryWithPhotos[]
}

type Props = {
  recipientName: string
  groups: MonthGroup[]
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(`${date}T00:00:00+09:00`))
}

export function MonthlyView({ recipientName, groups }: Props) {
  const firstWithEntries = groups.find((g) => g.entries.length > 0)
  const [selectedKey, setSelectedKey] = useState(
    firstWithEntries?.monthKey ?? groups[0]?.monthKey ?? '',
  )
  const selected = groups.find((g) => g.monthKey === selectedKey)

  return (
    <>
      <header className="space-y-1 pb-4 text-center">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Heart className="size-5" />
          <h1 className="text-lg font-semibold">{recipientName}님께</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          오늘 자식의 하루를 전해드려요
        </p>
      </header>

      <nav
        className="mb-4 flex gap-2"
        role="tablist"
        aria-label="월 선택"
      >
        {groups.map((group) => {
          const isSelected = selectedKey === group.monthKey
          const isEmpty = group.entries.length === 0
          return (
            <button
              key={group.monthKey}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedKey(group.monthKey)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted',
                isEmpty && !isSelected && 'opacity-50',
              )}
            >
              {group.monthLabel}
              {!isEmpty && (
                <span
                  className={cn(
                    'ml-1.5 text-xs',
                    isSelected ? 'opacity-90' : 'text-muted-foreground',
                  )}
                >
                  {group.entries.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="space-y-4">
        {!selected || selected.entries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              이 달에는 받은 카드가 없어요
            </CardContent>
          </Card>
        ) : (
          selected.entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {formatDate(entry.entry_date)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {entry.final_message && (
                  <p className="rounded-lg bg-muted p-4 text-sm leading-relaxed">
                    {entry.final_message}
                  </p>
                )}

                {(entry.lunch_url || entry.dinner_url) && (
                  <div className="grid grid-cols-2 gap-2">
                    {entry.lunch_url && (
                      <figure className="space-y-1">
                        <div className="relative aspect-square overflow-hidden rounded-lg border">
                          <Image
                            src={entry.lunch_url}
                            alt="점심 사진"
                            fill
                            sizes="(max-width: 768px) 50vw, 200px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <figcaption className="text-center text-xs text-muted-foreground">
                          점심
                        </figcaption>
                      </figure>
                    )}
                    {entry.dinner_url && (
                      <figure className="space-y-1">
                        <div className="relative aspect-square overflow-hidden rounded-lg border">
                          <Image
                            src={entry.dinner_url}
                            alt="저녁 사진"
                            fill
                            sizes="(max-width: 768px) 50vw, 200px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <figcaption className="text-center text-xs text-muted-foreground">
                          저녁
                        </figcaption>
                      </figure>
                    )}
                  </div>
                )}

                {entry.diary_text && (
                  <p className="text-sm text-muted-foreground">
                    &quot;{entry.diary_text}&quot;
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
