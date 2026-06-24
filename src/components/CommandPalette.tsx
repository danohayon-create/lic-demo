import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, CornerDownLeft, Film, Clapperboard, UserRound } from 'lucide-react'
import { talents, projects } from '@/data'
import { cn } from '@/lib/cn'

type Result = {
  id: string
  label: string
  sub: string
  kind: 'Talent' | 'Project'
  to: string
}

const results: Result[] = [
  ...talents.map((t) => ({
    id: t.id,
    label: t.name,
    sub: `Talent · ${t.city}`,
    kind: 'Talent' as const,
    to: '/studio/review',
  })),
  ...projects.map((p) => ({
    id: p.id,
    label: p.title,
    sub: `Project · ${p.type} · ${p.company}`,
    kind: 'Project' as const,
    to: '/studio/dashboard',
  })),
]

/** Open the command palette imperatively (e.g. from a search button). */
export const openCommandPalette = () => window.dispatchEvent(new Event('lic:open-search'))

/** Global ⌘K search palette with fake, clickable results. */
export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('lic:open-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('lic:open-search', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? results.filter((r) => r.label.toLowerCase().includes(q)) : results
    return list.slice(0, 7)
  }, [query])

  const choose = (r: Result) => {
    setOpen(false)
    navigate(r.to)
  }

  // Skip entrance animation when the tab is backgrounded (throttled rAF would
  // otherwise leave the overlay stuck at opacity 0).
  const anim = typeof document === 'undefined' || document.visibilityState === 'visible'

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && filtered[active]) {
      choose(filtered[active])
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm"
          initial={anim ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={anim ? { opacity: 0, y: -8, scale: 0.98 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-card border border-line bg-card shadow-card-hover"
          >
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onInputKey}
                placeholder="Search talent, project, role…"
                className="h-12 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              />
              <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-muted">
                ESC
              </kbd>
            </div>

            <ul className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">No results.</li>
              )}
              {filtered.map((r, i) => (
                <li key={`${r.kind}-${r.id}`}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(r)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-left',
                      i === active ? 'bg-paper' : 'hover:bg-paper/60',
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-muted ring-1 ring-line">
                      {r.kind === 'Talent' ? (
                        <UserRound className="h-4 w-4" />
                      ) : r.sub.includes('Music') ? (
                        <Film className="h-4 w-4" />
                      ) : (
                        <Clapperboard className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{r.label}</span>
                      <span className="block truncate text-xs text-muted">{r.sub}</span>
                    </span>
                    {i === active && <CornerDownLeft className="h-4 w-4 text-muted" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
