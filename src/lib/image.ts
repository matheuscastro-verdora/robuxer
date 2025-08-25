export type ProcessedImage = { blob: Blob; ext: 'webp' | 'jpg'; contentType: string }

export async function processImageToWebp(input: File, options?: { maxSide?: number; quality?: number }): Promise<ProcessedImage> {
  const { maxSide = 512, quality = 0.85 } = options || {}
  const objectUrl = URL.createObjectURL(input)
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = objectUrl
  await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej })
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  URL.revokeObjectURL(objectUrl)
  const outType = 'image/webp'
  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), outType, quality))
  return { blob, ext: 'webp', contentType: outType }
}


