'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatPhone } from '@/lib/phone'
import {
  deleteRecipient,
  updateRecipientActive,
} from '@/app/actions/recipients'
import { ShareLink } from './ShareLink'

type Props = {
  id: string
  name: string
  phone: string
  isActive: boolean
  shareCode: string
}

export function RecipientItem({ id, name, phone, isActive, shareCode }: Props) {
  const [pending, startTransition] = useTransition()

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      try {
        await updateRecipientActive(id, checked)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '변경 실패')
      }
    })
  }

  function handleDelete() {
    if (!confirm(`${name} 님을 삭제할까요?`)) return
    startTransition(async () => {
      try {
        await deleteRecipient(id)
        toast.success('삭제되었습니다')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '삭제 실패')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{formatPhone(phone)}</p>
      </div>
      <div className="flex items-center gap-1">
        <ShareLink shareCode={shareCode} />
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={pending}
          aria-label={`${name} 발송 활성화`}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleDelete}
          disabled={pending}
          aria-label={`${name} 삭제`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
