import { cn } from '@/lib/cn'
import { asset } from '@/lib/asset'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AvatarProps = {
  src?: string
  /** Full name — used for alt text and initials fallback. */
  name: string
  size?: Size
  /** Show a thin ring around the avatar. */
  ring?: boolean
  className?: string
}

const sizes: Record<Size, { box: string; text: string }> = {
  xs: { box: 'h-6 w-6', text: 'text-[10px]' },
  sm: { box: 'h-8 w-8', text: 'text-xs' },
  md: { box: 'h-10 w-10', text: 'text-sm' },
  lg: { box: 'h-14 w-14', text: 'text-base' },
  xl: { box: 'h-20 w-20', text: 'text-xl' },
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

/** Round avatar with image + initials fallback. */
export function Avatar({ src, name, size = 'md', ring, className }: AvatarProps) {
  const s = sizes[size]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-line font-semibold text-muted',
        s.box,
        s.text,
        ring && 'ring-2 ring-white',
        className,
      )}
    >
      {src ? (
        <img src={asset(src)} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={name}>{initials(name)}</span>
      )}
    </span>
  )
}
