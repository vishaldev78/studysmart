'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { History, Trash2, Eye, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ToolHeader } from '@/components/study/tool-header'
import { EngineBadge } from '@/components/study/engine-badge'
import { ErrorState, LoadingState } from '@/components/study/shared'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { api, timeAgo, copyToClipboard } from '@/lib/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type HistoryItem = {
  id: string
  tool: string
  title: string
  inputText: string
  output: string
  engine?: string
  createdAt: string
}

const TOOL_LABELS: Record<string, string> = {
  summary: 'Summary',
  quiz: 'Quiz',
  answer: 'Answer',
  flashcards: 'Flashcards',
  'study-plan': 'Study Plan',
}

export function HistoryTool() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<HistoryItem | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api<{ items: HistoryItem[] }>('/api/history')
      setItems(data.items)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(id: string) {
    const prev = items
    setItems((s) => s.filter((i) => i.id !== id))
    try {
      await api(`/api/history?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      toast.success('Deleted')
      if (active?.id === id) setActive(null)
    } catch (err) {
      setItems(prev)
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <ToolHeader
        icon={History}
        title="Your History"
        description="Every generation is saved automatically — review, copy or delete them here."
      />

      {loading && <LoadingState label="Loading your history…" />}
      {error && <ErrorState message={error} />}
      {!loading && !error && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Inbox className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No saved items yet</p>
            <p className="text-sm text-muted-foreground">
              Generate a summary, quiz, answer, flashcards or plan — it’ll show up here.
            </p>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="font-medium">
                      {TOOL_LABELS[item.tool] || item.tool}
                    </Badge>
                    <EngineBadge engine={item.engine} />
                  </div>
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.inputText.slice(0, 120)}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setActive(item)}>
                        <Eye className="size-4" /> View
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <HistoryDialog item={active} onClose={() => setActive(null)} />
    </div>
  )
}

function HistoryDialog({ item, onClose }: { item: HistoryItem | null; onClose: () => void }) {
  const { parsed, rawText } = useMemo(() => {
    if (!item) return { parsed: null, rawText: '' }
    try {
      return { parsed: JSON.parse(item.output), rawText: item.output }
    } catch {
      return { parsed: null, rawText: item.output }
    }
  }, [item])

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item && <Badge variant="secondary">{TOOL_LABELS[item.tool] || item.tool}</Badge>}
            {item?.title}
          </DialogTitle>
          <DialogDescription>
            Saved {item ? timeAgo(item.createdAt) : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="ssa-scroll max-h-[60vh] overflow-y-auto pr-1">
          {item && (
            <div className="mb-3 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await copyToClipboard(prettyText(parsed, item.tool))
                  toast.success('Copied')
                }}
              >
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={async () => {
                await copyToClipboard(rawText)
                toast.success('Copied raw JSON')
              }}>
                Copy JSON
              </Button>
            </div>
          )}
          {parsed ? <ParsedView data={parsed} tool={item?.tool || ''} /> : (
            <pre className={cn('whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs')}>
              {rawText}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ParsedView({ data, tool }: { data: unknown; tool: string }) {
  const d = data as Record<string, unknown>
  if (tool === 'summary') {
    return (
      <div className="space-y-3 text-sm">
        <p className="font-semibold">{String(d.topic ?? '')}</p>
        <p className="leading-relaxed">{String(d.summary ?? '')}</p>
        {(d.points as string[])?.length > 0 && (
          <ol className="list-decimal space-y-1 pl-5">
            {(d.points as string[]).map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        )}
      </div>
    )
  }
  if (tool === 'quiz') {
    return (
      <div className="space-y-3 text-sm">
        {((d.questions as Record<string, unknown>[]) || []).map((q, i) => (
          <div key={i} className="rounded-lg border p-3">
            <p className="font-medium">Q{i + 1}. {String(q.question ?? '')}</p>
            {(q.options as string[])?.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {(q.options as string[]).map((o, j) => (
                  <li key={j}>{String.fromCharCode(65 + j)}) {o}</li>
                ))}
              </ul>
            )}
            <p className="mt-1 font-semibold text-primary">Answer: {String(q.answer ?? '')}</p>
            {q.explanation ? <p className="text-xs text-muted-foreground">{String(q.explanation)}</p> : null}
          </div>
        ))}
      </div>
    )
  }
  if (tool === 'answer') {
    return <div className="ssa-prose whitespace-pre-wrap text-sm">{String(d.markdown ?? '')}</div>
  }
  if (tool === 'flashcards') {
    return (
      <div className="space-y-2 text-sm">
        {((d.cards as Record<string, unknown>[]) || []).map((c, i) => (
          <div key={i} className="rounded-lg border p-3">
            <p className="font-medium">Q: {String(c.front ?? '')}</p>
            <p className="text-muted-foreground">A: {String(c.back ?? '')}</p>
          </div>
        ))}
      </div>
    )
  }
  if (tool === 'study-plan') {
    return (
      <div className="space-y-2 text-sm">
        {((d.days as Record<string, unknown>[]) || []).map((day, i) => (
          <div key={i} className="rounded-lg border p-3">
            <p className="font-medium">Day {String(day.day ?? '')} — {String(day.topic ?? '')} [{String(day.focus ?? '')}]</p>
            {((day.goals as string[]) || []).map((g, j) => (
              <p key={j} className="text-muted-foreground">• {g}</p>
            ))}
          </div>
        ))}
      </div>
    )
  }
  return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(d, null, 2)}</pre>
}

function prettyText(data: unknown, tool: string): string {
  const d = data as Record<string, unknown>
  if (tool === 'answer') return String(d.markdown ?? '')
  return JSON.stringify(d, null, 2)
}
