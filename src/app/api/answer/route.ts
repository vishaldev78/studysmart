import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { generate, type ChatMessage } from '@/lib/chutes'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const VALID_MARKS = [2, 5, 10, 15] as const
type Marks = (typeof VALID_MARKS)[number]

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json().catch(() => ({}))
    const question = String(body?.question ?? '').trim()
    const marks = Number(body?.marks)

    if (!question || question.length < 3) {
      return NextResponse.json({ error: 'Please enter a question.' }, { status: 400 })
    }
    if (!VALID_MARKS.includes(marks as Marks)) {
      return NextResponse.json({ error: 'Marks must be 2, 5, 10, or 15.' }, { status: 400 })
    }

    const lengthGuide: Record<Marks, string> = {
      2: 'about 40-60 words. Give a short, precise definition with one key fact. No headings.',
      5: 'about 120-180 words. Include a clear definition, 3-4 key points, and a brief example.',
      10: 'about 250-350 words. Use sections: Introduction, Explanation (with key points), Diagram/Examples, Conclusion.',
      15: 'about 450-600 words. Use well-structured sections: Introduction, Detailed Explanation, Key Points (bulleted), Diagrams/Flow (describe), Examples, Significance, Conclusion. Be thorough and exam-ready.',
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a top-performing exam tutor. Write a model answer worth the requested marks. ' +
          'Use clean Markdown formatting with ## headings for sections and **bold** for key terms where helpful. ' +
          'Be accurate, structured, and directly address the question. Do not add meta commentary.',
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nWrite a ${marks}-mark answer. Target length: ${lengthGuide[marks as Marks]}`,
      },
    ]

    const { content, engine } = await generate(messages)
    const markdown = content.trim()

    // Lightly split into sections for nicer UI rendering
    const sections = markdown
      .split(/^##\s+/m)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const nl = s.indexOf('\n')
        return nl === -1
          ? { heading: '', body: s }
          : { heading: s.slice(0, nl).trim(), body: s.slice(nl + 1).trim() }
      })

    const result = { question, marks, markdown, sections }
    await db.history.create({
      data: {
        userId: user.id,
        tool: 'answer',
        title: `${marks} Marks · ${question.slice(0, 50)}`,
        inputText: question.slice(0, 4000),
        output: JSON.stringify(result),
        engine,
      },
    })

    return NextResponse.json({ ...result, engine })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
    }
    console.error('[api/answer]', err)
    return NextResponse.json({ error: 'Could not generate answer. Please try again.' }, { status: 500 })
  }
}
