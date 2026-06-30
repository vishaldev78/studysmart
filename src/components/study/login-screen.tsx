'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  FileText,
  HelpCircle,
  Layers,
  PenLine,
  CalendarDays,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PoweredByChutes } from '@/components/study/engine-badge'
import { api } from '@/lib/client'
import { toast } from 'sonner'

type User = { id: string; name: string; age: number }

const FEATURES = [
  { icon: FileText, label: 'AI Summaries' },
  { icon: HelpCircle, label: 'Auto Quizzes' },
  { icon: PenLine, label: 'Mark-based Answers' },
  { icon: Layers, label: 'Flashcards' },
  { icon: CalendarDays, label: 'Study Plans' },
]

export function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const data = await api<{ user: User }>('/api/auth/login', {
        json: { name, age: Number(age) },
      })
      onLogin(data.user)
    } catch (err) {
      toast.error((err as Error).message || 'Could not log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 ssa-grid-bg opacity-60" />
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-accent/40 blur-3xl" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:block"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Exam-ready in seconds
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Turn your notes into an{' '}
              <span className="text-primary">AI exam-prep system</span>
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Smart Study Assistant reads your notes & PDFs and generates summaries,
              mark-based answers, quizzes, flashcards and study plans — powered by Chutes LLM.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {FEATURES.map((f) => {
                const Icon = f.icon
                return (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur"
                  >
                    <Icon className="size-3.5 text-primary" />
                    {f.label}
                  </span>
                )
              })}
            </div>

            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {['A', 'R', 'P', 'S'].map((c) => (
                  <div
                    key={c}
                    className="grid size-8 place-items-center rounded-full border-2 border-background bg-primary/15 text-xs font-bold text-primary"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <span>Loved by school, college & competitive-exam students</span>
            </div>
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card className="shadow-xl">
              <CardContent className="pt-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <GraduationCap className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">Welcome, student!</h2>
                    <p className="text-sm text-muted-foreground">Just tell us your name & age to begin.</p>
                  </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="age">Your age</Label>
                    <Input
                      id="age"
                      type="number"
                      min={5}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 17"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || name.trim().length < 2 || !age}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Setting up…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" /> Start Studying
                      </>
                    )}
                  </Button>
                </form>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  No password needed — simple, instant access.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 border-t bg-background/70 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4">
          <PoweredByChutes />
        </div>
      </footer>
    </div>
  )
}
