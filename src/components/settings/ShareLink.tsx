'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  shareCode: string
}

export function ShareLink({ shareCode }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/p/${shareCode}`
        : `/p/${shareCode}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('링크가 복사되었습니다')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('복사 실패. 길게 눌러 직접 복사해주세요')
    }
  }

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      onClick={handleCopy}
      aria-label="공유 링크 복사"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </Button>
  )
}
