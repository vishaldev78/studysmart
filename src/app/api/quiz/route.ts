import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { generate, extractJSON, type ChatMessage } from '@/lib/chutes'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
const MAX_CHARS = 20000

type QuizType = 'mcq' | 'truefalse' | 'short'
const VALID_TYPES: QuizType[] = ['mcq', 'truefalse', 'short']

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json().catch(() => ({}))
    const text = String(body?.text ?? '').trim()
    const count = Math.min(Math.max(Number(body?.count) || 5, 1), 15)
    const requestedType = String(body?.type ?? 'mcq') as QuizType
    const type: QuizType = VALID_TYPES.includes(requestedType) ? requestedType : 'mcq'

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'Please paste some notes to build a quiz from.' }, { status: 400 })
    }
    if (text.length > MAX_CHARS) {
      return NextResponse.json({ error: `Notes are too long (max ${MAX_CHARS} characters).` }, { status: 400 })
    }

    const typeInstruction =
      type === 'mcq'
        ? 'Generate ONLY multiple-choice questions. Each must have exactly 4 options (A-D) and a single correct answer letter.'
        : type === 'truefalse'
          ? 'Generate ONLY true/false statements. options should be ["True","False"] and answer is "True" or "False".'
          : 'Generate ONLY short-answer questions. options should be an empty array and answer should be a concise model answer (1-2 sentences).'

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an expert exam setter. Create a quiz that genuinely tests understanding of the provided notes. ' +
          typeInstruction +
          ' Respond with ONLY valid minified JSON (no markdown) of shape: ' +
          '{"questions":[{"type":"' + type + '","question":string,"options":string[],"answer":string,"explanation":string}]}. ' +
          'Make questions clear and unambiguous. Provide a short explanation for each answer. ' +
          'For MCQ, options must be 4 distinct strings and answer must be the letter (A/B/C/D).',
      },
      { role: 'user', content: `Create ${count} ${type} questions from these notes:\n"""\n${text}\n"""` },
    ]

    const { content, engine } = await generate(messages)
    const parsed = extractJSON<{ questions: unknown[] }>(content)

    const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
      .map((q) => {
        const o = q as Record<string, unknown>
        return {
          type,
          question: String(o?.question ?? '').trim(),
          options: Array.isArray(o?.options) ? (o.options as unknown[]).map(String) : [],
          answer: String(o?.answer ?? '').trim(),
          explanation: String(o?.explanation ?? '').trim(),
        }
      })
      .filter((q) => q.question)

    if (!questions.length) {
      return NextResponse.json({ error: 'AI could not generate quiz questions. Try different notes.' }, { status: 502 })
    }

    const result = { questions }
    await db.history.create({
      data: {
        userId: user.id,
        tool: 'quiz',
        title: `${type.toUpperCase()} Quiz · ${questions.length} Qs`,
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
    console.error('[api/quiz]', err)
    return NextResponse.json({ error: 'Could not generate quiz. Please try again.' }, { status: 500 })
  }
}
