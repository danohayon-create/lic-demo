import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import { cn } from '@/lib/cn'
import { asset } from '@/lib/asset'

const TIPS = [
  { image: '/snapapply/tip1.png', text: "Don't procrastinate. Submitting on time matters more than perfection." },
  { image: '/snapapply/tip2.png', text: 'Stabilize your camera. Use a tripod or stack books for a steady, professional shot.' },
  { image: '/snapapply/tip3.png', text: 'Light your face. Avoid backlighting; use a ring light for clear, shadow-free illumination.' },
  { image: '/snapapply/tip4.png', text: 'Choose the right framing. Use a chest-up shot to showcase your body language and silhouette.' },
  { image: '/snapapply/tip5.png', text: 'Manage your environment. Keep the focus on your performance, not your background.' },
  { image: '/snapapply/tip6.png', text: "Prioritize audio. Use your phone's internal mic and minimize lag with remote readers." },
  { image: '/snapapply/tip7.png', text: 'Prepare a "take-off". Start with a moment of silence to set your character and focus.' },
  { image: '/snapapply/tip8.png', text: 'Deliver a powerful performance. Engage your whole body to convey emotion beyond just your voice.' },
  { image: '/snapapply/tip9.png', text: 'Prepare a "landing". End with a clear, intentional moment before cutting the video.' },
  { image: '/snapapply/tip10.png', text: 'Stay professional. Let your video speak for itself without overloading the team with messages.' },
]

const SWIPE_THRESHOLD = 60
const SWIPE_VELOCITY = 500

export function SnapApplyTips() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0..9 = tips, 10 = ready screen
  const [dir, setDir] = useState<1 | -1>(1)

  const total = TIPS.length
  const isReady = step === total

  const go = (delta: 1 | -1) => {
    setStep((s) => {
      const next = Math.min(Math.max(s + delta, 0), total)
      if (next !== s) setDir(delta)
      return next
    })
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY) go(1)
    else if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY) go(-1)
  }

  // requestAnimationFrame is throttled/paused on a hidden tab, which can freeze
  // AnimatePresence mid-exit (mode="wait" never sees the exit finish). Skip the
  // transition entirely when the tab isn't visible so step changes still apply.
  const anim = typeof document === 'undefined' || document.visibilityState === 'visible'

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-ink text-white">
      {/* header: close + story progress */}
      <div className="flex flex-col gap-3 px-4 pb-2 pt-11">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-label text-white/60">Snap Apply Tips</span>
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-1">
          {TIPS.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <span className={cn('block h-full rounded-full bg-cream', i <= step ? 'w-full' : 'w-0')} />
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!isReady ? (
          <motion.div
            key={step}
            initial={anim ? { opacity: 0, x: dir > 0 ? 60 : -60 } : false}
            animate={{ opacity: 1, x: 0 }}
            exit={anim ? { opacity: 0, x: dir > 0 ? -60 : 60 } : undefined}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-4"
          >
            <span className="font-mono text-xs font-semibold text-white/50">TIP {step + 1}/{total}</span>
            <div className="w-full overflow-hidden rounded-2xl bg-white">
              <img src={asset(TIPS[step].image)} alt={`Snap Apply Tip ${step + 1}`} className="aspect-square w-full select-none object-contain" draggable={false} />
            </div>
            <p className="text-center text-base leading-relaxed text-white/90">{TIPS[step].text}</p>
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={anim ? { opacity: 0, x: 60 } : false}
            animate={{ opacity: 1, x: 0 }}
            exit={anim ? { opacity: 0 } : undefined}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream text-ink">
              <Camera className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-xl font-bold">You're all set</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Take a breath, get into character, and hit the button below when you're ready to record.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/selftape/evermore', { replace: true })}
              className="flex w-full max-w-[260px] items-center justify-center gap-2 rounded-btn bg-cream py-3.5 text-sm font-bold text-ink"
            >
              <Camera className="h-4 w-4" />
              Start self-tape
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isReady && (
        <div className="flex items-center justify-between px-4 pb-8">
          <button
            onClick={() => go(-1)}
            disabled={step === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 disabled:opacity-30"
            aria-label="Previous tip"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80"
            aria-label="Next tip"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
