'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addRecipient } from '@/app/actions/recipients'

export function RecipientForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await addRecipient({ name, phone })
        setName('')
        setPhone('')
        toast.success('등록되었습니다')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '등록 실패')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1 space-y-1.5">
          <Label htmlFor="name">호칭</Label>
          <Input
            id="name"
            placeholder="엄마"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            required
            maxLength={10}
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="phone">전화번호</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={pending}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? '추가 중…' : '추가'}
      </Button>
    </form>
  )
}
