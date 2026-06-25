import { useRef, useState } from 'react'
import { Heart, MessageCircle, Share2, Play, Bookmark, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'
import { feedPosts } from '@/data/feed'
import { useToast } from '@/components/Toast'
import type { FeedPost } from '@/data/types'


export function MobileFeed() {
  return (
    <div className="flex flex-col gap-0 divide-y divide-line">
      <div className="px-4 pb-3 pt-2">
        <h1 className="text-base font-bold text-ink">Feed</h1>
        <p className="text-xs text-muted">News & updates from your network</p>
      </div>
      {feedPosts.map((p) => (
        <FeedCard key={p.id} post={p} />
      ))}
    </div>
  )
}

function FeedCard({ post: p }: { post: FeedPost }) {
  const toast = useToast()
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex flex-col gap-3 bg-paper px-4 py-4">
      {/* author row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <AuthorAvatar author={p.author} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-sm font-semibold text-ink leading-tight">{p.author.name}</span>
              {p.author.verified && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-link text-[9px] font-bold text-white">✓</span>
              )}
            </div>
            <p className="text-xs text-muted leading-tight">{p.author.meta}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[10px] text-muted">{p.time}</span>
              {p.badge && (
                <>
                  <span className="text-[10px] text-muted">·</span>
                  <span className="text-[10px] font-medium text-link">{p.badge}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => toast('Options')} className="shrink-0 text-muted">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* text */}
      {p.text && (
        <p className="text-sm leading-relaxed text-ink">
          {p.text}
          {p.hashtags && (
            <span className="text-link"> {p.hashtags.map((h) => `#${h}`).join(' ')}</span>
          )}
        </p>
      )}

      {/* media */}
      {p.video ? (
        <VideoThumb src={p.video} poster={p.image} />
      ) : p.image ? (
        <img src={p.image} alt="" className="w-full rounded-xl object-cover max-h-52" />
      ) : null}

      {/* banner */}
      {p.banner && (
        <div className="flex items-center justify-center rounded-xl bg-ink/8 py-3">
          <span className="font-mono text-xs font-bold tracking-widest text-ink">{p.banner}</span>
        </div>
      )}

      {/* stats + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{(p.likes + (liked ? 1 : 0)).toLocaleString()} likes</span>
          <span>{p.comments} comments</span>
        </div>
        <div className="flex items-center gap-1">
          <ActionBtn
            icon={<Heart className={cn('h-4 w-4', liked && 'fill-signal-no text-signal-no')} />}
            active={liked}
            onClick={() => setLiked((l) => !l)}
          />
          <ActionBtn
            icon={<MessageCircle className="h-4 w-4" />}
            onClick={() => toast('Comments — coming soon')}
          />
          <ActionBtn
            icon={<Share2 className="h-4 w-4" />}
            onClick={() => toast('Lien copié')}
          />
          <ActionBtn
            icon={<Bookmark className={cn('h-4 w-4', saved && 'fill-ink')} />}
            active={saved}
            onClick={() => setSaved((s) => !s)}
          />
        </div>
      </div>
    </div>
  )
}

function AuthorAvatar({ author }: { author: FeedPost['author'] }) {
  if (author.avatar) {
    return (
      <img
        src={author.avatar}
        alt={author.name}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-line"
      />
    )
  }
  const initials = author.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/10 text-xs font-bold text-ink ring-1 ring-line">
      {initials}
    </span>
  )
}

function VideoThumb({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={ref}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="w-full object-cover max-h-52"
        onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && (
        <button
          onClick={() => ref.current?.play()}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
            <Play className="ml-0.5 h-5 w-5" />
          </span>
        </button>
      )}
    </div>
  )
}

function ActionBtn({
  icon,
  active,
  onClick,
}: {
  icon: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
        active ? 'text-signal-no' : 'text-muted hover:text-ink',
      )}
    >
      {icon}
    </button>
  )
}
