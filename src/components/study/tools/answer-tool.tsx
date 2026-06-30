'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { PenLine, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Label } from '@/components/ui/label'
import { ToolHeader } from '@/components/study/tool-header'
import { CopyButton, ErrorState, LoadingState } from '@/components/study/shared'
import { EngineBadge } from '@/components/study/engine-badge'
import { api } from '@/lib/client'

type AnswerResult = {
  question: string
  marks: number
  markdown: string
  sections: { heading: string; body: string }[]
  engine?: string
}

const MARK_OPTIONS = [2, 5, 10, 15]

export function AnswerTool() {
  const [question, setQuestion] = useState('')
  const [marks, setMarks] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const data = await api<AnswerResult>('/api/answer', { json: { question, marks } })
      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToolHeader
        icon={PenLine}
        title="Exam Answer Generator"
        description="Write model answers worth exactly 2, 5, 10 or 15 marks — structured for exams."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="q">Question</Label>
            <Input
              id="q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Explain the process of photosynthesis."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && question.trim().length > 2) run()
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Answer worth</Label>
            <ToggleGroup
              type="single"
              value={String(marks)}
              onValueChange={(v) => v && setMarks(Number(v))}
              variant="outline"
              className="bg-muted/40"
            >
              {MARK_OPTIONS.map((m) => (
                <ToggleGroupItem key={m} value={String(m)}>
                  {m} Marks
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Button onClick={run} disabled={loading || question.trim().length < 3}>
            <Sparkles className="size-4" />
            {loading ? 'Writing answer…' : 'Generate Answer'}
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState label={`Writing a ${marks}-mark answer…`} />}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {result.marks}-mark answer
                </p>
                <CardTitle className="text-base leading-snug">{result.question}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <EngineBadge engine={result.engine} />
                <CopyButton text={result.markdown} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="ssa-prose rounded-lg border bg-muted/20 p-4 text-sm">
                <ReactMarkdown>{result.markdown}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
