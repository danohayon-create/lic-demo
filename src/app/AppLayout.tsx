import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Clapperboard, Zap, Film, User, ArrowLeft } from 'lucide-react'
import { PhoneFrame } from '@/components/PhoneFrame'
import { PageTransition } from '@/components/PageTransition'
import { Logo } from '@/components/ui'
import { cn } from '@/lib/cn'

const tabs = [
  { to: '/app', label: 'Casting calls', icon: Clapperboard, end: true },
  { to: '/app/selftape/evermore', label: 'Snap apply', icon: Zap, premium: true },
  { to: '/app/auditions', label: 'Auditions', icon: Film },
  { to: '/app/profile', label: 'Profile', icon: User },
]

/**
 * Talent app shell — renders the mobile app inside an iPhone frame, centered on
 * a neutral background. Self-tape is full-bleed (dark, no tab bar); casting
 * detail is a pushed view (no tab bar). Everything else shows the tab bar.
 */
export function AppLayout() {
  const { pathname } = useLocation()
  const fullBleed = pathname.startsWith('/app/selftape')
  const showTab = !fullBleed && !pathname.startsWith('/app/casting')

  return (
    <div className="flex min-h-screen flex-col items-center bg-paper py-8">
      {/* top bar (outside the phone) */}
      <div className="mb-6 flex w-full max-w-[420px] items-center justify-between px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Demo home
        </Link>
        <Logo size={22} />
      </div>

      <PhoneFrame>
        <AnimatePresence mode="wait">
          <PageTransition key={pathname} className="min-h-full">
            {fullBleed ? (
              <Outlet />
            ) : (
              <div className={cn('min-h-full px-4 pt-12', showTab ? 'pb-28' : 'pb-6')}>
                <Outlet />
              </div>
            )}
          </PageTransition>
        </AnimatePresence>

        {showTab && (
          <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-2 pb-5 pt-2 backdrop-blur">
            <div className="flex items-stretch justify-between">
              {tabs.map(({ to, label, icon: Icon, end, premium }) => {
                const prefix = to.split('/').slice(0, 3).join('/')
                const active = end ? pathname === to : pathname.startsWith(prefix)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={cn(
                      'flex flex-1 flex-col items-center gap-1 rounded-btn py-1.5 text-[10px] font-medium transition-colors',
                      active ? 'text-ink' : 'text-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                        premium
                          ? 'bg-cream text-ink'
                          : active
                            ? 'bg-ink text-white'
                            : 'bg-transparent text-muted',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    {label}
                  </NavLink>
                )
              })}
            </div>
          </nav>
        )}
      </PhoneFrame>
    </div>
  )
}
