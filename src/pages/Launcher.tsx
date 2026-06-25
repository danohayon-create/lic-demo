import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Monitor, Smartphone, UserSquare2, ArrowRight, Play } from 'lucide-react'
import { Logo } from '@/components/ui'
import { PasswordGateModal, usePasswordGate } from '@/components/ui/PasswordGate'

/** Demo home — sober launcher with the logo and two big entry points. */
export function Launcher() {
  const navigate = useNavigate()
  const { unlocked, unlock } = usePasswordGate()
  const [pending, setPending] = useState<string | null>(null)

  function handleEntry(path: string) {
    if (unlocked) {
      navigate(path)
    } else {
      setPending(path)
    }
  }

  function handleSuccess() {
    unlock()
    if (pending) navigate(pending)
    setPending(null)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      {pending && (
        <PasswordGateModal
          onSuccess={handleSuccess}
          onClose={() => setPending(null)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo size={40} />
          <span className="tech-label mt-8">Investor demo · 2026</span>
          <h1 className="mt-3 max-w-xl text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            The performance layer of global casting
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Choose a surface to explore the demo. Everything is navigable with realistic
            sample data.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <EntryCard
            icon={<Monitor className="h-5 w-5" />}
            tag="Web · desktop"
            title="Production side"
            desc="Dashboard, talent search, self-tape review & casting console."
            onClick={() => handleEntry('/studio')}
          />
          <EntryCard
            icon={<Smartphone className="h-5 w-5" />}
            tag="Mobile · app"
            title="Talent mobile app"
            desc="Casting calls, self-tape recording, auditions & feed."
            onClick={() => handleEntry('/app')}
          />
          <EntryCard
            icon={<UserSquare2 className="h-5 w-5" />}
            tag="Web · desktop"
            title="Talent space"
            desc="Casting calls, auditions, messages, notifications & LinkedIn-style profile."
            onClick={() => handleEntry('/talent')}
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/pitch"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline"
          >
            <Play className="h-4 w-4" />
            View pitch
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

function EntryCard({
  icon,
  tag,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode
  tag: string
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group flex flex-col items-start gap-4 rounded-card border border-line bg-card p-6 text-left shadow-card transition-shadow hover:shadow-card-hover"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-paper text-ink">
        {icon}
      </span>
      <div>
        <span className="tech-label">{tag}</span>
        <h2 className="mt-1.5 text-lg font-bold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-ink">
        Open
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </motion.button>
  )
}
