import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { generate, extractJSON, type ChatMessage } from '@/lib/chutes'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json().catch(() => ({}))
    const subject = String(body?.subject ?? '').trim()
    const days = Math.min(Math.max(Number(body?.days) || 7, 1), 30)
    const topics = String(body?.topics ?? '').trim()

    if (!subject || subject.length < 2) {
      return NextResponse.json({ error: 'Please enter a subject.' }, { status: 400 })
    }

    const topicsLine = topics ? `\nThe student mentioned these topics/chapters to cover: ${topics}` : ''

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an expert study planner and academic coach. Build a realistic, day-by-day study plan ' +
          `leading up to an exam in ${days} days. Balance new topics, revision, and practice. ` +
          'Respond with ONLY valid minified JSON (no markdown) of shape: ' +
          '{"subject":string,"totalDays":number,"days":[{"day":number,"topic":string,"goals":string[],"focus":string}]}. ' +
          'Each day should have a clear topic, 2-4 concrete goals, and a one-line focus (e.g. "Concepts", "Revision", "Practice", "Mock test"). ' +
          'Reserve the last 1-2 days for full revision and a mock test.',
      },
      {
        role: 'user',
        content: `Subject: ${subject}\nDays until exam: ${days}${topicsLine}\n\nCreate the study plan.`,
      },
    ]

    const { content, engine } = await generate(messages)
    const parsed = extractJSON<{
      subject: string
      totalDays: number
      days: { day: number; topic: string; goals: string[]; focus: string }[]
    }>(content)

    const plan = (Array.isArray(parsed.days) ? parsed.days : [])
      .map((d) => ({
        day: Number(d?.day) || 0,
        topic: String(d?.topic ?? '').trim(),
        goals: Array.isArray(d?.goals) ? d.goals.map(String) : [],
        focus: String(d?.focus ?? '').trim(),
      }))
      .filter((d) => d.topic)
      .sort((a, b) => a.day - b.day)

    if (!plan.length) {
      return NextResponse.json({ error: 'AI could not build a study plan. Please try again.' }, { status: 502 })
    }

    const result = { subject: subject || parsed.subject, totalDays: days, days: plan }
    await db.history.create({
      data: {
        userId: user.id,
        tool: 'study-plan',
        title: `${subject} · ${days}-Day Plan`,
        inputText: `Subject: ${subject}\nDays: ${days}\nTopics: ${topics || 'auto'}`.slice(0, 4000),
        output: JSON.stringify(result),
        engine,
      },
    })

    return NextResponse.json({ ...result, engine })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
    }
    console.error('[api/study-plan]', err)
    return NextResponse.json({ error: 'Could not generate study plan. Please try again.' }, { status: 500 })
  }
}
