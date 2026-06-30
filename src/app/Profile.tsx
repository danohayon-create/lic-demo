import { useRef, useState } from 'react'
import { BadgeCheck, Zap, Play } from 'lucide-react'
import { Card, Avatar, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { AppHeader } from './AppHeader'
import { colors } from '@/styles/tokens'
import { mayaProfile, mayaReel, type PerfColor, type ReelClip } from '@/data'
import { asset } from '@/lib/asset'

const barColor: Record<PerfColor, string> = {
  gold: colors.gold,
  blue: colors.link,
  red: colors.signalNo,
  green: colors.signalGood,
}

export function Profile() {
  const p = mayaProfile
  const toast = useToast()
  return (
    <div className="flex flex-col gap-5">
      <AppHeader />

      {/* identity */}
      <div className="flex flex-col items-center text-center">
        <Avatar src={p.avatar} name={p.name} size="xl" ring />
        <h1 className="mt-3 text-xl font-bold tracking-tight text-ink">{p.name}</h1>
        <p className="text-sm text-muted">
          {p.profession} · {p.city}
        </p>
        <div className="mt-2 flex gap-1.5">
          <Tag>{p.union}</Tag>
          <Tag tone="good" icon={<BadgeCheck className="h-3 w-3" />}>
            Verified
          </Tag>
        </div>
      </div>

      {/* persistent performance profile (memory layer) */}
      <Card flush className="overflow-hidden bg-ink p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-label font-semibold uppercase tracking-label text-white/55">
              Persistent performance profile
            </span>
            <p className="mt-1 text-sm text-white/80">Built from {p.auditions} auditions</p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
            <Zap className="h-4 w-4" />
          </span>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {p.performanceProfile.map((d) => (
            <li key={d.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/85">{d.label}</span>
                <span className="font-semibold">{d.value}</span>
              </div>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${d.value}%`, backgroundColor: barColor[d.color] }}
                />
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCell value={p.auditions} label="Auditions" />
        <StatCell value={p.callbacks} label="Callbacks" />
        <StatCell value={p.bookings} label="Bookings" />
      </div>

      {/* reel */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="tech-label">Reel</span>
          <button onClick={() => toast('Reel — bientôt disponible')} className="text-xs font-medium text-link">
            See all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {mayaReel.map((clip, i) => (
            <ReelTile key={i} clip={clip} />
          ))}
        </div>
      </section>

      {/* info */}
      <Card className="flex flex-col gap-2.5 text-sm">
        <InfoRow label="Height" value={p.height} />
        <InfoRow label="Agency" value={p.agency} />
        <InfoRow label="Contact" value={p.email} link />
      </Card>
    </div>
  )
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <Card className="flex flex-col items-center gap-0.5 py-3">
      <span className="text-2xl font-bold tracking-tight text-ink">{value}</span>
      <span className="text-label font-semibold uppercase tracking-label text-muted">{label}</span>
    </Card>
  )
}

function InfoRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={link ? 'font-medium text-link' : 'font-medium text-ink'}>{value}</span>
    </div>
  )
}

function ReelTile({ clip }: { clip: ReelClip }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const play = () => {
    ref.current?.play()
    setPlaying(true)
  }
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-btn border border-line bg-black">
      <video
        ref={ref}
        src={asset(clip.video)}
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onClick={() => (playing ? ref.current?.pause() : play())}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      {!playing && (
        <button
          onClick={play}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink">
            <Play className="ml-0.5 h-4 w-4" />
          </span>
        </button>
      )}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-white">
        {clip.genre}
      </span>
    </div>
  )
}
