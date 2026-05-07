'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { saveDiaryText } from '@/app/actions/today'

type Props = {
  entryId: string
  initialText: string
}

type SaveState = 'idle' | 'saving' | 'saved'

const DEBOUNCE_MS = 800

export function NoteEditor({ entryId, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [state, setState] = useState<SaveState>('idle')
  const lastSavedRef = useRef(initialText)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (text === lastSavedRef.current) return

    setState('saving')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await saveDiaryText(entryId, text)
        lastSavedRef.current = text
        setState('saved')
      } catch (err) {
        setState('idle')
        toast.error(err instanceof Error ? err.message : '저장 실패')
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text, entryId])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="diary">오늘 뭐 했어?</Label>
        <span className="text-xs text-muted-foreground">
          {state === 'saving' && '저장 중…'}
          {state === 'saved' && '저장됨'}
        </span>
      </div>
      <textarea
        id="diary"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="간단한 일과나 기분을 적어주세요"
        className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
