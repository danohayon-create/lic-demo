import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Crop, ChevronRight, Check, Send, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToast } from '@/components/Toast'
import { discoverCastingsById, sidesById, type SideLine } from '@/data'

const RATIOS: { label: string; value: string }[] = [
  { label: '16:9', value: '16 / 9' },
  { label: '4:5', value: '4 / 5' },
  { label: '3:2', value: '3 / 2' },
  { label: '1:1', value: '1 / 1' },
]

const pad = (n: number) => String(n).padStart(2, '0')

export function SelfTape() {
  const { id = 'evermore' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const casting = discoverCastingsById[id] ?? discoverCastingsById['evermore']
  const sides = sidesById['sides-fanny-brice']

  const videoRef = useRef<HTMLVideoElement>(null)
  const [camError, setCamError] = useState(false)
  const [ratio, setRatio] = useState('1 / 1') // 1:1 default
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)

  // Try the real webcam; fall back to a looping portrait clip on denial/error.
  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => setCamError(true))
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // Recording chrono.
  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [recording])

  const toggleRec = () => {
    if (recording) {
      setRecording(false)
      setDone(true)
    } else {
      setElapsed(0)
      setRecording(true)
    }
  }

  const min = Math.floor(elapsed / 60)
  const sec = elapsed % 60
  const timecode = `00:${pad(min)}:${pad(sec)}`

  return (
    <div className="relative flex min-h-full flex-col bg-ink text-white">
      {/* header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-11">
        <button
          onClick={() => navigate(casting.hasDetail ? `/app/casting/${casting.id}` : '/app')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="text-sm font-bold tracking-wide">{casting.title.toUpperCase()}</div>
          <div className="text-[11px] text-white/60">Take 3/4</div>
        </div>
        <div className="h-9 w-9" />
      </div>

      {/* camera */}
      <div className="flex flex-1 items-center justify-center px-3">
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-black"
          style={{ aspectRatio: ratio }}
        >
          {camError ? (
            <video
              src="/media/selftape.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full -scale-x-100 object-cover"
            />
          )}

          {/* framing grid (rule of thirds, gold) */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-gold/40" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-gold/40" />
            <div className="absolute left-0 top-1/3 h-px w-full bg-gold/40" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-gold/40" />
            {/* corner brackets */}
            {['left-2 top-2 border-l-2 border-t-2', 'right-2 top-2 border-r-2 border-t-2', 'left-2 bottom-2 border-l-2 border-b-2', 'right-2 bottom-2 border-r-2 border-b-2'].map(
              (c) => (
                <span key={c} className={cn('absolute h-5 w-5 border-gold/80', c)} />
              ),
            )}
          </div>

          {/* overlays */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {recording && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-xs font-bold">
                <span className="h-2 w-2 animate-pulse rounded-full bg-signal-no" />
                REC
              </span>
            )}
            <span className="rounded-full bg-black/55 px-2 py-1 font-mono text-xs">{timecode}</span>
          </div>
          <span className="absolute right-3 top-3 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
            HD
          </span>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 text-[11px]">
            {['Framing', 'Audio', 'Light cool'].map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-white/90"
              >
                <Check className="h-3 w-3 text-signal-good" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ratio selector */}
      <div className="flex justify-center gap-2 px-4 py-3">
        {RATIOS.map((r) => (
          <button
            key={r.label}
            onClick={() => setRatio(r.value)}
            className={cn(
              'rounded-full px-3 py-1 font-mono text-xs font-semibold transition-colors',
              ratio === r.value ? 'bg-white text-ink' : 'bg-white/10 text-white/70',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* teleprompter */}
      <Teleprompter lines={sides.lines} recording={recording} />

      {/* controls */}
      <div className="flex items-center justify-between px-8 pb-8 pt-4">
        <button
          onClick={() => toast('Reframe — bientôt disponible')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80"
        >
          <Crop className="h-5 w-5" />
        </button>
        <button
          onClick={toggleRec}
          className="flex h-18 w-18 items-center justify-center rounded-full ring-4 ring-white/30"
          style={{ height: 72, width: 72 }}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          <span
            className={cn(
              'bg-signal-no transition-all',
              recording ? 'h-6 w-6 rounded-md' : 'h-14 w-14 rounded-full',
            )}
          />
        </button>
        <button
          onClick={() => toast('Next take')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* confirmation */}
      {done && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-ink/92 px-8 text-center backdrop-blur">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-signal-good text-white">
            <Check className="h-8 w-8" />
          </span>
          <div>
            <h2 className="text-xl font-bold">Audition enregistrée</h2>
            <p className="mt-1 text-sm text-white/70">
              {casting.title} · {casting.roleName} · {timecode}
            </p>
          </div>
          <button
            onClick={() => {
              toast('Audition envoyée')
              navigate('/app/auditions')
            }}
            className="flex w-full max-w-[240px] items-center justify-center gap-2 rounded-btn bg-cream py-3 text-sm font-bold text-ink"
          >
            <Send className="h-4 w-4" />
            Envoyer
          </button>
          <button
            onClick={() => {
              setDone(false)
              setElapsed(0)
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Refaire la prise
          </button>
        </div>
      )}
    </div>
  )
}

function Teleprompter({ lines, recording }: { lines: SideLine[]; recording: boolean }) {
  const [seg, setSeg] = useState(1)
  useEffect(() => {
    if (!recording) {
      setSeg(1)
      return
    }
    const t = setInterval(() => setSeg((s) => (s < 7 ? s + 1 : s)), 1800)
    return () => clearInterval(t)
  }, [recording])

  return (
    <div className="mx-4 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-label text-white/50">
          Scene · Sides
        </span>
        <span className="font-mono text-[10px] text-white/50">{seg}/7</span>
      </div>
      <div className="max-h-20 overflow-hidden">
        <div
          className="transition-transform duration-700"
          style={{ transform: `translateY(-${(seg - 1) * 6}px)` }}
        >
          {lines.map((l, i) => (
            <p
              key={i}
              className={cn(
                'text-sm leading-relaxed',
                l.kind === 'heading' ? 'font-semibold text-white/50' : 'text-white/90',
              )}
            >
              {l.character ? <span className="font-semibold text-gold">{l.character}: </span> : null}
              {l.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
