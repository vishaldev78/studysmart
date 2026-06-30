'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, ListChecks, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotesSource } from '@/components/study/notes-source'
import { ToolHeader } from '@/components/study/tool-header'
import { CopyButton, ErrorState, LoadingState } from '@/components/study/shared'
import { EngineBadge } from '@/components/study/engine-badge'
import { api } from '@/lib/client'

type SummaryResult = {
  topic: string
  summary: string
  points: string[]
  keyTerms: { term: string; definition: string }[]
  engine?: string
}

export function SummaryTool({
  notes,
  setNotes,
}: {
  notes: string
  setNotes: (v: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SummaryResult | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const data = await api<SummaryResult>('/api/summary', { json: { text: notes } })
      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const plain = result
    ? `Topic: ${result.topic}\n\nSummary:\n${result.summary}\n\nImportant Points:\n${result.points.map((p, i) => `${i + 1}. ${p}`).join('\n')}${result.keyTerms.length ? `\n\nKey Terms:\n${result.keyTerms.map((k) => `- ${k.term}: ${k.definition}`).join('\n')}` : ''}`
    : ''

  return (
    <div className="space-y-6">
      <ToolHeader
        icon={FileText}
        title="AI Summary Generator"
        description="Turn long notes into a crisp topic summary, key points and glossary."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <NotesSource value={notes} onChange={setNotes} />
          <Button onClick={run} disabled={loading || notes.trim().length < 20} className="w-full sm:w-auto">
            <Sparkles className="size-4" />
            {loading ? 'Generating…' : 'Generate Summary'}
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState label="Summarising your notes…" />}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="flex h-[500px] flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-2 border-b shrink-0">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Topic</p>
                <CardTitle className="truncate text-xl">{result.topic}</CardTitle>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <EngineBadge engine={result.engine} />
                <CopyButton text={plain} label="Copy" />
              </div>
            </CardHeader>
            <CardContent className="ssa-scroll min-h-0 flex-1 space-y-5 overflow-y-auto">
              <section>
                <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="size-4 text-primary" /> Summary
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90">{result.summary}</p>
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="size-4 text-primary" /> Important Points
                </h3>
                <ol className="space-y-1.5">
                  {result.points.map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {result.keyTerms.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">Key Terms</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {result.keyTerms.map((k, i) => (
                      <div key={i} className="rounded-lg border bg-muted/30 px-3 py-2">
                        <p className="text-sm font-semibold text-primary">{k.term}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">{k.definition}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
