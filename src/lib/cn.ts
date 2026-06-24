/**
 * Tiny className combiner — joins truthy class fragments with a space.
 * Kept dependency-free on purpose (no clsx/tailwind-merge) for the demo.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
