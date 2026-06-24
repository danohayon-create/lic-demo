import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'

type ToastItem = { id: number; message: string; icon?: ReactNode }
type Push = (message: string, icon?: ReactNode) => void

const ToastContext = createContext<Push>(() => {})

/** Non-blocking toast notifications. Triggered via `useToast()`. */
export function useToast(): Push {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback<Push>((message, icon) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, icon }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600)
  }, [])

  const anim = typeof document === 'undefined' || document.visibilityState === 'visible'

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={anim ? { opacity: 0, y: 14, scale: 0.96 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-card-hover"
            >
              <span className="flex h-4 w-4 items-center justify-center text-signal-good">
                {t.icon ?? <Check className="h-4 w-4" />}
              </span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
