// Lightweight client-side fetch helpers for the Smart Study Assistant API.

export type Engine = 'chutes' | 'zai'

export async function api<T>(
  url: string,
  options?: RequestInit & { json?: unknown }
): Promise<T> {
  const init: RequestInit = {
    method: options?.json ? 'POST' : options?.method ?? 'GET',
    headers: { ...(options?.headers || {}) },
    ...options,
  }
  if (options?.json !== undefined) {
    init.headers = { 'Content-Type': 'application/json', ...(options?.headers || {}) }
    init.body = JSON.stringify(options.json)
  }
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: string })?.error || `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  return new Promise((resolve) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } catch {
      /* noop */
    }
    document.body.removeChild(ta)
    resolve()
  })
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}
