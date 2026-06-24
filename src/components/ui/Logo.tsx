import { colors } from '@/styles/tokens'
import { cn } from '@/lib/cn'

type LogoProps = {
  /** Show only the 3-square mark, without the wordmark. */
  markOnly?: boolean
  /** Pixel height of the mark; wordmark scales to match. */
  size?: number
  className?: string
}

/**
 * Let It Cast logo — a playful "clapperboard" mark of three offset squares
 * (yellow top-left, blue bottom-left, red/pink right) + the lowercase wordmark.
 */
export function Logo({ markOnly = false, size = 26, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Mark size={size} />
      {!markOnly && (
        <span
          className="font-sans font-extrabold lowercase tracking-tight text-ink"
          style={{ fontSize: size * 0.74, lineHeight: 1 }}
        >
          let it cast
        </span>
      )}
    </span>
  )
}

function Mark({ size }: { size: number }) {
  // viewBox 24x24 — three rounded squares, slightly overlapping/offset.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/* yellow — top-left */}
      <rect x="1.5" y="1.5" width="10" height="10" rx="2.6" fill={colors.brandYellow} />
      {/* blue — bottom-left */}
      <rect x="1.5" y="12.5" width="10" height="10" rx="2.6" fill={colors.brandBlue} />
      {/* red — right, vertically centered & overlapping */}
      <rect x="12.5" y="7" width="10" height="10" rx="2.6" fill={colors.brandRed} />
    </svg>
  )
}
