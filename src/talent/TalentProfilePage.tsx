import { useRef, useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  Camera,
  Film,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Play,
  Plus,
  Trash2,
  UserCircle2,
  Video,
  Zap,
} from 'lucide-react'
import { Card, Avatar, Tag, Button } from '@/components/ui'
import { EditModal, Field, TextInput, TextArea, Select } from '@/components/EditModal'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { colors } from '@/styles/tokens'
import {
  mayaProfile,
  type PerfColor,
  type TalentCredit,
  type MediaItem,
  type ProfilePost,
  type TalentProfile,
  type SkillLevel,
} from '@/data'

const barColor: Record<PerfColor, string> = {
  gold: colors.gold,
  blue: colors.link,
  red: colors.signalNo,
  green: colors.signalGood,
}

const presetPhotos = ['/posters/p1.png', '/posters/p2.png', '/posters/p3.png', '/posters/p4.png', '/posters/p5.png', '/posters/p6.png', '/posters/p7.png', '/posters/p8.png']
const presetVideos = ['/media/audition.mp4', '/media/selftape.mp4']

const genders = ['Male', 'Female', 'Additional']
const ethnicityOptions = [
  'Asian',
  'Black / African Descent',
  'Ethnically Ambiguous / Multiracial',
  'Indigenous Peoples',
  'Latino / Hispanic',
  'Middle Eastern',
  'South Asian / Indian',
  'Southeast Asian / Pacific Islander',
  'White / European Descent',
]

let uid = 100
const nextId = (prefix: string) => `${prefix}-${uid++}`

export function TalentProfilePage() {
  const toast = useToast()
  const [p, setP] = useState<TalentProfile>(mayaProfile)
  const [newSkill, setNewSkill] = useState('')

  // ── modal state ──
  const [editIdentity, setEditIdentity] = useState(false)
  const [editAbout, setEditAbout] = useState(false)
  const [editCover, setEditCover] = useState(false)
  const [editAvatar, setEditAvatar] = useState(false)
  const [creditDraft, setCreditDraft] = useState<TalentCredit | null>(null)
  const [mediaDraft, setMediaDraft] = useState<Partial<MediaItem> | null>(null)
  const [postDraft, setPostDraft] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [editAppearance, setEditAppearance] = useState(false)
  const [draftAppearance, setDraftAppearance] = useState(p.appearance ?? {})

  // draft buffers for identity/about (so cancel doesn't mutate state)
  const [draftName, setDraftName] = useState(p.name)
  const [draftHeadline, setDraftHeadline] = useState(p.headline ?? '')
  const [draftCity, setDraftCity] = useState(p.city)
  const [draftBio, setDraftBio] = useState(p.bio ?? '')

  const openIdentity = () => {
    setDraftName(p.name)
    setDraftHeadline(p.headline ?? '')
    setDraftCity(p.city)
    setEditIdentity(true)
  }
  const saveIdentity = () => {
    setP((cur) => ({ ...cur, name: draftName, headline: draftHeadline, city: draftCity }))
    setEditIdentity(false)
    toast('Profile updated')
  }

  const openAbout = () => {
    setDraftBio(p.bio ?? '')
    setEditAbout(true)
  }
  const saveAbout = () => {
    setP((cur) => ({ ...cur, bio: draftBio }))
    setEditAbout(false)
    toast('Bio updated')
  }

  const pickCover = (src: string) => {
    setP((cur) => ({ ...cur, coverImage: src }))
    setEditCover(false)
    toast('Cover photo updated')
  }
  const pickAvatar = (src: string) => {
    setP((cur) => ({ ...cur, avatar: src }))
    setEditAvatar(false)
    toast('Profile photo updated')
  }

  const addSkill = () => {
    const v = newSkill.trim()
    if (!v || p.skills.includes(v)) return
    setP((cur) => ({ ...cur, skills: [...cur.skills, v], skillLevels: { ...cur.skillLevels, [v]: 2 } }))
    setNewSkill('')
  }
  const removeSkill = (skill: string) => {
    setP((cur) => ({ ...cur, skills: cur.skills.filter((s) => s !== skill) }))
  }
  const openAppearance = () => {
    setDraftAppearance(p.appearance ?? {})
    setEditAppearance(true)
  }
  const saveAppearance = () => {
    setP((cur) => ({ ...cur, appearance: draftAppearance }))
    setEditAppearance(false)
    toast('Appearance updated')
  }
  const toggleEthnicity = (eth: string) => {
    setDraftAppearance((cur) => {
      const curEth = cur.ethnicities ?? []
      const has = curEth.includes(eth)
      return { ...cur, ethnicities: has ? curEth.filter((e) => e !== eth) : [...curEth, eth] }
    })
  }

  const openNewCredit = () =>
    setCreditDraft({ id: '', title: '', role: '', type: 'Film', year: '', director: '', company: '', location: '', website: '' })
  const saveCredit = () => {
    if (!creditDraft || !creditDraft.title.trim()) return
    setP((cur) => {
      const credits = cur.credits ?? []
      const exists = credits.some((c) => c.id === creditDraft.id)
      const entry = { ...creditDraft, id: creditDraft.id || nextId('cr') }
      return {
        ...cur,
        credits: exists ? credits.map((c) => (c.id === entry.id ? entry : c)) : [entry, ...credits],
      }
    })
    setCreditDraft(null)
    toast('Experience saved')
  }
  const removeCredit = (id: string) => {
    setP((cur) => ({ ...cur, credits: (cur.credits ?? []).filter((c) => c.id !== id) }))
    toast('Experience removed')
  }

  const openNewMedia = (kind: 'photo' | 'video') =>
    setMediaDraft({ kind, src: kind === 'video' ? presetVideos[0] : presetPhotos[0], caption: '' })
  const saveMedia = () => {
    if (!mediaDraft?.src) return
    const entry: MediaItem = {
      id: nextId('md'),
      kind: mediaDraft.kind === 'video' ? 'video' : 'photo',
      src: mediaDraft.src,
      caption: mediaDraft.caption,
    }
    setP((cur) => ({ ...cur, media: [entry, ...(cur.media ?? [])] }))
    setMediaDraft(null)
    toast('Media added')
  }
  const removeMedia = (id: string) => {
    setP((cur) => ({ ...cur, media: (cur.media ?? []).filter((m) => m.id !== id) }))
  }

  const publishPost = () => {
    const text = postDraft.trim()
    if (!text) return
    const entry: ProfilePost = { id: nextId('mp'), time: 'now', text, likes: 0, comments: 0 }
    setP((cur) => ({ ...cur, posts: [entry, ...(cur.posts ?? [])] }))
    setPostDraft('')
    setComposerOpen(false)
    toast('Post published')
  }

  return (
    <div className="flex flex-col gap-5 pb-16 lg:flex-row lg:items-start lg:gap-6">
      <div className="flex flex-1 flex-col gap-5">
        {/* identity card */}
        <Card flush className="overflow-hidden">
          <div className="group relative h-40 w-full bg-line">
            {p.coverImage && <img src={p.coverImage} alt="" className="h-full w-full object-cover" />}
            <button
              onClick={() => setEditCover(true)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-ink opacity-0 shadow-card transition-opacity group-hover:opacity-100"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="relative px-5 pb-5 pt-14">
            <div className="group absolute -top-12 left-5">
              <Avatar src={p.avatar} name={p.name} size="xl" ring className="border-4 border-card" />
              <button
                onClick={() => setEditAvatar(true)}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={openIdentity}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
            >
              <Pencil className="h-4 w-4" />
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{p.name}</h1>
              {p.verified && <BadgeCheck className="h-5 w-5 text-link" />}
            </div>
            <p className="mt-1 text-sm text-muted">{p.headline}</p>
            <p className="mt-0.5 text-sm text-muted">
              {p.city}
              {p.country ? `, ${p.country}` : ''} · {p.agency}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag>{p.union}</Tag>
              <Tag tone="good">{p.availability}</Tag>
              {p.verified && (
                <Tag tone="link" icon={<BadgeCheck className="h-3 w-3" />}>
                  Verified
                </Tag>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" icon={<Zap className="h-3.5 w-3.5" />} onClick={() => toast('Snap apply — coming soon')}>
                Snap apply
              </Button>
              <Button variant="secondary" size="sm" onClick={openIdentity}>
                Edit profile
              </Button>
            </div>
          </div>
        </Card>

        {/* stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCell value={p.metrics.profileViews} label="Profile views" />
          <StatCell value={p.auditions} label="Auditions" />
          <StatCell value={p.bookings} label="Bookings" />
        </div>

        {/* about */}
        <Card className="flex flex-col gap-2">
          <SectionHeader title="About" onEdit={openAbout} />
          <p className="text-sm leading-relaxed text-ink/90">{p.bio || 'Add a short bio to introduce yourself to casting directors.'}</p>
        </Card>

        {/* persistent performance profile */}
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

        {/* skills */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Skills" />
          <p className="text-xs text-muted">Click the dots to set your proficiency level for each skill.</p>
          <ul className="flex flex-col divide-y divide-line">
            {p.skills.map((s) => (
              <li key={s} className="group flex items-center justify-between gap-3 py-2 first:pt-0">
                <span className="text-sm font-medium text-ink">{s}</span>
                <div className="flex items-center gap-3">
                  <SkillDots level={p.skillLevels?.[s] ?? 2} onSet={(lvl) => setP((cur) => ({ ...cur, skillLevels: { ...cur.skillLevels, [s]: lvl } }))} />
                  <button onClick={() => removeSkill(s)} className="text-muted/50 opacity-0 transition-opacity hover:text-signal-no group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <TextInput
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              placeholder="Search for a skill to add, e.g. Stage combat"
              className="flex-1"
            />
            <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={addSkill}>
              Add
            </Button>
          </div>
        </Card>

        {/* appearance */}
        <Card className="flex flex-col gap-2">
          <SectionHeader title="Appearance" icon={<UserCircle2 className="h-4 w-4" />} onEdit={openAppearance} />
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-label font-semibold uppercase tracking-label text-muted">Gender</p>
              <p className="mt-0.5 text-ink">{p.appearance?.gender ?? '—'}</p>
            </div>
            <div>
              <p className="text-label font-semibold uppercase tracking-label text-muted">Playing age</p>
              <p className="mt-0.5 text-ink">
                {p.appearance?.playingAgeMin && p.appearance?.playingAgeMax
                  ? `${p.appearance.playingAgeMin}–${p.appearance.playingAgeMax}`
                  : '—'}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-label font-semibold uppercase tracking-label text-muted">Ethnicities</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(p.appearance?.ethnicities ?? []).length > 0 ? (
                  p.appearance!.ethnicities!.map((e) => <Tag key={e}>{e}</Tag>)
                ) : (
                  <span className="text-ink">—</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* experience / credits */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Experience" icon={<Briefcase className="h-4 w-4" />} onAdd={openNewCredit} />
          <ul className="flex flex-col divide-y divide-line">
            {(p.credits ?? []).map((c) => (
              <li key={c.id} className="group flex items-start justify-between gap-3 py-3 first:pt-0">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {c.role} · <span className="text-muted">{c.title}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {c.type} · {c.year}
                    {c.company ? ` · ${c.company}` : ''}
                    {c.director ? ` · dir. ${c.director}` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                    {c.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {c.location}
                      </span>
                    )}
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-link hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setCreditDraft(c)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeCredit(c.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-signal-no/10 hover:text-signal-no"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {(p.credits ?? []).length === 0 && <p className="py-2 text-sm text-muted">No experience added yet.</p>}
          </ul>
        </Card>

        {/* photos & book */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Photos & book" icon={<ImageIcon className="h-4 w-4" />} onAdd={() => openNewMedia('photo')} />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(p.media ?? []).filter((m) => m.kind === 'photo').map((m) => (
              <MediaTile key={m.id} item={m} onRemove={() => removeMedia(m.id)} />
            ))}
          </div>
          {(p.media ?? []).filter((m) => m.kind === 'photo').length === 0 && (
            <p className="text-sm text-muted">No photos yet.</p>
          )}
        </Card>

        {/* self-tapes */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Self-tapes" icon={<Video className="h-4 w-4" />} onAdd={() => openNewMedia('video')} />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(p.media ?? []).filter((m) => m.kind === 'video').map((m) => (
              <MediaTile key={m.id} item={m} onRemove={() => removeMedia(m.id)} />
            ))}
          </div>
          {(p.media ?? []).filter((m) => m.kind === 'video').length === 0 && (
            <p className="text-sm text-muted">No self-tapes yet.</p>
          )}
        </Card>

        {/* training */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="Training & education" icon={<GraduationCap className="h-4 w-4" />} />
          <ul className="flex flex-col gap-2.5">
            {(p.training ?? []).map((t) => (
              <li key={t.id} className="text-sm">
                <p className="font-semibold text-ink">{t.school}</p>
                <p className="text-xs text-muted">
                  {t.program}
                  {t.years ? ` · ${t.years}` : ''}
                </p>
              </li>
            ))}
            {(p.training ?? []).length === 0 && <p className="text-sm text-muted">No training added yet.</p>}
          </ul>
        </Card>

        {/* activity / posts */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="tech-label">Activity</span>
            <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setComposerOpen(true)}>
              New post
            </Button>
          </div>
          <ul className="flex flex-col divide-y divide-line">
            {(p.posts ?? []).map((post) => (
              <li key={post.id} className="flex flex-col gap-2 py-3 first:pt-0">
                <div className="flex items-center gap-2">
                  <Avatar src={p.avatar} name={p.name} size="sm" />
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-muted">{post.time}</p>
                  </div>
                </div>
                <p className="text-sm text-ink/90">{post.text}</p>
                {post.image && <img src={post.image} alt="" className="rounded-btn border border-line object-cover" />}
                <p className="text-xs text-muted">
                  {post.likes} likes · {post.comments} comments
                </p>
              </li>
            ))}
            {(p.posts ?? []).length === 0 && <p className="py-2 text-sm text-muted">No posts yet.</p>}
          </ul>
        </Card>
      </div>

      {/* sidebar */}
      <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
        <Card className="flex flex-col gap-2">
          <span className="tech-label">Representation</span>
          {p.representation ? (
            <div className="text-sm">
              <p className="font-semibold text-ink">{p.representation.agency}</p>
              <p className="text-muted">{p.representation.agent}</p>
              <p className="mt-1 font-medium text-link">{p.representation.email}</p>
              {p.representation.phone && <p className="text-muted">{p.representation.phone}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted">No agent on file.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-2">
          <span className="tech-label">Languages</span>
          <div className="flex flex-wrap gap-1.5">
            {(p.languages ?? []).map((l) => (
              <Tag key={l}>{l}</Tag>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-2 text-sm">
          <span className="tech-label">Details</span>
          <InfoRow label="Height" value={p.height} />
          <InfoRow label="Contact" value={p.email} link />
        </Card>
      </div>

      {/* ── modals ── */}
      <EditModal open={editIdentity} title="Edit profile" onClose={() => setEditIdentity(false)} onSave={saveIdentity}>
        <Field label="Name">
          <TextInput value={draftName} onChange={(e) => setDraftName(e.target.value)} />
        </Field>
        <Field label="Headline">
          <TextInput value={draftHeadline} onChange={(e) => setDraftHeadline(e.target.value)} placeholder="Actress · Drama · SAG-AFTRA" />
        </Field>
        <Field label="City">
          <TextInput value={draftCity} onChange={(e) => setDraftCity(e.target.value)} />
        </Field>
      </EditModal>

      <EditModal open={editAbout} title="Edit about" onClose={() => setEditAbout(false)} onSave={saveAbout}>
        <Field label="Bio">
          <TextArea rows={6} value={draftBio} onChange={(e) => setDraftBio(e.target.value)} />
        </Field>
      </EditModal>

      <EditModal open={editCover} title="Choose a cover photo" onClose={() => setEditCover(false)}>
        <div className="grid grid-cols-4 gap-2">
          {presetPhotos.map((src) => (
            <button key={src} onClick={() => pickCover(src)} className="overflow-hidden rounded-btn border border-line">
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      </EditModal>

      <EditModal open={editAvatar} title="Choose a profile photo" onClose={() => setEditAvatar(false)}>
        <div className="grid grid-cols-4 gap-2">
          {presetPhotos.map((src) => (
            <button key={src} onClick={() => pickAvatar(src)} className="overflow-hidden rounded-full border border-line">
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      </EditModal>

      <EditModal
        open={!!creditDraft}
        title={creditDraft?.id ? 'Edit experience' : 'Add experience'}
        onClose={() => setCreditDraft(null)}
        onSave={saveCredit}
        saveLabel="Save"
      >
        {creditDraft && (
          <>
            <Field label="Project title">
              <TextInput value={creditDraft.title} onChange={(e) => setCreditDraft({ ...creditDraft, title: e.target.value })} />
            </Field>
            <Field label="Role">
              <TextInput value={creditDraft.role} onChange={(e) => setCreditDraft({ ...creditDraft, role: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={creditDraft.type} onChange={(e) => setCreditDraft({ ...creditDraft, type: e.target.value })}>
                {['Film', 'TV series', 'Theatre', 'Commercial', 'Music video', 'Indie film'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Year">
              <TextInput value={creditDraft.year} onChange={(e) => setCreditDraft({ ...creditDraft, year: e.target.value })} />
            </Field>
            <Field label="Company / network">
              <TextInput value={creditDraft.company ?? ''} onChange={(e) => setCreditDraft({ ...creditDraft, company: e.target.value })} />
            </Field>
            <Field label="Director">
              <TextInput value={creditDraft.director ?? ''} onChange={(e) => setCreditDraft({ ...creditDraft, director: e.target.value })} />
            </Field>
            <Field label="Location (if on-site)">
              <TextInput value={creditDraft.location ?? ''} onChange={(e) => setCreditDraft({ ...creditDraft, location: e.target.value })} />
            </Field>
            <Field label="Production or company website">
              <TextInput
                value={creditDraft.website ?? ''}
                onChange={(e) => setCreditDraft({ ...creditDraft, website: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          </>
        )}
      </EditModal>

      <EditModal open={editAppearance} title="Edit appearance" onClose={() => setEditAppearance(false)} onSave={saveAppearance}>
        <Field label="Gender identity">
          <div className="flex flex-wrap gap-2">
            {genders.map((g) => (
              <button
                key={g}
                onClick={() => setDraftAppearance((cur) => ({ ...cur, gender: g }))}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  draftAppearance.gender === g ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:text-ink',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Ethnicities">
          <div className="flex flex-wrap gap-2">
            {ethnicityOptions.map((e) => {
              const active = (draftAppearance.ethnicities ?? []).includes(e)
              return (
                <button
                  key={e}
                  onClick={() => toggleEthnicity(e)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:text-ink',
                  )}
                >
                  {e}
                </button>
              )
            })}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min playing age">
            <TextInput
              type="number"
              value={draftAppearance.playingAgeMin ?? ''}
              onChange={(e) => setDraftAppearance((cur) => ({ ...cur, playingAgeMin: Number(e.target.value) || undefined }))}
            />
          </Field>
          <Field label="Max playing age">
            <TextInput
              type="number"
              value={draftAppearance.playingAgeMax ?? ''}
              onChange={(e) => setDraftAppearance((cur) => ({ ...cur, playingAgeMax: Number(e.target.value) || undefined }))}
            />
          </Field>
        </div>
      </EditModal>

      <EditModal open={!!mediaDraft} title="Add media" onClose={() => setMediaDraft(null)} onSave={saveMedia} saveLabel="Add">
        {mediaDraft && (
          <>
            <Field label="Type">
              <Select
                value={mediaDraft.kind}
                onChange={(e) => {
                  const kind = e.target.value as 'photo' | 'video'
                  setMediaDraft({ ...mediaDraft, kind, src: kind === 'video' ? presetVideos[0] : presetPhotos[0] })
                }}
              >
                <option value="photo">Photo</option>
                <option value="video">Video</option>
              </Select>
            </Field>
            <Field label="File">
              <div className="grid grid-cols-4 gap-2">
                {(mediaDraft.kind === 'video' ? presetVideos : presetPhotos).map((src) => (
                  <button
                    key={src}
                    onClick={() => setMediaDraft({ ...mediaDraft, src })}
                    className={`overflow-hidden rounded-btn border ${mediaDraft.src === src ? 'border-ink' : 'border-line'}`}
                  >
                    {mediaDraft.kind === 'video' ? (
                      <span className="flex aspect-square w-full items-center justify-center bg-black text-white">
                        <Film className="h-5 w-5" />
                      </span>
                    ) : (
                      <img src={src} alt="" className="aspect-square w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Caption">
              <TextInput
                value={mediaDraft.caption ?? ''}
                onChange={(e) => setMediaDraft({ ...mediaDraft, caption: e.target.value })}
                placeholder="e.g. Headshot — natural light"
              />
            </Field>
          </>
        )}
      </EditModal>

      <EditModal open={composerOpen} title="New post" onClose={() => setComposerOpen(false)} onSave={publishPost} saveLabel="Publish">
        <Field label="What's new?">
          <TextArea rows={5} value={postDraft} onChange={(e) => setPostDraft(e.target.value)} placeholder="Share an update with your network…" />
        </Field>
      </EditModal>
    </div>
  )
}

function SectionHeader({
  title,
  icon,
  onEdit,
  onAdd,
}: {
  title: string
  icon?: React.ReactNode
  onEdit?: () => void
  onAdd?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="tech-label inline-flex items-center gap-1.5">
        {icon}
        {title}
      </span>
      {onEdit && (
        <button onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onAdd && (
        <button onClick={onAdd} className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function SkillDots({ level, onSet }: { level: SkillLevel; onSet: (lvl: SkillLevel) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          onClick={() => onSet(n as SkillLevel)}
          className={cn('h-2.5 w-2.5 rounded-full border', n <= level ? 'border-link bg-link' : 'border-line bg-transparent')}
          title={n === 1 ? 'Beginner / Training' : n === 2 ? 'Intermediate' : 'Expert'}
        />
      ))}
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

function MediaTile({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const play = () => {
    ref.current?.play()
    setPlaying(true)
  }
  return (
    <div className="group relative aspect-square overflow-hidden rounded-btn border border-line bg-black">
      {item.kind === 'photo' ? (
        <img src={item.src} alt={item.caption ?? ''} className="h-full w-full object-cover" />
      ) : (
        <>
          <video
            ref={ref}
            src={item.src}
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            onClick={() => (playing ? ref.current?.pause() : play())}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />
          {!playing && (
            <button onClick={play} className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink">
                <Play className="ml-0.5 h-4 w-4" />
              </span>
            </button>
          )}
        </>
      )}
      <button
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {item.caption && (
        <span className="absolute bottom-1 left-1.5 right-1.5 truncate font-mono text-[9px] font-semibold tracking-wide text-white/90">
          {item.caption}
        </span>
      )}
    </div>
  )
}
