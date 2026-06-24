import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'good' | 'maybe' | 'no' | 'gold' | 'cream' | 'link'

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone
  icon?: ReactNode
}

const tones: Record<Tone, string> = {
  neutral: 'bg-paper text-muted border border-line',
  good: 'bg-signal-good-bg text-signal-good border border-signal-good/30',
  maybe: 'bg-signal-maybe/10 text-[#8A6D00] border border-signal-maybe/30',
  no: 'bg-signal-no/10 text-signal-no border border-signal-no/30',
  gold: 'bg-gold/15 text-[#8A6D00] border border-gold/40',
  cream: 'bg-cream text-ink border border-black/5',
  link: 'bg-link/10 text-link border border-link/20',
}

/** Fully-rounded pill: tags, status chips, signal labels. */
export function Tag({ tone = 'neutral', icon, className, children, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}
