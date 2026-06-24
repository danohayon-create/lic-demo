import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Add hover elevation + cursor (for clickable cards). */
  interactive?: boolean
  /** Remove inner padding (for media-first cards). */
  flush?: boolean
}

/** White card: light border, soft shadow, ~18px radius. The base surface unit. */
export function Card({ interactive, flush, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-card shadow-card',
        !flush && 'p-5',
        interactive && 'cursor-pointer transition-shadow hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
