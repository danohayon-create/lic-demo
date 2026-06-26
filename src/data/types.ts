/**
 * Let It Cast — shared domain types for all fixtures in `src/data/`.
 * The whole app reads its data from these typed fixtures; never hard-code
 * domain data in the UI.
 */

// ── Shared ───────────────────────────────────────────────────────────────────

export type ID = string

/** The 3-state rating used everywhere (No go / Maybe / Good match). */
export type Signal = 'no' | 'maybe' | 'good'

// ── Talent ───────────────────────────────────────────────────────────────────

export type Availability = 'Available' | 'On project'

/** A talent as it appears in search / discovery lists. */
export interface Talent {
  id: ID
  name: string
  /** Profession, e.g. "Actress", "Comedian". */
  profession?: string
  availability: Availability
  city: string
  country?: string
  agency: string
  skills: string[]
  /** 0–100 AI performance-fit match. */
  match: number
  auditions: number
  callbacks: number
  verified?: boolean
  avatar?: string
}

/** Semantic colour key for a performance-profile bar. */
export type PerfColor = 'gold' | 'blue' | 'red' | 'green'

/** One axis of the persistent performance profile (0–100). */
export interface PerformanceDimension {
  label: string
  value: number
  color: PerfColor
}

/** A reel clip on the talent profile. */
export interface ReelClip {
  genre: string
  video: string
}

/** One past credit ("experience") on a talent's profile — film, TV, theatre, etc. */
export interface TalentCredit {
  id: ID
  /** Project / production title, e.g. "Evermore". */
  title: string
  /** Character / role played. */
  role: string
  /** "Film" | "TV series" | "Theatre" | "Commercial" | "Music video"… */
  type: string
  year: string
  director?: string
  /** Studio / network / company. */
  company?: string
  /** Shoot / stage location, if on-site. */
  location?: string
  /** Production or company website. */
  website?: string
}

/** Proficiency level for a skill — 1 (training) to 3 (expert). */
export type SkillLevel = 1 | 2 | 3

/** Casting-relevant appearance attributes (à la Backstage "tell us about yourself"). */
export interface Appearance {
  gender?: string
  ethnicities?: string[]
  playingAgeMin?: number
  playingAgeMax?: number
}

/** A photo or video in the talent's media gallery (headshots, reels, BTS…). */
export interface MediaItem {
  id: ID
  kind: 'photo' | 'video'
  src: string
  caption?: string
}

/** A short training / education entry. */
export interface TrainingEntry {
  id: ID
  school: string
  program: string
  years?: string
}

/** A post the talent published on the social feed, shown on her own profile. */
export interface ProfilePost {
  id: ID
  time: string
  text: string
  image?: string
  video?: string
  likes: number
  comments: number
}

/** Agent / manager contact, shown on the profile sidebar. */
export interface Representation {
  agency: string
  agent: string
  email: string
  phone?: string
}

/** The logged-in talent — Maya — with her full persistent profile. */
export interface TalentProfile extends Talent {
  union: string
  height: string
  email: string
  bookings: number
  /** "Persistent performance profile" axes. */
  performanceProfile: PerformanceDimension[]
  metrics: {
    profileViews: number
    auditionMatches: number
    performanceScore: number
  }

  // ── LinkedIn-style desktop profile (/talent) ──
  /** Short tagline under the name, e.g. "Actress · 2x lead · SAG-AFTRA". */
  headline?: string
  bio?: string
  coverImage?: string
  languages?: string[]
  training?: TrainingEntry[]
  representation?: Representation
  credits?: TalentCredit[]
  media?: MediaItem[]
  posts?: ProfilePost[]
  appearance?: Appearance
  /** Proficiency per skill name (defaults to 2 — Intermediate — if missing). */
  skillLevels?: Record<string, SkillLevel>
}

// ── Talent space: messages & notifications ───────────────────────────────────

export interface ChatMessage {
  id: ID
  /** 'me' = Maya, otherwise the contact's id. */
  from: 'me' | ID
  text: string
  time: string
}

export interface Conversation {
  id: ID
  contactName: string
  contactMeta: string
  unread: number
  lastMessageTime: string
  online?: boolean
  messages: ChatMessage[]
}

export type NotificationKind = 'casting' | 'audition' | 'message' | 'system'

export interface NotificationItem {
  id: ID
  kind: NotificationKind
  title: string
  detail: string
  time: string
  read: boolean
}

// ── Production team ──────────────────────────────────────────────────────────

/** A member of the production-side team (studio surface). */
export interface TeamMember {
  id: ID
  name: string
  /** "Casting director", "Producer", "Assistant", "Director". */
  role: string
  initials: string
  company: string
  avatar?: string
}

// ── Projects / roles ─────────────────────────────────────────────────────────

export interface ProjectKPIs {
  roles: { total: number; lead: number; supporting: number }
  submissions: { total: number; today: number }
  shortlist: { total: number; readyForCallback: number }
  callbacks: { total: number; next: string }
  booked: number
}

export interface Project {
  id: ID
  title: string
  /** "Series", "Indie film", "Music video", "Film"… */
  type: string
  company: string
  /** Genre or secondary tag ("Drama"). */
  genre?: string
  /** Secondary title — e.g. Echo Park → "The Drifter", La Nuit Vive → "Marco". */
  subtitle?: string
  submissions: number
  active?: boolean
  location?: string
  castingCloses?: string
  shooting?: string
  kpis?: ProjectKPIs
  /** Poster / thumbnail image path. */
  poster?: string
  roleIds: ID[]
  /** Short logline / synopsis shown on the talent-facing casting page. */
  synopsis?: string
  /** Director's note or casting director's brief message. */
  directorBrief?: string
  /** 'scripted' = film/TV/ad with named roles; 'non_scripted' = reality/flow TV with numbered contestant slots. Defaults to 'scripted' when absent. */
  format?: 'scripted' | 'non_scripted'
}

/** A point in the "submissions over time" chart. */
export interface SubmissionPoint {
  /** Short day label, e.g. "D1". */
  day: string
  submissions: number
}

/** An item in the project activity feed. */
export interface ActivityItem {
  id: ID
  /** Teammate initials, e.g. "ET". */
  actorInitials: string
  actorName: string
  /** Action verb phrase, e.g. "rated", "shortlisted", "left a note on". */
  action: string
  target: string
  /** Tag shown as a pill ("Good match", "Shortlist", "Note"). */
  tag: string
  signal?: Signal
  time: string
}

export type RoleType = 'Lead' | 'Supporting' | 'Contestant'
export type RoleStatus = 'Reviewing' | 'Callbacks' | 'Open'
export type AuditionFlow = 'Open Call' | 'Invited' | 'In-House'

export interface Role {
  id: ID
  projectId: ID
  name: string
  type: RoleType
  submissions: number
  shortlist: number
  status: RoleStatus
  /** Display deadline, e.g. "Sep 14". */
  deadline: string

  // ── Detail view (e.g. Fanny Brice) ──
  /** Countdown string, e.g. "3d 04h". */
  deadlineCountdown?: string
  pay?: string
  location?: string
  auditionFlow?: AuditionFlow
  /** Casting director's brief (shown with an AI-summary affordance). */
  castingNotes?: string
  sidesId?: ID
  /** For closed castings: the talent who was selected for this role. */
  selectedTalent?: { name: string; avatar: string }
}

// ── Sides (script excerpt) ───────────────────────────────────────────────────

export interface SideLine {
  /** Speaking character, or empty for a scene heading. */
  character: string
  text: string
  kind: 'heading' | 'dialogue'
}

export interface Sides {
  id: ID
  roleId: ID
  title: string
  /** Total number of pages in the sides. */
  pages: number
  lines: SideLine[]
}

// ── Auditions (talent side) ──────────────────────────────────────────────────

export type AuditionStatus = 'Under review' | 'Shortlisted' | 'Just sent' | 'To self-tape'

export interface Audition {
  id: ID
  talentId: ID
  projectId: ID
  projectTitle: string
  roleName: string
  /** Free-form info line, e.g. "Sent 3d ago", "Shortlisted yesterday". */
  info: string
  status: AuditionStatus
}

// ── Scene analysis (AI + team) ───────────────────────────────────────────────

export interface TeamRating {
  /** Initials of the rating teammate, e.g. "ET". */
  initials: string
  signal: Signal
}

export interface SceneAnalysis {
  id: ID
  roleId: ID
  talentId: ID
  /** AI per-dimension scores (0–100). */
  metrics: { label: string; value: number }[]
  /** Average team rating out of 5. */
  averageRating: number
  /** Current decision. */
  decision: Signal
  teamRatings: TeamRating[]
  /** e.g. "3 of 5 teammates have rated". */
  ratedSummary: string
}

// ── Social feed ──────────────────────────────────────────────────────────────

export type FeedKind = 'casting' | 'selftape' | 'news' | 'training' | 'update'

export interface FeedAuthor {
  name: string
  /** Author meta, e.g. "Singer", "Producer at A24", "Media", "Page". */
  meta: string
  verified?: boolean
  avatar?: string
}

export interface FeedPost {
  id: ID
  author: FeedAuthor
  /** Badge / context label, e.g. "Sponsored · Casting call". */
  badge?: string
  /** Relative time, e.g. "2h", "1d". */
  time: string
  text?: string
  hashtags?: string[]
  kind: FeedKind
  hasSelfTape?: boolean
  /** Optional media thumbnail (image path). */
  image?: string
  /** Optional self-tape video path. */
  video?: string
  /** Banner label, e.g. "WORKSHOP · 30 MIN". */
  banner?: string
  likes: number
  comments: number
  shares: number
}

/** A timecoded line of the audition transcript / synced sides. */
export interface TranscriptLine {
  /** Timecode "MM:SS". */
  timecode: string
  character?: string
  text: string
}

export interface FeedSidebar {
  topCastings: { title: string; role: string; location: string; match: number }[]
  peopleToFollow: { name: string; role: string }[]
  /** Industry-pulse live stats. */
  industryPulse: string[]
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface SearchFilter {
  label: string
  values: string[]
  /** Hidden/overflow count shown as "+N". */
  extra?: number
}

export interface SearchState {
  query: string
  aiParsed: boolean
  resultCount: number
  resultSummary: string
  filters: SearchFilter[]
}

// ── Talent app (discovery) ───────────────────────────────────────────────────

/** A casting call as shown on the talent discovery surface. */
export interface DiscoverCasting {
  /** Project id — used for the /app/casting/:id route. */
  id: ID
  title: string
  roleName: string
  /** Talent-facing category label, e.g. "TV series", "Indie film". */
  kind: string
  company?: string
  location: string
  /** Countdown string, e.g. "3d 04h". */
  deadline?: string
  match: number
  /** Whether a rich detail screen exists for this casting. */
  hasDetail: boolean
  /** Poster image path. */
  poster?: string
  /** "ongoing" = open for submissions, "closed" = past / applied. */
  status?: 'ongoing' | 'closed'
  /** Year the casting closed — shown on closed cards. */
  year?: string
}

/** A point in the talent "plays" sparkline. */
export interface SparkPoint {
  i: number
  plays: number
}
