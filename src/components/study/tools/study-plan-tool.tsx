'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Sparkles, Target, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToolHeader } from '@/components/study/tool-header'
import { CopyButton, ErrorState, LoadingState } from '@/components/study/shared'
import { EngineBadge } from '@/components/study/engine-badge'
import { api } from '@/lib/client'
import { cn } from '@/lib/utils'

type PlanDay = { day: number; topic: string; goals: string[]; focus: string }
type PlanResult = { subject: string; totalDays: number; days: PlanDay[]; engine?: string }

const FOCUS_STYLES: Record<string, string> = {
  revision: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  practice: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  mock: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  test: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  concepts: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  default: 'border-primary/40 bg-primary/10 text-primary',
}

function focusClass(focus: string) {
  const k = Object.keys(FOCUS_STYLES).find((key) => focus.toLowerCase().includes(key))
  return k ? FOCUS_STYLES[k] : FOCUS_STYLES.default
}

export function StudyPlanTool() {
  const [subject, setSubject] = useState('')
  const [days, setDays] = useState(10)
  const [topics, setTopics] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PlanResult | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const data = await api<PlanResult>('/api/study-plan', {
        json: { subject, days, topics },
      })
      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const plain = result
    ? `Study Plan: ${result.subject} (${result.totalDays} days)\n\n${result.days
        .map(
          (d) =>
            `Day ${d.day} — ${d.topic} [${d.focus}]\n${d.goals.map((g) => `  • ${g}`).join('\n')}`
        )
        .join('\n\n')}`
    : ''

  return (
    <div className="space-y-6">
      <ToolHeader
        icon={CalendarDays}
        title="Smart Study Plan"
        description="Generate a balanced day-by-day revision plan up to your exam date."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="days">Days until exam</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="topics">Topics / chapters to cover (optional)</Label>
            <Textarea
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g. Mechanics, Thermodynamics, Optics, Waves…"
              className="min-h-[80px]"
            />
          </div>
          <Button onClick={run} disabled={loading || subject.trim().length < 2}>
            <Sparkles className="size-4" />
            {loading ? 'Planning…' : 'Generate Study Plan'}
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState label="Designing your study plan…" />}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <EngineBadge engine={result.engine} />
              <span className="text-sm text-muted-foreground">
                {result.subject} · {result.days.length}-day plan
              </span>
            </div>
            <CopyButton text={plain} />
          </div>

          <div className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {result.days.map((d, i) => (
              <motion.div
                key={d.day}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative pl-12"
              >
                <span className="absolute left-0 top-3 grid size-10 place-items-center rounded-full border bg-card text-sm font-bold text-primary shadow-sm">
                  {d.day}
                </span>
                <Card>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{d.topic}</h3>
                      {d.focus && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                            focusClass(d.focus)
                          )}
                        >
                          <Flag className="size-3" />
                          {d.focus}
                        </span>
                      )}
                    </div>
                    {d.goals.length > 0 && (
                      <ul className="space-y-1">
                        {d.goals.map((g, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Target className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                            <span className="leading-snug">{g}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
