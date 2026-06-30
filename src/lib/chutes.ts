import ZAI from 'z-ai-web-dev-sdk'

/**
 * Unified LLM engine for Smart Study Assistant.
 *
 * Primary provider: Chutes LLM (https://llm.chutes.ai) — "core intelligence".
 * Fallback provider: in-house z-ai-web-dev-sdk (guarantees the app keeps
 * working even when the Chutes account has no balance / quota).
 *
 * Both providers expose an OpenAI-compatible chat-completions interface, so the
 * rest of the app only talks to `generate()` and gets back a string + the
 * engine that actually produced it.
 */

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type LLMResult = {
  content: string
  engine: 'chutes' | 'zai'
}

const CHUTES_API_KEY = process.env.CHUTES_API_KEY
const CHUTES_ENDPOINT = 'https://llm.chutes.ai/v1/chat/completions'
const CHUTES_MODEL = process.env.CHUTES_MODEL || 'deepseek-ai/DeepSeek-V3.2-TEE'
const CHUTES_TIMEOUT_MS = 20000

// Cache a recent Chutes failure so we don't add latency to every single call
// once we know the account is out of quota.
let chutesKnownDownUntil = 0

async function callChutes(messages: ChatMessage[]): Promise<string> {
  if (!CHUTES_API_KEY) throw new Error('CHUTES_API_KEY not configured')
  if (Date.now() < chutesKnownDownUntil) {
    throw new Error('Chutes temporarily unavailable (cached)')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHUTES_TIMEOUT_MS)

  try {
    const res = await fetch(CHUTES_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CHUTES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CHUTES_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      // Quota / billing errors → mark Chutes as down for a while
      if (res.status === 402 || /quota|balance|payment/i.test(text)) {
        chutesKnownDownUntil = Date.now() + 5 * 60 * 1000
      }
      throw new Error(`Chutes HTTP ${res.status}: ${text.slice(0, 160)}`)
    }

    const data = await res.json()
    const content: string | undefined = data?.choices?.[0]?.message?.content
    if (!content || !content.trim()) throw new Error('Chutes returned empty content')
    return content
  } finally {
    clearTimeout(timer)
  }
}

let zaiPromise: Promise<unknown> | null = null
async function getZai() {
  if (!zaiPromise) zaiPromise = ZAI.create()
  return zaiPromise as Promise<Awaited<ReturnType<typeof ZAI.create>>>
}

async function callZai(messages: ChatMessage[]): Promise<string> {
  const zai = await getZai()
  // z-ai SDK uses role 'assistant' for the system prompt
  const mapped = messages.map((m) =>
    m.role === 'system' ? { role: 'assistant' as const, content: m.content } : m
  )
  const completion = await zai.chat.completions.create({
    messages: mapped as never,
    thinking: { type: 'disabled' },
  })
  const content = completion.choices?.[0]?.message?.content
  if (!content || !content.trim()) throw new Error('z-ai returned empty content')
  return content
}

/**
 * Run a chat completion. Tries Chutes first, falls back to z-ai.
 */
export async function generate(messages: ChatMessage[]): Promise<LLMResult> {
  try {
    const content = await callChutes(messages)
    return { content, engine: 'chutes' }
  } catch (err) {
    console.warn('[llm] Chutes failed, falling back to z-ai:', (err as Error).message)
    const content = await callZai(messages)
    return { content, engine: 'zai' }
  }
}

/**
 * Robustly extract a JSON object/array from an LLM response that may be
 * wrapped in markdown fences or contain extra prose.
 */
export function extractJSON<T = unknown>(raw: string): T {
  if (!raw) throw new Error('Empty LLM response')
  let text = raw.trim()

  // Strip ```json ... ``` or ``` ... ``` fences
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()

  try {
    return JSON.parse(text) as T
  } catch {
    // Fall through to extraction
  }

  // Try to find the first balanced { ... } or [ ... ]
  const start = text.search(/[\[{]/)
  if (start === -1) throw new Error('No JSON found in LLM response')

  const open = text[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inStr = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inStr) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) {
        const slice = text.slice(start, i + 1)
        return JSON.parse(slice) as T
      }
    }
  }
  throw new Error('Could not parse JSON from LLM response')
}
