import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useInView } from 'framer-motion'
import {
  Lock,
  ListOrdered,
  Gauge,
  Sparkles,
  Ruler,
  TrendingUp,
  Monitor,
  Smartphone,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { Logo } from '@/components/ui'
import { cn } from '@/lib/cn'

const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible'

export function Pitch() {
  const { scrollYProgress } = useScroll()

  return (
    <div className="relative bg-paper">
      {/* scroll progress */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gold"
      />

      {/* fixed chrome */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4">
        <Logo size={22} />
        <Link
          to="/"
          className="rounded-full border border-line bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted backdrop-blur transition-colors hover:text-ink"
        >
          Skip intro
        </Link>
      </div>

      <Hero />
      <Problem />
      <Fix />
      <Impact />
      <FinalCTA />
    </div>
  )
}

/* ── Section scaffold ─────────────────────────────────────────────────────── */

function Section({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'relative flex min-h-screen flex-col items-center justify-center px-6 py-24',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </section>
  )
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={isVisible() ? { opacity: 0, y: 24 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="tech-label mb-4 block">{children}</span>
}

/* ── 1. Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <Section>
      <div className="flex flex-col items-center text-center">
        <Reveal>
          <Logo size={40} />
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-10 text-balance text-5xl font-bold tracking-tight text-ink sm:text-6xl">
            The global standard for casting.
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Brief once. Receive continuously. Review at scale. Decide together. Keep the memory.
          </p>
        </Reveal>
      </div>

      <motion.div
        initial={isVisible() ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1 text-muted"
        >
          <span className="text-xs font-medium uppercase tracking-label">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </Section>
  )
}

/* ── 2. The Problem ───────────────────────────────────────────────────────── */

function Problem() {
  const bullets = [
    { icon: Lock, title: 'Access restricted', desc: 'Opportunities live behind agents and inboxes.' },
    { icon: ListOrdered, title: 'Manual & sequential', desc: 'Tapes reviewed one by one, when there’s time.' },
    { icon: Gauge, title: 'Constrained by human bandwidth', desc: 'Most submissions are simply never seen.' },
  ]
  return (
    <Section className="bg-paper">
      <Reveal>
        <Eyebrow>The problem</Eyebrow>
        <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Traditional casting is a gated system. The best talent is often never seen.
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {bullets.map((b, i) => (
          <Reveal key={b.title} delay={0.1 * i}>
            <div className="flex h-full flex-col gap-3 rounded-card border border-line bg-card p-6 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-btn bg-paper text-signal-no">
                <b.icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-ink">{b.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{b.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ── 3. The Fix ───────────────────────────────────────────────────────────── */

function Fix() {
  const cols = [
    { icon: Sparkles, title: 'Performance-first', desc: 'A persistent performance profile, built from every audition — not a static résumé.' },
    { icon: Ruler, title: 'Standardized', desc: 'One brief, structured self-tapes, comparable takes. Everyone reads from the same page.' },
    { icon: TrendingUp, title: 'Scalable', desc: 'Review thousands of submissions together, ranked by fit — always on, always open.' },
  ]
  return (
    <Section className="bg-ink text-white">
      <Reveal>
        <Eyebrow>The fix</Eyebrow>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A new layer for casting.</h2>
      </Reveal>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {cols.map((c, i) => (
          <Reveal key={c.title} delay={0.12 * i}>
            <div className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-white/10 text-gold">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold">{c.title}</h3>
              <p className="text-sm leading-relaxed text-white/70">{c.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ── 4. The Impact ────────────────────────────────────────────────────────── */

function CountUp({ to, suffix = '', duration = 1.4 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [val, setVal] = useState(() => (isVisible() ? 0 : to))

  useEffect(() => {
    if (!inView) return
    if (!isVisible()) {
      setVal(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  )
}

function Impact() {
  const kpis = [
    { value: <CountUp to={10} suffix="×" />, label: 'auditions processed' },
    {
      value: (
        <span>
          <CountUp to={24} />
          /7
        </span>
      ),
      label: 'submission flow',
    },
    {
      value: <CountUp to={70} suffix="%" />,
      label: 'submissions never reviewed → solved',
    },
  ]
  return (
    <Section>
      <Reveal>
        <Eyebrow>The impact</Eyebrow>
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Built to change the numbers.
        </h2>
      </Reveal>
      <div className="mt-14 grid gap-8 sm:grid-cols-3">
        {kpis.map((k, i) => (
          <Reveal key={i} delay={0.12 * i}>
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="text-6xl font-bold tracking-tight text-ink">{k.value}</div>
              <div className="mt-2 max-w-[14rem] text-sm font-medium text-muted">{k.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ── 5. Final CTA ─────────────────────────────────────────────────────────── */

function FinalCTA() {
  const navigate = useNavigate()
  return (
    <Section>
      <div className="flex flex-col items-center text-center">
        <Reveal>
          <Logo size={32} />
          <h2 className="mt-8 text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            See it in motion.
          </h2>
          <p className="mt-4 max-w-md text-muted">
            Deux surfaces, une seule plateforme. Choisissez par où commencer.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate('/studio')}
            className="group flex flex-1 items-center justify-center gap-2 rounded-btn bg-ink px-6 py-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <Monitor className="h-4 w-4" />
            Lancer la démo Production
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => navigate('/app')}
            className="group flex flex-1 items-center justify-center gap-2 rounded-btn border border-line bg-card px-6 py-4 text-sm font-semibold text-ink transition-colors hover:bg-paper"
          >
            <Smartphone className="h-4 w-4" />
            Lancer la démo Talent
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Reveal>
        <Reveal delay={0.3}>
          <Link to="/" className="mt-8 inline-block text-sm font-medium text-muted hover:text-ink">
            Retour à l’accueil
          </Link>
        </Reveal>
      </div>
    </Section>
  )
}
