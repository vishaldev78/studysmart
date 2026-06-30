import ZAI from 'z-ai-web-dev-sdk'

/**
 * Unified LLM engine for Smart Study Assistant.
 *
 * Provider priority (first one that works wins):
 *   1. Chutes LLM  — the "core intelligence" per the PRD (needs CHUTES_API_KEY)
 *   2. Groq        — FREE, fast, OpenAI-compatible fallback that works on any
 *                    local machine (needs GROQ_API_KEY from console.groq.com)
 *   3. z-ai SDK    — only works inside the Z.ai cloud sandbox (no setup needed)
 *
 * All three expose an OpenAI-compatible chat-completions interface, so the rest
 * of the app only talks to `generate()` and gets back a string + the engine
 * that actually produced it.
 */

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type LLMResult = {
  content: string
  engine: 'chutes' | 'groq' | 'zai'
}

/* ------------------------------------------------------------------ Chutes */
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

/* -------------------------------------------------------------------- Groq */
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GROQ_TIMEOUT_MS = 30000

async function callGroq(messages: ChatMessage[]): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS)

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Groq HTTP ${res.status}: ${text.slice(0, 160)}`)
    }

    const data = await res.json()
    const content: string | undefined = data?.choices?.[0]?.message?.content
    if (!content || !content.trim()) throw new Error('Groq returned empty content')
    return content
  } finally {
    clearTimeout(timer)
  }
}

/* --------------------------------------------------------------- z-ai SDK */
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

/* ----------------------------------------------------------- Main entrypoint */
/**
 * Run a chat completion. Tries Chutes → Groq → z-ai (in that order).
 * Throws a helpful, user-facing error if every provider is unavailable.
 */
export async function generate(messages: ChatMessage[]): Promise<LLMResult> {
  const errors: string[] = []

  // 1. Chutes (core intelligence per PRD)
  try {
    const content = await callChutes(messages)
    return { content, engine: 'chutes' }
  } catch (err) {
    errors.push(`Chutes: ${(err as Error).message}`)
    console.warn('[llm] Chutes failed:', (err as Error).message)
  }

  // 2. Groq (free local fallback)
  try {
    const content = await callGroq(messages)
    return { content, engine: 'groq' }
  } catch (err) {
    errors.push(`Groq: ${(err as Error).message}`)
    console.warn('[llm] Groq failed:', (err as Error).message)
  }

  // 3. z-ai SDK (sandbox only — will throw on local machines, that's fine)
  try {
    const content = await callZai(messages)
    return { content, engine: 'zai' }
  } catch (err) {
    errors.push(`z-ai: ${(err as Error).message}`)
    console.warn('[llm] z-ai failed:', (err as Error).message)
  }

  // Nothing worked — give the user a clear, actionable message.
  throw new Error(
    'AI service unavailable. ' +
      (GROQ_API_KEY
        ? 'Check your GROQ_API_KEY.'
        : 'No working LLM provider found. For free local use, get a GROQ_API_KEY from https://console.groq.com/keys and add it to your .env file.') +
      ` (Details: ${errors.join(' | ')})`
  )
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
