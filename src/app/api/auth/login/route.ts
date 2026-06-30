import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = String(body?.name ?? '').trim()
    const age = Number(body?.age)

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter your name (min 2 characters).' }, { status: 400 })
    }
    if (!Number.isFinite(age) || age < 5 || age > 100) {
      return NextResponse.json({ error: 'Please enter a valid age (5–100).' }, { status: 400 })
    }

    // Simple login: reuse an existing user with the same name + age, else create.
    let user = await db.user.findFirst({ where: { name, age } })
    if (!user) user = await db.user.create({ data: { name, age } })

    await setSession(user.id)
    return NextResponse.json({ user: { id: user.id, name: user.name, age: user.age } })
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}
