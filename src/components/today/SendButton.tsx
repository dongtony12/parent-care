'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Send,
  Loader2,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  confirmSend,
  discardPreview,
  previewMessage,
  revertToQueued,
} from '@/app/actions/send'

type Props = {
  status: string
  finalMessage: string | null
}

export function SendButton({ status, finalMessage }: Props) {
  const [draft, setDraft] = useState(finalMessage ?? '')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setDraft(finalMessage ?? '')
  }, [finalMessage])

  if (status === 'sent' && finalMessage) {
    function handleRevert() {
      startTransition(async () => {
        try {
          await revertToQueued()
          toast.success('수정 모드로 돌아왔어요')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '되돌리기 실패')
        }
      })
    }

    return (
      <div className="w-full max-w-md space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
        <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
          <CheckCircle2 className="size-4" />
          오늘 카드를 보냈어요
        </div>
        <p className="text-sm leading-relaxed">{finalMessage}</p>
        <div className="pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRevert}
            disabled={pending}
            className="text-green-700 dark:text-green-400"
          >
            <Pencil className="size-3.5" />
            수정해서 다시 보내기
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'queued') {
    function handleConfirm() {
      startTransition(async () => {
        try {
          await confirmSend(draft)
          toast.success('부모님께 보냈어요')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '발송 실패')
        }
      })
    }
    function handleRegenerate() {
      startTransition(async () => {
        try {
          const { message } = await previewMessage()
          setDraft(message)
          toast.success('메시지를 다시 만들었어요')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '재생성 실패')
        }
      })
    }
    function handleCancel() {
      startTransition(async () => {
        try {
          await discardPreview()
          toast.success('미리보기를 취소했어요')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '취소 실패')
        }
      })
    }

    return (
      <div className="w-full max-w-md space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          미리보기 — 보내기 전에 확인하고 수정할 수 있어요
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          maxLength={500}
          disabled={pending}
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={pending}
          >
            <X className="size-4" />
            취소
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRegenerate}
            disabled={pending}
          >
            <RefreshCw className={pending ? 'size-4 animate-spin' : 'size-4'} />
            다시 만들기
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={pending}>
            <Send className="size-4" />
            발송
          </Button>
        </div>
      </div>
    )
  }

  function handlePreview() {
    startTransition(async () => {
      try {
        await previewMessage()
        toast.success('메시지 미리보기가 생성됐어요')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '메시지 생성 실패')
      }
    })
  }

  return (
    <Button
      type="button"
      onClick={handlePreview}
      disabled={pending}
      className="w-full max-w-md"
      size="lg"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          메시지 만드는 중…
        </>
      ) : (
        <>
          <Sparkles className="size-4" />
          메시지 미리보기 만들기
        </>
      )}
    </Button>
  )
}
