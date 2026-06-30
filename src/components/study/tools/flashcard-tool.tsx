'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Sparkles, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NotesSource } from '@/components/study/notes-source'
import { ToolHeader } from '@/components/study/tool-header'
import { CopyButton, ErrorState, LoadingState } from '@/components/study/shared'
import { EngineBadge } from '@/components/study/engine-badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/client'
import { cn } from '@/lib/utils'

type Flashcard = { front: string; back: string }
type FlashcardResult = { cards: Flashcard[]; engine?: string }

export function FlashcardTool({
  notes,
  setNotes,
}: {
  notes: string
  setNotes: (v: string) => void
}) {
  const [count, setCount] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FlashcardResult | null>(null)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  async function run() {
    setLoading(true)
    setError(null)
    setFlipped(new Set())
    try {
      const data = await api<FlashcardResult>('/api/flashcards', { json: { text: notes, count } })
      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function toggle(i: number) {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <ToolHeader
        icon={Layers}
        title="AI Flashcards"
        description="Generate Q/A flashcards from notes and flip them to self-test."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <NotesSource value={notes} onChange={setNotes} />
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Number of cards</Label>
              <ToggleGroup
                type="single"
                value={String(count)}
                onValueChange={(v) => v && setCount(Number(v))}
                variant="outline"
                className="bg-muted/40"
              >
                {[5, 8, 12, 16].map((n) => (
                  <ToggleGroupItem key={n} value={String(n)}>{n}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <Button onClick={run} disabled={loading || notes.trim().length < 20} className="ml-auto">
              <Sparkles className="size-4" />
              {loading ? 'Generating…' : 'Generate Flashcards'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState label="Creating flashcards…" />}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <EngineBadge engine={result.engine} />
              <span className="text-sm text-muted-foreground">
                {result.cards.length} cards · tap a card to flip
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlipped(new Set())}
              >
                <RotateCcw className="size-4" /> Reset
              </Button>
              <CopyButton
                text={result.cards.map((c, i) => `Card ${i + 1}\nQ: ${c.front}\nA: ${c.back}`).join('\n\n')}
                label="Copy"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.cards.map((card, i) => {
              const isFlipped = flipped.has(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  className="group relative h-44 text-left"
                >
                  <div
                    className={cn(
                      'relative h-full w-full rounded-xl border p-4 transition-all',
                      isFlipped
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {isFlipped ? 'Answer' : 'Card'} {i + 1}
                      </span>
                      <RotateCcw className="size-3 text-muted-foreground/60 transition-transform group-hover:scale-110" />
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={isFlipped ? 'back' : 'front'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                          'text-sm leading-relaxed',
                          isFlipped ? 'text-foreground' : 'font-medium text-foreground'
                        )}
                      >
                        {isFlipped ? card.back : card.front}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
