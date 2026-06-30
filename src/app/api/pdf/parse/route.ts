import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { extractPdfText, MAX_PDF_PAGES } from '@/lib/pdf'

export const runtime = 'nodejs'
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB

export async function POST(req: NextRequest) {
  try {
    await requireUser()

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please upload a PDF file.' }, { status: 400 })
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported here. Use the image button for photos of notes.' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'PDF is too large (max 8 MB).' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const { text, pages, totalPages } = await extractPdfText(buf)
    const trimmed = text

    return NextResponse.json({
      text: trimmed,
      chars: trimmed.length,
      fileName: file.name,
      pages,
      totalPages,
      truncated: totalPages > MAX_PDF_PAGES,
      maxPages: MAX_PDF_PAGES,
    })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
    }
    console.error('[api/pdf/parse]', err)
    const msg = (err as Error).message || 'Could not read the PDF.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
