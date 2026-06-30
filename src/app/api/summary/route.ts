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

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'Please paste at least a short paragraph of notes.' }, { status: 400 })
    }
    if (text.length > MAX_CHARS) {
      return NextResponse.json({ error: `Notes are too long (max ${MAX_CHARS} characters).` }, { status: 400 })
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an expert exam tutor. Read the student\'s notes and produce a crisp, exam-focused summary. ' +
          'Respond with ONLY valid minified JSON (no markdown, no commentary) matching this exact shape: ' +
          '{"topic":string,"summary":string,"points":string[],"keyTerms":[{"term":string,"definition":string}]}. ' +
          'The topic should be a concise 1-5 word title. The summary should be 3-5 sentences. ' +
          'Provide 5-8 important points (each a single clear sentence). Provide 3-5 key terms with short definitions.',
      },
      { role: 'user', content: `Notes:\n"""\n${text}\n"""` },
    ]

    const { content, engine } = await generate(messages)
    const parsed = extractJSON<{
      topic: string
      summary: string
      points: string[]
      keyTerms?: { term: string; definition: string }[]
    }>(content)

    const result = {
      topic: String(parsed.topic ?? 'Summary'),
      summary: String(parsed.summary ?? ''),
      points: Array.isArray(parsed.points) ? parsed.points.map(String) : [],
      keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
    }

    await db.history.create({
      data: {
        userId: user.id,
        tool: 'summary',
        title: result.topic,
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
    console.error('[api/summary]', err)
    return NextResponse.json({ error: 'Could not generate summary. Please try again.' }, { status: 500 })
  }
}
