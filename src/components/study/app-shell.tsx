'use client'

import { useState } from 'react'
import {
  FileText,
  HelpCircle,
  PenLine,
  Layers,
  CalendarDays,
  History as HistoryIcon,
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PoweredByChutes } from '@/components/study/engine-badge'
import { SummaryTool } from '@/components/study/tools/summary-tool'
import { QuizTool } from '@/components/study/tools/quiz-tool'
import { AnswerTool } from '@/components/study/tools/answer-tool'
import { FlashcardTool } from '@/components/study/tools/flashcard-tool'
import { StudyPlanTool } from '@/components/study/tools/study-plan-tool'
import { HistoryTool } from '@/components/study/tools/history-tool'
import { cn } from '@/lib/utils'

type Tool = 'summary' | 'quiz' | 'answer' | 'flashcards' | 'study-plan' | 'history'

type User = { id: string; name: string; age: number }

const NAV: { id: Tool; label: string; icon: typeof FileText; hint: string }[] = [
  { id: 'summary', label: 'Summary', icon: FileText, hint: 'Summarise notes' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, hint: 'Self-test' },
  { id: 'answer', label: 'Exam Answer', icon: PenLine, hint: '2/5/10/15 marks' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, hint: 'Flip & learn' },
  { id: 'study-plan', label: 'Study Plan', icon: CalendarDays, hint: 'Day-by-day' },
  { id: 'history', label: 'History', icon: HistoryIcon, hint: 'Saved items' },
]

export function AppShell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { theme, setTheme } = useTheme()
  const [active, setActive] = useState<Tool>('summary')
  const [notes, setNotes] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold sm:text-base">Smart Study Assistant</p>
              <PoweredByChutes className="hidden sm:inline-flex" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <div className="flex items-center gap-2 rounded-full border bg-card pl-1 pr-3">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                  {initials || 'S'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Log out">
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-0 lg:gap-6 lg:px-4">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 py-4 lg:block">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="mt-6 rounded-xl border bg-muted/30 p-3">
            <p className="text-xs font-semibold">Study tip</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Paste notes once, then run Summary → Quiz → Flashcards on the same source for the best results.
            </p>
          </div>
        </aside>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileNav && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 lg:hidden"
                onClick={() => setMobileNav(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-background p-4 shadow-xl lg:hidden"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold">Menu</span>
                  <Button variant="ghost" size="icon" onClick={() => setMobileNav(false)}>
                    <X className="size-5" />
                  </Button>
                </div>
                <nav className="space-y-1">
                  {NAV.map((item) => {
                    const Icon = item.icon
                    const isActive = active === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActive(item.id)
                          setMobileNav(false)
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        )}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="min-w-0 flex-1 py-6 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="px-4 lg:px-0"
            >
              {active === 'summary' && <SummaryTool notes={notes} setNotes={setNotes} />}
              {active === 'quiz' && <QuizTool notes={notes} setNotes={setNotes} />}
              {active === 'answer' && <AnswerTool />}
              {active === 'flashcards' && <FlashcardTool notes={notes} setNotes={setNotes} />}
              {active === 'study-plan' && <StudyPlanTool />}
              {active === 'history' && <HistoryTool />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="sticky bottom-0 z-30 flex items-center justify-around border-t bg-background/95 backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5" />
              {item.label.split(' ')[0]}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Smart Study Assistant AI</p>
          <PoweredByChutes />
        </div>
      </footer>
    </div>
  )
}
