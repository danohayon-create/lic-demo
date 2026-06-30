import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Crop, ChevronRight, Check, Send, RotateCcw, Zap, BookOpen, Mic, PersonStanding, ListChecks, Pause, Play, ShieldCheck, Loader } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToast } from '@/components/Toast'
import { discoverCastingsById, sidesById, type SideLine } from '@/data'
import { asset } from '@/lib/asset'
import { Logo } from '@/components/ui'

// ── Self-tape types ──────────────────────────────────────────────────────────

const TAPE_TYPES = [
  {
    id: 'structured',
    label: 'Structured audition',
    desc: '4 guided segments · recommended for reality TV',
    icon: ListChecks,
    color: 'bg-link/10 text-link',
  },
  {
    id: 'scene',
    label: 'Scene with script',
    desc: 'Perform the script provided by the production',
    icon: BookOpen,
    color: 'bg-gold/15 text-[#8A6D00]',
  },
  {
    id: 'monologue',
    label: 'Monologue',
    desc: 'Text of your choice, 1 to 2 minutes',
    icon: Mic,
    color: 'bg-blue-50 text-blue-700',
  },
  {
    id: 'improv',
    label: 'Improvisation',
    desc: 'Free reaction to a given situation',
    icon: Zap,
    color: 'bg-signal-good/15 text-signal-good',
  },
  {
    id: 'fullbody',
    label: 'Full body shot',
    desc: 'Silhouette + movement, no dialogue',
    icon: PersonStanding,
    color: 'bg-ink/8 text-ink',
  },
]

// ── 4-segment structure for reality TV ──────────────────────────────────────

const SEGMENTS = [
  { label: 'Who are you?', duration: 30, hint: 'Speak directly to camera · no editing · reveal your personality' },
  { label: 'Structured challenge', duration: 45, hint: 'Tell the most unbelievable true story from your life' },
  { label: 'Improvisation', duration: 60, hint: 'You just won something you never expected · react now' },
  { label: 'Wild card', duration: 30, hint: 'Anything you want · surprise us' },
]

const SEGMENT_COLORS = [
  'bg-link text-white',
  'bg-gold text-ink',
  'bg-signal-good text-white',
  'bg-signal-no text-white',
]

function getSegment(elapsed: number): { index: number; remaining: number } {
  const boundaries = [0, 30, 75, 135, 165]
  for (let i = 0; i < 4; i++) {
    if (elapsed < boundaries[i + 1]) {
      return { index: i, remaining: boundaries[i + 1] - elapsed }
    }
  }
  return { index: 3, remaining: 0 }
}

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
  const casting = discoverCastingsById[id] ?? discoverCastingsById['evermore']

  const [tapeType, setTapeType] = useState<string | null>(null)
  const [showSegmentGuide, setShowSegmentGuide] = useState(false)

  if (!tapeType) {
    return (
      <TypeSelection
        castingTitle={casting.title}
        roleName={casting.roleName}
        onSelect={(t) => {
          setTapeType(t)
          if (t === 'structured') setShowSegmentGuide(true)
        }}
        onBack={() => navigate(casting.hasDetail ? `/app/casting/${casting.id}` : '/app')}
      />
    )
  }

  if (showSegmentGuide) {
    return (
      <SegmentGuide
        onStart={() => setShowSegmentGuide(false)}
        onBack={() => { setTapeType(null); setShowSegmentGuide(false) }}
      />
    )
  }

  return <Camera id={id} tapeType={tapeType} />
}

// ── Type selection screen ────────────────────────────────────────────────────

function TypeSelection({
  castingTitle,
  roleName,
  onSelect,
  onBack,
}: {
  castingTitle: string
  roleName: string
  onSelect: (type: string) => void
  onBack: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-ink text-white">
      {/* header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-11">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="text-sm font-bold tracking-wide">{castingTitle.toUpperCase()}</div>
          <div className="text-[11px] text-white/60">{roleName}</div>
        </div>
        <div className="h-9 w-9" />
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 pb-8">
        <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Self-tape
        </p>
        <h2 className="mb-6 text-center text-xl font-bold">
          What type of recording?
        </h2>

        <div className="flex flex-col gap-3">
          {TAPE_TYPES.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="flex items-center gap-4 rounded-2xl bg-white/8 px-4 py-4 text-left transition-colors hover:bg-white/14 active:scale-[0.99]"
              >
                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', t.color)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white">{t.label}</p>
                  <p className="text-xs text-white/50">{t.desc}</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/30" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Segment guide ────────────────────────────────────────────────────────────

function SegmentGuide({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const totalDuration = SEGMENTS.reduce((s, seg) => s + seg.duration, 0)
  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex items-center justify-between px-4 pb-3 pt-11">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold tracking-wide">STRUCTURED AUDITION</span>
        <div className="h-9 w-9" />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-8">
        <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-white/40">
          4 segments · {totalDuration}s total
        </p>
        <h2 className="mb-6 text-center text-xl font-bold">Your audition structure</h2>

        <div className="flex flex-col gap-3">
          {SEGMENTS.map((seg, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl bg-white/8 px-4 py-3.5">
              <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', SEGMENT_COLORS[i])}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{seg.label}</p>
                  <span className="ml-2 shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/60">
                    {seg.duration}s
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/50">{seg.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* segment timeline */}
        <div className="mt-5 flex h-2 overflow-hidden rounded-full">
          {SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className={cn('h-full', SEGMENT_COLORS[i].split(' ')[0])}
              style={{ width: `${(seg.duration / totalDuration) * 100}%` }}
            />
          ))}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-white/40">
          The app will guide you through each segment automatically
        </p>

        <button
          onClick={onStart}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-btn bg-cream py-3.5 text-sm font-bold text-ink"
        >
          Start recording
        </button>
      </div>
    </div>
  )
}

// ── Camera screen ────────────────────────────────────────────────────────────

// Segment start times in seconds
const SEG_STARTS = [0, 30, 75, 135]

function Camera({ id, tapeType }: { id: string; tapeType: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const casting = discoverCastingsById[id] ?? discoverCastingsById['evermore']
  const sides = sidesById['sides-fanny-brice']

  const videoRef = useRef<HTMLVideoElement>(null)
  const [camError, setCamError] = useState(false)
  const [ratio, setRatio] = useState('1 / 1')
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  // null = not done; 'checking' = AI verification; 'done' = ready to send
  const [phase, setPhase] = useState<null | 'checking' | 'done'>(null)
  const [aiChecks, setAiChecks] = useState<string[]>([])

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => setCamError(true))
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  useEffect(() => {
    if (!recording || paused) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [recording, paused])

  // AI verification sequence
  useEffect(() => {
    if (phase !== 'checking') return
    const checks = [
      'Analysing facial micro-expressions…',
      'Checking for deepfake artefacts…',
      'Verifying real-time capture metadata…',
      'Scanning for AI-generated synthesis…',
    ]
    let i = 0
    const t = setInterval(() => {
      i++
      setAiChecks(checks.slice(0, i))
      if (i >= checks.length) {
        clearInterval(t)
        setTimeout(() => setPhase('done'), 600)
      }
    }, 700)
    return () => clearInterval(t)
  }, [phase])

  const startRec = () => { setElapsed(0); setRecording(true); setPaused(false) }
  const pauseRec = () => setPaused((v) => !v)
  const stopRec = () => { setRecording(false); setPaused(false); setPhase('checking'); setAiChecks([]) }
  const jumpToSegment = (i: number) => { setElapsed(SEG_STARTS[i]); if (!recording) setRecording(true); setPaused(false) }
  const retake = () => { setPhase(null); setElapsed(0); setRecording(false); setPaused(false) }

  const min = Math.floor(elapsed / 60)
  const sec = elapsed % 60
  const timecode = `00:${pad(min)}:${pad(sec)}`
  const typeLabel = TAPE_TYPES.find((t) => t.id === tapeType)?.label ?? ''

  const isStructured = tapeType === 'structured'
  const { index: segIdx, remaining: segRemaining } = getSegment(elapsed)
  const currentSeg = SEGMENTS[segIdx]
  const totalDuration = SEGMENTS.reduce((s, seg) => s + seg.duration, 0)

  return (
    <div className="flex h-full flex-col bg-ink text-white">
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
          <div className="text-[11px] text-white/60">{typeLabel}</div>
        </div>
        <div className="h-9 w-9" />
      </div>

      {/* camera viewfinder */}
      <div className="flex flex-1 items-center justify-center px-3">
        <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: ratio }}>
          {camError ? (
            <video src={asset('/media/selftape.mp4')} autoPlay loop muted playsInline className="h-full w-full object-cover" />
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
          )}

          {/* rule-of-thirds grid */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-gold/40" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-gold/40" />
            <div className="absolute left-0 top-1/3 h-px w-full bg-gold/40" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-gold/40" />
            {['left-2 top-2 border-l-2 border-t-2', 'right-2 top-2 border-r-2 border-t-2', 'left-2 bottom-2 border-l-2 border-b-2', 'right-2 bottom-2 border-r-2 border-b-2'].map((c) => (
              <span key={c} className={cn('absolute h-5 w-5 border-gold/80', c)} />
            ))}
          </div>

          {/* LIC watermark */}
          <div className="pointer-events-none absolute bottom-10 right-3 flex items-center gap-1 opacity-50">
            <Logo markOnly size={14} />
            <span className="font-mono text-[9px] font-bold tracking-widest text-white">LET IT CAST</span>
          </div>

          {/* top-left: rec indicator + timecode */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {recording && !paused && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-xs font-bold">
                <span className="h-2 w-2 animate-pulse rounded-full bg-signal-no" />
                REC
              </span>
            )}
            {paused && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-gold">
                <span className="h-2 w-2 rounded-full bg-gold" />
                PAUSE
              </span>
            )}
            <span className="rounded-full bg-black/60 px-2 py-1 font-mono text-xs">{timecode}</span>
          </div>
          <span className="absolute right-3 top-3 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold">HD</span>

          {/* structured segment overlay while recording */}
          {isStructured && recording && (
            <div className="absolute inset-x-3 top-10 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur">
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold', SEGMENT_COLORS[segIdx])}>
                  {segIdx + 1}
                </span>
                <span className="text-xs font-semibold text-white">{currentSeg.label}</span>
                {!paused && <span className="font-mono text-[10px] text-white/60">{segRemaining}s</span>}
              </div>
            </div>
          )}

          {/* quality badges */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 text-[11px]">
            {['Framing', 'Audio', 'Light cool'].map((c) => (
              <span key={c} className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-white/90">
                <Check className="h-3 w-3 text-signal-good" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ratio selector */}
      <div className="flex justify-center gap-2 px-4 py-2">
        {RATIOS.map((r) => (
          <button
            key={r.label}
            onClick={() => setRatio(r.value)}
            className={cn('rounded-full px-3 py-1 font-mono text-xs font-semibold transition-colors',
              ratio === r.value ? 'bg-white text-ink' : 'bg-white/10 text-white/70')}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* structured segment navigator (always visible for structured) */}
      {isStructured && (
        <div className="mx-4 mb-1 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-label text-white/50">Structured audition</span>
            <span className="font-mono text-[10px] text-white/50">4 segments · {totalDuration}s</span>
          </div>
          <div className="flex gap-1.5">
            {SEGMENTS.map((seg, i) => {
              const isActive = recording && segIdx === i
              const isDone = recording && i < segIdx
              return (
                <button
                  key={i}
                  onClick={() => jumpToSegment(i)}
                  className={cn('flex flex-1 flex-col gap-0.5 rounded-lg p-1 transition-colors',
                    isActive ? 'bg-white/10 ring-1 ring-white/30' : 'hover:bg-white/8')}
                  title={`Jump to segment ${i + 1}: ${seg.label}`}
                >
                  <div className={cn('h-1.5 w-full rounded-full transition-opacity',
                    SEGMENT_COLORS[i].split(' ')[0],
                    isDone ? 'opacity-40' : 'opacity-100')} />
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[9px] font-semibold truncate',
                      isActive ? 'text-white' : isDone ? 'text-white/30' : 'text-white/50')}>
                      {i + 1}. {seg.label}
                    </span>
                    {isDone && <Check className="h-2.5 w-2.5 shrink-0 text-white/30" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* teleprompter — scene type only */}
      {tapeType === 'scene' && <Teleprompter lines={sides.lines} recording={recording && !paused} />}

      {/* controls */}
      <div className="flex items-center justify-between px-8 pb-10 pt-3">
        {/* left: reframe or pause */}
        {recording ? (
          <button
            onClick={pauseRec}
            className={cn('flex h-11 w-11 items-center justify-center rounded-full transition-colors',
              paused ? 'bg-gold text-ink' : 'bg-white/10 text-white/80')}
            aria-label={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5" />}
          </button>
        ) : (
          <button
            onClick={() => toast('Reframe — coming soon')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80"
          >
            <Crop className="h-5 w-5" />
          </button>
        )}

        {/* center: record / stop */}
        {!recording ? (
          <button
            onClick={startRec}
            className="flex items-center justify-center rounded-full ring-4 ring-white/30"
            style={{ height: 72, width: 72 }}
            aria-label="Start recording"
          >
            <span className="h-14 w-14 rounded-full bg-signal-no transition-all" />
          </button>
        ) : (
          <button
            onClick={stopRec}
            className="flex items-center justify-center rounded-full ring-4 ring-signal-no/40"
            style={{ height: 72, width: 72 }}
            aria-label="Stop recording"
          >
            <span className="h-7 w-7 rounded-md bg-signal-no transition-all" />
          </button>
        )}

        {/* right: next segment or placeholder */}
        <button
          onClick={() => isStructured ? jumpToSegment(Math.min(segIdx + 1, 3)) : toast('Next take')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80"
          title={isStructured ? 'Next segment' : 'Next take'}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* AI verification overlay */}
      {phase === 'checking' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-ink px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Loader className="h-8 w-8 animate-spin text-link" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Authenticity check</h2>
            <p className="mt-1 text-xs text-white/50">Let it Cast verifies every submission is human and real-time</p>
          </div>
          <div className="w-full max-w-xs rounded-2xl bg-white/6 p-4 text-left">
            {[
              'Analysing facial micro-expressions…',
              'Checking for deepfake artefacts…',
              'Verifying real-time capture metadata…',
              'Scanning for AI-generated synthesis…',
            ].map((line, i) => {
              const done = aiChecks.length > i
              return (
                <div key={i} className={cn('flex items-center gap-2 py-1.5 text-xs transition-opacity', done ? 'opacity-100' : 'opacity-20')}>
                  {done
                    ? <Check className="h-3.5 w-3.5 shrink-0 text-signal-good" />
                    : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30" />}
                  <span className={done ? 'text-white' : 'text-white/50'}>{line}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* confirmation overlay */}
      {phase === 'done' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-ink px-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-signal-good text-white">
              <ShieldCheck className="h-8 w-8" />
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-signal-good/15 px-3 py-1">
              <Check className="h-3 w-3 text-signal-good" />
              <span className="text-[11px] font-semibold text-signal-good">Let it Cast certified — no AI detected</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Audition recorded</h2>
            <p className="mt-1 text-sm text-white/70">
              {casting.title} · {casting.roleName} · {timecode}
            </p>
            {isStructured && (
              <p className="mt-1 text-xs text-white/50">4 segments · AI scene analysis ready in ~2 min</p>
            )}
          </div>
          <button
            onClick={() => { toast('Audition sent'); navigate('/app/auditions') }}
            className="flex w-full max-w-[240px] items-center justify-center gap-2 rounded-btn bg-cream py-3 text-sm font-bold text-ink"
          >
            <Send className="h-4 w-4" />
            Send audition
          </button>
          <button
            onClick={retake}
            className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Retake
          </button>
        </div>
      )}
    </div>
  )
}

// ── Teleprompter ─────────────────────────────────────────────────────────────

function Teleprompter({ lines, recording }: { lines: SideLine[]; recording: boolean }) {
  const [seg, setSeg] = useState(1)
  useEffect(() => {
    if (!recording) { setSeg(1); return }
    const t = setInterval(() => setSeg((s) => (s < 7 ? s + 1 : s)), 1800)
    return () => clearInterval(t)
  }, [recording])

  return (
    <div className="mx-4 mb-1 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-label text-white/50">Script · Sides</span>
        <span className="font-mono text-[10px] text-white/50">{seg}/7</span>
      </div>
      <div className="max-h-16 overflow-hidden">
        <div className="transition-transform duration-700" style={{ transform: `translateY(-${(seg - 1) * 6}px)` }}>
          {lines.map((l, i) => (
            <p key={i} className={cn('text-xs leading-relaxed', l.kind === 'heading' ? 'font-semibold text-white/50' : 'text-white/90')}>
              {l.character ? <span className="font-semibold text-gold">{l.character}: </span> : null}
              {l.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
