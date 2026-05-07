'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { compressImage } from '@/lib/image/compress'
import { uploadMealPhoto } from '@/lib/storage/upload'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { attachMealPhoto } from '@/app/actions/today'

type Props = {
  userId: string
  entryId: string
  mealType: 'lunch' | 'dinner'
  label: string
  initialUrl: string | null
}

export function MealCard({ userId, entryId, mealType, label, initialUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [, startTransition] = useTransition()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    try {
      const blob = await compressImage(file, { maxDim: 1280, quality: 0.85 })
      const supabase = createSupabaseBrowserClient()
      const path = await uploadMealPhoto(supabase, {
        userId,
        entryId,
        mealType,
        blob,
      })
      await attachMealPhoto({ entryId, mealType, storagePath: path })
      toast.success(`${label} 사진 저장됨`)
      startTransition(() => {})
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드 실패')
      setPreviewUrl(initialUrl)
    } finally {
      URL.revokeObjectURL(localUrl)
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{label}</h3>
        <Button
          type="button"
          size="sm"
          variant={previewUrl ? 'outline' : 'default'}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          {previewUrl ? '다시 찍기' : '사진 추가'}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative block aspect-square w-full overflow-hidden rounded-lg border bg-muted"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`${label} 사진`}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Camera className="mr-2 size-4" />
            {label} 사진 추가
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-6 animate-spin text-white" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  )
}
