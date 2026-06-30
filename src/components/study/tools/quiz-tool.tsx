'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, Sparkles, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
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

type QType = 'mcq' | 'truefalse' | 'short'
type Question = {
  type: QType
  question: string
  options: string[]
  answer: string
  explanation: string
}
type QuizResult = { questions: Question[]; engine?: string }

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuizTool({
  notes,
  setNotes,
}: {
  notes: string
  setNotes: (v: string) => void
}) {
  const [type, setType] = useState<QType>('mcq')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)

  async function run() {
    setLoading(true)
    setError(null)
    setChecked(false)
    setAnswers({})
    try {
      const data = await api<QuizResult>('/api/quiz', { json: { text: notes, type, count } })
      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const score = result
    ? result.questions.reduce((acc, q, i) => {
        const chosen = answers[i]
        if (!chosen) return acc
        const correct =
          q.type === 'short'
            ? null
            : chosen.toLowerCase() === q.answer.toLowerCase() ||
              chosen.toLowerCase() === q.answer.charAt(0).toLowerCase()
        return acc + (correct ? 1 : 0)
      }, 0)
    : 0

  const gradeable = result ? result.questions.filter((q) => q.type !== 'short').length : 0

  return (
    <div className="space-y-6">
      <ToolHeader
        icon={HelpCircle}
        title="AI Quiz Generator"
        description="Auto-build MCQ, True/False or short-answer quizzes from your notes and self-test."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <NotesSource value={notes} onChange={setNotes} />

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Question type</Label>
              <ToggleGroup
                type="single"
                value={type}
                onValueChange={(v) => v && setType(v as QType)}
                variant="outline"
                className="bg-muted/40"
              >
                <ToggleGroupItem value="mcq" aria-label="MCQ">MCQ</ToggleGroupItem>
                <ToggleGroupItem value="truefalse" aria-label="True/False">True / False</ToggleGroupItem>
                <ToggleGroupItem value="short" aria-label="Short">Short</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Number of questions</Label>
              <ToggleGroup
                type="single"
                value={String(count)}
                onValueChange={(v) => v && setCount(Number(v))}
                variant="outline"
                className="bg-muted/40"
              >
                {[3, 5, 8, 10].map((n) => (
                  <ToggleGroupItem key={n} value={String(n)}>{n}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <Button
              onClick={run}
              disabled={loading || notes.trim().length < 20}
              className="w-full sm:ml-auto sm:w-auto"
            >
              <Sparkles className="size-4" />
              {loading ? 'Generating…' : 'Generate Quiz'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState label="Building your quiz…" />}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <EngineBadge engine={result.engine} />
              <span className="text-sm text-muted-foreground">
                {result.questions.length} questions
                {checked && gradeable > 0 && (
                  <span className="ml-2 font-semibold text-foreground">
                    Score: {score}/{gradeable}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {type !== 'short' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChecked((c) => !c)}
                >
                  {checked ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  {checked ? 'Hide answers' : 'Check answers'}
                </Button>
              )}
              <CopyButton
                text={result.questions
                  .map((q, i) => {
                    const head = `Q${i + 1}. ${q.question}`
                    if (q.type === 'short') return `${head}\nAnswer: ${q.answer}`
                    const opts = q.options.map((o, j) => `${LETTERS[j]}) ${o}`).join('\n')
                    return `${head}\n${opts}\nAnswer: ${q.answer}\n${q.explanation}`
                  })
                  .join('\n\n')}
                label="Copy"
              />
            </div>
          </div>

          <div className="space-y-3">
            {result.questions.map((q, i) => (
              <QuizCard
                key={i}
                index={i}
                q={q}
                chosen={answers[i]}
                checked={checked}
                onChoose={(val) =>
                  setAnswers((a) => ({ ...a, [i]: val }))
                }
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function QuizCard({
  index,
  q,
  chosen,
  checked,
  onChoose,
}: {
  index: number
  q: Question
  chosen?: string
  checked: boolean
  onChoose: (val: string) => void
}) {
  const [reveal, setReveal] = useState(false)
  const isShort = q.type === 'short'

  const correctLetter =
    !isShort && q.options.length
      ? LETTERS[q.options.findIndex((o) => o.toLowerCase() === q.answer.toLowerCase())] ||
        q.answer.charAt(0).toUpperCase()
      : q.answer

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/15 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <p className="text-sm font-medium leading-relaxed">{q.question}</p>
        </div>

        {!isShort ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, j) => {
              const letter = LETTERS[j]
              const isChosen = chosen === letter || chosen === opt
              const isCorrect =
                letter === correctLetter || opt.toLowerCase() === q.answer.toLowerCase()
              return (
                <button
                  key={j}
                  type="button"
                  disabled={checked}
                  onClick={() => onChoose(letter)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    'hover:border-primary/40 hover:bg-primary/5',
                    isChosen && !checked && 'border-primary bg-primary/10',
                    checked && isCorrect && 'border-emerald-500/60 bg-emerald-500/10',
                    checked && isChosen && !isCorrect && 'border-destructive/60 bg-destructive/10',
                    !isChosen && !checked && 'border-border bg-background'
                  )}
                >
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold',
                      isChosen && !checked && 'border-primary text-primary',
                      checked && isCorrect && 'border-emerald-500 text-emerald-600',
                      checked && isChosen && !isCorrect && 'border-destructive text-destructive',
                      !isChosen && !checked && 'border-muted-foreground/40 text-muted-foreground'
                    )}
                  >
                    {letter}
                  </span>
                  <span className="leading-snug">{opt}</span>
                  {checked && isCorrect && <CheckCircle2 className="ml-auto size-4 text-emerald-600" />}
                  {checked && isChosen && !isCorrect && <XCircle className="ml-auto size-4 text-destructive" />}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {reveal ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                <p className="text-xs font-semibold text-primary">Model Answer</p>
                <p className="text-sm leading-relaxed">{q.answer}</p>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setReveal(true)}>
                <Eye className="size-4" /> Reveal answer
              </Button>
            )}
          </div>
        )}

        {(checked || (isShort && reveal)) && q.explanation && (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Explanation: </span>
            {q.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
