'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  ensureServiceWorker,
  requestPushSubscription,
} from '@/lib/push/client'
import {
  subscribeSelfPush,
  unsubscribeSelfPush,
} from '@/app/actions/push'

export function SelfPushToggle() {
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(true)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false)
      return
    }
    void (async () => {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      setEnabled(!!sub)
    })()
  }, [])

  function handleToggle(checked: boolean) {
    if (checked) {
      startTransition(async () => {
        try {
          const payload = await requestPushSubscription()
          await subscribeSelfPush(payload)
          setEnabled(true)
          toast.success('알림이 켜졌어요')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '권한 거부됨')
        }
      })
    } else {
      startTransition(async () => {
        try {
          const reg = await ensureServiceWorker()
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            const endpoint = sub.endpoint
            await sub.unsubscribe()
            await unsubscribeSelfPush(endpoint)
          }
          setEnabled(false)
          toast.success('알림이 꺼졌어요')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '해제 실패')
        }
      })
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        이 브라우저는 푸시 알림을 지원하지 않아요
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="space-y-0.5">
        <Label htmlFor="self-push" className="flex items-center gap-1.5">
          <Bell className="size-4" />
          오늘 카드 리마인더
        </Label>
        <p className="text-xs text-muted-foreground">
          매일 밤 22:00, 카드 작성 알림이 도착해요
        </p>
      </div>
      <Switch
        id="self-push"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={pending}
      />
    </div>
  )
}
