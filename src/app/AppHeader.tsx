import { Bell, Search } from 'lucide-react'
import { Logo } from '@/components/ui'
import { useToast } from '@/components/Toast'

/** Compact in-phone header: logo + optional search + notification bell. */
export function AppHeader({ showSearch = false }: { showSearch?: boolean }) {
  const toast = useToast()
  return (
    <header className="mb-4 flex items-center gap-3">
      <Logo size={20} />
      {showSearch && (
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            placeholder="Search roles…"
            className="h-8 w-full rounded-full border border-line bg-card pl-8 pr-3 text-xs text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      )}
      <button
        onClick={() => toast('1 audition needs your attention')}
        className="relative ml-auto flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal-no" />
      </button>
    </header>
  )
}
