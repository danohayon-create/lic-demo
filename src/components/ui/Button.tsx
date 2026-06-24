import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'premium'
type Size = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  /** Optional leading icon (e.g. a lucide-react icon element). */
  icon?: ReactNode
  /** Optional trailing icon. */
  iconRight?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-btn font-semibold ' +
  'transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90 active:scale-[0.98]',
  secondary: 'bg-card text-ink border border-line hover:bg-paper active:scale-[0.98]',
  ghost: 'bg-transparent text-ink hover:bg-ink/5 active:scale-[0.98]',
  // cream/gold premium CTA (Snap apply, Self Tape) — pair with a Zap icon
  premium: 'bg-cream text-ink hover:brightness-[0.97] active:scale-[0.98] shadow-sm',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, className, children, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
      {iconRight}
    </button>
  )
})
