import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export const runtime = 'nodejs'

const MAX_FILE_BYTES = 6 * 1024 * 1024 // 6 MB
const ACCEPTED = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
])

export async function POST(req: NextRequest) {
  try {
    await requireUser()

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please upload an image file.' }, { status: 400 })
    }
    if (!ACCEPTED.has(file.type) && !/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
      return NextResponse.json(
        { error: 'Only image files (PNG, JPG, WebP, GIF, BMP) are supported.' },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Image is too large (max 6 MB).' }, { status: 400 })
    }

    // Import lazily so the SDK only loads on the server in this route.
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const buf = Buffer.from(await file.arrayBuffer())
    const base64 = buf.toString('base64')
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'You are an accurate OCR engine. Extract ALL text visible in this image of study notes. '
                + 'Preserve the original order, headings, lists and line breaks as faithfully as possible using plain text. '
                + 'Do NOT add commentary, introductions, or explanations. Output ONLY the extracted notes text.',
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const text = (response?.choices?.[0]?.message?.content ?? '').trim()
    if (!text) {
      return NextResponse.json(
        { error: 'Could not read any text from this image. Try a clearer photo.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text, chars: text.length, fileName: file.name })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
    }
    console.error('[api/image/ocr]', err)
    const msg = (err as Error).message || 'Could not read the image.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
