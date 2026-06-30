'use client'

import type { LucideIcon } from 'lucide-react'

export function ToolHeader({
  icon: Icon,
  title,
  description,
  accent = 'text-primary',
}: {
  icon: LucideIcon
  title: string
  description: string
  accent?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
        <Icon className={`size-5 ${accent}`} />
      </div>
      <div>
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
