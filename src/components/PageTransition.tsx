import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/**
 * Per-route enter/exit transition. Wrap an Outlet's content keyed by pathname
 * inside an <AnimatePresence mode="wait">.
 *
 * Guard: if the document isn't visible at mount (e.g. a backgrounded tab where
 * requestAnimationFrame is throttled), we skip the entrance so content never
 * gets stuck at opacity 0. Real, foreground users always see the animation.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const visible = typeof document === 'undefined' || document.visibilityState === 'visible'
  return (
    <motion.div
      className={className}
      initial={visible ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
