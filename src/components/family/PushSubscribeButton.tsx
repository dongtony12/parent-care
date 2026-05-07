'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ensureServiceWorker,
  requestPushSubscription,
} from '@/lib/push/client'
import {
  subscribeRecipient,
  unsubscribeRecipient,
} from '@/app/actions/family-push'

type Props = {
  shareCode: string
}

export function PushSubscribeButton({ shareCode }: Props) {
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

  function handleEnable() {
    startTransition(async () => {
      try {
        const payload = await requestPushSubscription()
        await subscribeRecipient({ shareCode, ...payload })
        setEnabled(true)
        toast.success('알림이 켜졌어요')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '권한 거부됨')
      }
    })
  }

  function handleDisable() {
    startTransition(async () => {
      try {
        const reg = await ensureServiceWorker()
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          const endpoint = sub.endpoint
          await sub.unsubscribe()
          await unsubscribeRecipient(endpoint)
        }
        setEnabled(false)
        toast.success('알림이 꺼졌어요')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '해제 실패')
      }
    })
  }

  if (!supported) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={enabled ? handleDisable : handleEnable}
      disabled={pending}
    >
      {enabled ? (
        <>
          <BellOff className="size-4" />
          알림 끄기
        </>
      ) : (
        <>
          <Bell className="size-4" />
          알림 받기
        </>
      )}
    </Button>
  )
}
