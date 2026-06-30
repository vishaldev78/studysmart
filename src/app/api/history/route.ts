import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await requireUser()
    const items = await db.history.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        tool: true,
        title: true,
        inputText: true,
        output: true,
        engine: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ items })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
    }
    console.error('[api/history GET]', err)
    return NextResponse.json({ error: 'Could not load history.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

    const existing = await db.history.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    await db.history.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
    }
    console.error('[api/history DELETE]', err)
    return NextResponse.json({ error: 'Could not delete item.' }, { status: 500 })
  }
}
