type CompressOptions = {
  maxDim?: number
  quality?: number
  mimeType?: 'image/jpeg' | 'image/webp'
}

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<Blob> {
  const maxDim = options.maxDim ?? 1280
  const quality = options.quality ?? 0.85
  const mimeType = options.mimeType ?? 'image/jpeg'

  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * ratio)
  const height = Math.round(bitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('canvas context unavailable')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('image compression failed')),
      mimeType,
      quality,
    )
  })
}
