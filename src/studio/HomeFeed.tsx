import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Video,
  Image as ImageIcon,
  FileText,
  Megaphone,
  BadgeCheck,
  Play,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Check,
} from 'lucide-react'
import { Card, Avatar, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import {
  mayaProfile,
  mayaGroups,
  mayaSaved,
  feedPosts,
  feedSidebar,
  type FeedPost,
} from '@/data'

export function HomeFeed() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
      <aside className="hidden lg:block">
        <ProfileCard />
      </aside>

      <section className="flex flex-col gap-4">
        <Composer />
        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      <aside className="hidden lg:block">
        <RightRail />
      </aside>
    </div>
  )
}

/* ── Left column ──────────────────────────────────────────────────────────── */

function ProfileCard() {
  return (
    <div className="sticky top-[88px] flex flex-col gap-4">
      <Card flush className="overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-[#F59E42] to-[#E0483D]" />
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-3">
            <Avatar src={mayaProfile.avatar} name={mayaProfile.name} size="xl" ring />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-ink">{mayaProfile.name}</h3>
          <p className="text-sm text-muted">
            {mayaProfile.profession} · {mayaProfile.city} · {mayaProfile.union}
          </p>
          <p className="mt-0.5 text-xs text-muted">{mayaProfile.agency}</p>

          <div className="mt-4 space-y-2 border-t border-line pt-4">
            <Stat label="Profile views" value={mayaProfile.metrics.profileViews} />
            <Stat label="Audition matches" value={mayaProfile.metrics.auditionMatches} />
            <Stat label="Performance score" value={mayaProfile.metrics.performanceScore} trend />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <span className="tech-label">My groups</span>
        <ul className="flex flex-col gap-2">
          {mayaGroups.map((g) => (
            <li key={g} className="flex items-center gap-2 text-sm text-ink">
              <span className="h-6 w-6 rounded-md bg-paper ring-1 ring-line" />
              {g}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <span className="tech-label">Saved</span>
        <ul className="flex flex-col gap-2 text-sm">
          {mayaSaved.map((s) => (
            <li key={s.label} className="flex items-baseline gap-1.5 text-muted">
              <span className="font-semibold text-ink">{s.count}</span>
              {s.label}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function Stat({ label, value, trend }: { label: string; value: number; trend?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex items-center gap-1 text-sm font-semibold text-ink">
        {value}
        {trend && <TrendingUp className="h-3.5 w-3.5 text-match" />}
      </span>
    </div>
  )
}

/* ── Center column ────────────────────────────────────────────────────────── */

function Composer() {
  const toast = useToast()
  const actions = [
    { label: 'Self-tape', icon: Video, tone: 'text-signal-no' },
    { label: 'Photo', icon: ImageIcon, tone: 'text-match' },
    { label: 'Article', icon: FileText, tone: 'text-link' },
    { label: 'Casting', icon: Megaphone, tone: 'text-[#8A6D00]' },
  ]
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar src={mayaProfile.avatar} name={mayaProfile.name} size="md" />
        <button
          onClick={() => toast('Composer — bientôt disponible')}
          className="h-11 flex-1 rounded-full border border-line bg-paper px-4 text-left text-sm text-muted hover:bg-paper/60"
        >
          Share an update, a self-tape, an audition win…
        </button>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3">
        {actions.map(({ label, icon: Icon, tone }) => (
          <button
            key={label}
            onClick={() => toast(`${label} — bientôt disponible`)}
            className="flex items-center gap-2 rounded-btn px-3 py-1.5 text-sm font-medium text-muted hover:bg-ink/5"
          >
            <Icon className={cn('h-4 w-4', tone)} />
            {label}
          </button>
        ))}
      </div>
    </Card>
  )
}

function PostCard({ post }: { post: FeedPost }) {
  const navigate = useNavigate()
  const [likes, setLikes] = useState(post.likes)
  const [liked, setLiked] = useState(false)
  const [comments] = useState(post.comments)
  const [shares, setShares] = useState(post.shares)

  const toggleLike = () => {
    setLiked((v) => !v)
    setLikes((n) => (liked ? n - 1 : n + 1))
  }

  return (
    <Card className="flex flex-col gap-3">
      {/* header */}
      <div className="flex items-start gap-3">
        <Avatar src={post.author.avatar} name={post.author.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate font-semibold text-ink">{post.author.name}</span>
            {post.author.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-link" />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>{post.author.meta}</span>
            {post.badge && (
              <>
                <span>·</span>
                <span>{post.badge}</span>
              </>
            )}
            <span>·</span>
            <span>{post.time}</span>
          </div>
        </div>
        {post.kind === 'selftape' && <Tag tone="cream">SELF TAPE</Tag>}
      </div>

      {/* body */}
      {post.text && <p className="text-sm leading-relaxed text-ink">{post.text}</p>}

      {post.hashtags && (
        <div className="flex flex-wrap gap-x-2 text-sm font-medium text-link">
          {post.hashtags.map((h) => (
            <span key={h}>#{h}</span>
          ))}
        </div>
      )}

      {post.banner && (
        <div className="rounded-btn bg-cream px-4 py-3">
          <span className="font-mono text-xs font-semibold tracking-label text-[#8A6D00]">
            {post.banner}
          </span>
        </div>
      )}

      {/* media */}
      {post.video && (
        <div className="overflow-hidden rounded-btn border border-line bg-black">
          <video
            src={post.video}
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="aspect-square w-full object-contain"
          />
        </div>
      )}
      {!post.video && post.image && (
        <div className="overflow-hidden rounded-btn border border-line">
          <img src={post.image} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      )}

      {/* casting CTA */}
      {post.kind === 'casting' && (
        <Button
          variant="secondary"
          className="self-start"
          iconRight={<ArrowUpRight className="h-4 w-4" />}
          onClick={() => navigate('/studio/dashboard')}
        >
          View casting
        </Button>
      )}

      {/* engagement */}
      <div className="flex items-center justify-between border-t border-line pt-2 text-sm text-muted">
        <button
          onClick={toggleLike}
          className={cn('flex items-center gap-1.5 rounded-btn px-2 py-1 hover:bg-ink/5', liked && 'text-link')}
        >
          {post.kind === 'selftape' ? <Play className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
          {likes}
        </button>
        <button className="flex items-center gap-1.5 rounded-btn px-2 py-1 hover:bg-ink/5">
          <MessageCircle className="h-4 w-4" />
          {comments}
        </button>
        <button
          onClick={() => setShares((n) => n + 1)}
          className="flex items-center gap-1.5 rounded-btn px-2 py-1 hover:bg-ink/5"
        >
          <Share2 className="h-4 w-4" />
          {shares}
        </button>
      </div>
    </Card>
  )
}

/* ── Right column ─────────────────────────────────────────────────────────── */

function RightRail() {
  const navigate = useNavigate()
  return (
    <div className="sticky top-[88px] flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <span className="tech-label">Top castings near you</span>
        <ul className="flex flex-col gap-1">
          {feedSidebar.topCastings.map((c) => {
            const projectId = c.title.toLowerCase().replace(/\s+/g, '-').replace(/[éè]/g, 'e')
            return (
            <li key={c.title}>
              <button
                onClick={() => navigate(`/talent/casting/${projectId}`)}
                className="flex w-full items-center justify-between rounded-btn px-2 py-2 text-left hover:bg-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{c.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {c.role} · {c.location}
                  </span>
                </span>
                <Tag tone="good" className="shrink-0 font-semibold">
                  {c.match}
                </Tag>
              </button>
            </li>
            )
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <span className="tech-label">People to follow</span>
        <ul className="flex flex-col gap-3">
          {feedSidebar.peopleToFollow.map((p) => (
            <FollowRow key={p.name} name={p.name} role={p.role} />
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="tech-label">Industry pulse</span>
          <Tag tone="no" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-no" />
            Live
          </Tag>
        </div>
        <ul className="flex flex-col gap-2.5">
          {feedSidebar.industryPulse.map((s) => (
            <li key={s} className="text-sm leading-snug text-ink">
              {s}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function FollowRow({ name, role }: { name: string; role: string }) {
  const [following, setFollowing] = useState(false)
  const toast = useToast()
  return (
    <li className="flex items-center gap-2.5">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{name}</div>
        <div className="truncate text-xs text-muted">{role}</div>
      </div>
      <button
        onClick={() => {
          setFollowing((v) => !v)
          toast(following ? `Unfollowed ${name}` : `Following ${name}`)
        }}
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
          following
            ? 'border-line bg-paper text-muted'
            : 'border-link/30 bg-link/10 text-link hover:bg-link/15',
        )}
      >
        {following ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        {following ? 'Following' : 'Follow'}
      </button>
    </li>
  )
}
