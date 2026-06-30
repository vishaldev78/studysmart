import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { generate, extractJSON, type ChatMessage } from '@/lib/chutes'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
const MAX_CHARS = 20000

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json().catch(() => ({}))
    const text = String(body?.text ?? '').trim()
    const count = Math.min(Math.max(Number(body?.count) || 8, 3), 20)

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'Please paste some notes to create flashcards.' }, { status: 400 })
    }
    if (text.length > MAX_CHARS) {
      return NextResponse.json({ error: `Notes are too long (max ${MAX_CHARS} characters).` }, { status: 400 })
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an expert at building study flashcards. From the notes, create concise Q/A flashcards ' +
          'that capture the most testable facts and definitions. ' +
          'Respond with ONLY valid minified JSON (no markdown) of shape: ' +
          '{"cards":[{"front":string,"back":string}]}. ' +
          'front = a short question or term. back = a clear, memorable answer (1-3 sentences). ' +
          'Do not duplicate information across cards.',
      },
      { role: 'user', content: `Create ${count} flashcards from these notes:\n"""\n${text}\n"""` },
    ]

    const { content, engine } = await generate(messages)
    const parsed = extractJSON<{ cards: unknown[] }>(content)

    const cards = (Array.isArray(parsed.cards) ? parsed.cards : [])
      .map((c) => {
        const o = c as Record<string, unknown>
        return { front: String(o?.front ?? '').trim(), back: String(o?.back ?? '').trim() }
      })
      .filter((c) => c.front && c.back)

    if (!cards.length) {
      return NextResponse.json({ error: 'AI could not generate flashcards. Try different notes.' }, { status: 502 })
    }

    const result = { cards }
    await db.history.create({
      data: {
        userId: user.id,
        tool: 'flashcards',
        title: `${cards.length} Flashcards`,
        inputText: text.slice(0, 4000),
        output: JSON.stringify(result),
        engine,
      },
    })

    return NextResponse.json({ ...result, engine })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
    }
    console.error('[api/flashcards]', err)
    return NextResponse.json({ error: 'Could not generate flashcards. Please try again.' }, { status: 500 })
  }
}
