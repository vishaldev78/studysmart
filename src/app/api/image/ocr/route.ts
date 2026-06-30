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

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

const OCR_PROMPT =
  'You are an accurate OCR engine. Extract ALL text visible in this image of study notes. ' +
  'Preserve the original order, headings, lists and line breaks as faithfully as possible using plain text. ' +
  'Do NOT add commentary, introductions, or explanations. Output ONLY the extracted notes text.'

async function ocrWithGroq(dataUrl: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: OCR_PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Groq Vision HTTP ${res.status}: ${text.slice(0, 160)}`)
    }

    const data = await res.json()
    const content: string | undefined = data?.choices?.[0]?.message?.content
    if (!content || !content.trim()) throw new Error('Groq Vision returned empty content')
    return content.trim()
  } finally {
    clearTimeout(timer)
  }
}

async function ocrWithZai(dataUrl: string): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  })
  const text = (response?.choices?.[0]?.message?.content ?? '').trim()
  if (!text) throw new Error('z-ai vision returned empty content')
  return text
}

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

    const buf = Buffer.from(await file.arrayBuffer())
    const base64 = buf.toString('base64')
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`

    // Try Groq Vision first (works locally with free key), then z-ai (sandbox).
    let text: string
    try {
      text = await ocrWithGroq(dataUrl)
    } catch (groqErr) {
      console.warn('[image/ocr] Groq Vision failed:', (groqErr as Error).message)
      text = await ocrWithZai(dataUrl)
    }

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
    return NextResponse.json(
      {
        error: GROQ_API_KEY
          ? msg
          : 'Image OCR needs a GROQ_API_KEY. Get a free one from https://console.groq.com/keys and add it to .env',
      },
      { status: 500 }
    )
  }
}
