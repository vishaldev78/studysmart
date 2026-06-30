'use client'

import { useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/client'
import { toast } from 'sonner'

export function CopyButton({
  text,
  label = 'Copy',
  size = 'sm',
  variant = 'outline',
}: {
  text: string
  label?: string
  size?: 'sm' | 'default'
  variant?: 'outline' | 'ghost' | 'secondary'
}) {
  const [done, setDone] = useState(false)
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={async () => {
        try {
          await copyToClipboard(text)
          setDone(true)
          toast.success('Copied to clipboard')
          setTimeout(() => setDone(false), 1500)
        } catch {
          toast.error('Could not copy')
        }
      }}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      {done ? 'Copied' : label}
    </Button>
  )
}

export function LoadingState({ label = 'AI is thinking…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-12">
      <Loader2 className="size-7 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/70">Powered by Chutes LLM</p>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}
