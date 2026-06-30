import { useSyncExternalStore } from 'react'
import { teamById } from './team'
import { rolesById } from './projects'
import type { Signal } from './types'

export type { Signal }

export type CandidateStatus = 'new' | 'no-go' | 'shortlisted' | 'callback' | 'offer' | 'cast'
export type RolePipelineStatus = 'New' | 'Viewed' | 'Reviewed' | 'Shortlisted' | 'Callback' | 'Offer' | 'Cast'

export type Candidate = {
  id: string
  roleId: string
  name: string
  age: number
  city: string
  good: number
  maybe: number
  no: number
  status: CandidateStatus
  /** Self-tape video — falls back to the generic demo audition when absent. */
  video?: string
  /** Profile photo (extracted from the audition) — falls back to initials when absent. */
  avatar?: string

  // ── Talent-sheet criteria (for the multi-criteria search) ──
  gender?: 'F' | 'M'
  experienceLevel?: string
  nationality?: string
  languages?: string[]

  /** Each teammate's individual vote — team member id → signal. Powers the
   *  "other ratings" bubbles and the "reviewed by" filter. */
  raterVotes?: Record<string, Signal>
}

export const PIPELINE_STATUSES: RolePipelineStatus[] = [
  'New', 'Viewed', 'Reviewed', 'Shortlisted', 'Callback', 'Offer', 'Cast',
]

export const BOARD_COLUMNS: CandidateStatus[] = ['new', 'no-go', 'shortlisted', 'callback', 'offer', 'cast']

export const BOARD_COLUMN_LABELS: Record<CandidateStatus, RolePipelineStatus> = {
  new: 'New',
  'no-go': 'Reviewed',
  shortlisted: 'Shortlisted',
  callback: 'Callback',
  offer: 'Offer',
  cast: 'Cast',
}

/** Columns a card cannot be dragged out of — candidates here must go through a review first. */
export const LOCKED_COLUMNS = new Set<CandidateStatus>(['new'])

/** Columns where only one candidate may be present at a time. */
const SINGLE_OCCUPANT_COLUMNS = new Set<CandidateStatus>(['offer', 'cast'])

/** Score below which a reviewed candidate is automatically a No Go. */
const NO_GO_THRESHOLD = 60

/** Weighted "Let It Cast" score (0–100) from the good/maybe/no-go tally. */
export function candidateScore(c: Candidate): number {
  const total = c.good + c.maybe + c.no
  if (total === 0) return 0
  return Math.round((c.good * 100 + c.maybe * 50) / total)
}

// ── Seed candidates (Les Ombres de Midi) ───────────────────────────────────────

const seedCandidates: Candidate[] = [
  // Inspectrice Chloé Marchand (Lead) — scores: 90, 80, 60, 83, 50, 38
  { id: 'cand-1',  roleId: 'chloe-marchand', name: 'Camille Vidal',  age: 38, city: 'Marseille', good: 4, maybe: 1, no: 0, status: 'offer',       video: '/media/Camille Vidal.mp4', avatar: '/avatars/camille-vidal.jpg',
    gender: 'F', experienceLevel: 'Established', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'maybe' } },
  { id: 'cand-2',  roleId: 'chloe-marchand', name: 'Sarah Lefèvre',  age: 41, city: 'Paris',      good: 3, maybe: 2, no: 0, status: 'callback',    video: '/media/Sarah Lefevre.mp4', avatar: '/avatars/sarah-lefevre.jpg',
    gender: 'F', experienceLevel: 'Star', nationality: 'French', languages: ['French', 'English', 'Spanish'],
    raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  { id: 'cand-3',  roleId: 'chloe-marchand', name: 'Nadia Ferrand',  age: 36, city: 'Lyon',        good: 2, maybe: 2, no: 1, status: 'callback',    video: '/media/Nadia Ferrand.mp4', avatar: '/avatars/nadia-ferrand.jpg',
    gender: 'F', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe', 'lara-khan': 'no' } },
  { id: 'cand-4',  roleId: 'chloe-marchand', name: 'Inès Karim',     age: 37, city: 'Paris',      good: 2, maybe: 1, no: 0, status: 'shortlisted', video: '/media/Ines Karim.mp4', avatar: '/avatars/ines-karim.jpg',
    gender: 'F', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French', 'English', 'Arabic'],
    raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'cand-5',  roleId: 'chloe-marchand', name: 'Hannah Levy',    age: 39, city: 'New York',   good: 1, maybe: 2, no: 1, status: 'no-go',       video: '/media/Hannah Levy.mp4', avatar: '/avatars/hannah-levy.jpg',
    gender: 'F', experienceLevel: 'Established', nationality: 'American', languages: ['English', 'Hebrew'],
    raterVotes: { 'eden-tov': 'maybe', 'lara-khan': 'no' } },
  { id: 'cand-6',  roleId: 'chloe-marchand', name: 'Eva Sokolov',    age: 40, city: 'Berlin',     good: 1, maybe: 1, no: 2, status: 'no-go',       video: '/media/Eva Sokolov.mp4', avatar: '/avatars/eva-sokolov.jpg',
    gender: 'F', experienceLevel: 'Mid-career', nationality: 'German', languages: ['German', 'English'],
    raterVotes: { 'peter-known': 'no', 'julie-cohen': 'no' } },

  // Capitaine Rémy Jourdain (Supporting) — scores: 88, 75, 63, 50
  { id: 'cand-7',  roleId: 'remy-jourdain', name: 'Thomas Granger',  age: 45, city: 'Marseille',  good: 3, maybe: 1, no: 0, status: 'shortlisted', video: '/media/Thomas Granger.mp4', avatar: '/avatars/thomas-granger.jpg',
    gender: 'M', experienceLevel: 'Established', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'good' } },
  { id: 'cand-8',  roleId: 'remy-jourdain', name: 'Marc Dubreuil',   age: 48, city: 'Lyon',        good: 2, maybe: 2, no: 0, status: 'shortlisted', video: '/media/Marc Dubreuil.mp4', avatar: '/avatars/marc-dubreuil.jpg',
    gender: 'M', experienceLevel: 'Star', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  { id: 'cand-9',  roleId: 'remy-jourdain', name: 'Karim Belkacem',  age: 43, city: 'Marseille',  good: 2, maybe: 1, no: 1, status: 'shortlisted', video: '/media/Karim Belkacem.mp4', avatar: '/avatars/karim-belkacem.jpg',
    gender: 'M', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French', 'Arabic', 'English'],
    raterVotes: { 'peter-known': 'good', 'lara-khan': 'no' } },
  { id: 'cand-10', roleId: 'remy-jourdain', name: 'Julien Faure',    age: 46, city: 'Toulouse',   good: 1, maybe: 1, no: 1, status: 'no-go',       video: '/media/Julien Faure.mp4', avatar: '/avatars/julien-faure.jpg',
    gender: 'M', experienceLevel: 'Emerging', nationality: 'French', languages: ['French'],
    raterVotes: { 'julie-cohen': 'no', 'eden-tov': 'maybe' } },

  // La Témoin (Supporting) — scores: 100, 75 (no dedicated audition footage yet)
  { id: 'cand-11', roleId: 'la-temoin-film', name: 'Lola Mercier',   age: 27, city: 'Marseille',  good: 2, maybe: 0, no: 0, status: 'shortlisted', avatar: '/avatars/lola-mercier.jpg',
    gender: 'F', experienceLevel: 'Emerging', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'cand-12', roleId: 'la-temoin-film', name: 'Zoé Andrieu',    age: 30, city: 'Nice',        good: 1, maybe: 1, no: 0, status: 'shortlisted', avatar: '/avatars/zoe-andrieu.jpg',
    gender: 'F', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French', 'Italian'],
    raterVotes: { 'julie-cohen': 'good', 'lara-khan': 'maybe' } },

  // Fresh submissions — not reviewed yet, waiting in the New column
  { id: 'cand-13', roleId: 'chloe-marchand', name: 'Anaïs Roche',    age: 34, city: 'Bordeaux',   good: 0, maybe: 0, no: 0, status: 'new', avatar: '/avatars/anais-roche.jpg',
    gender: 'F', experienceLevel: 'Emerging', nationality: 'French', languages: ['French'] },
  { id: 'cand-14', roleId: 'chloe-marchand', name: 'Lucie Fontaine', age: 39, city: 'Nantes',      good: 0, maybe: 0, no: 0, status: 'new', avatar: '/avatars/lucie-fontaine.jpg',
    gender: 'F', experienceLevel: 'Emerging', nationality: 'French', languages: ['French', 'English'] },
  { id: 'cand-15', roleId: 'remy-jourdain', name: 'Vincent Berry',   age: 44, city: 'Lille',       good: 0, maybe: 0, no: 0, status: 'new', avatar: '/avatars/vincent-berry.jpg',
    gender: 'M', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French'] },

  // Agnès Marchand — casting not opened yet: no candidates

  // ── Survivor Australia — survivor-new-castaways ──────────────────────────────
  // cast (14)
  { id: 'surv-1',  roleId: 'survivor-new-castaways', name: 'Jade Thompson',    age: 28, city: 'Sydney',      gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-2',  roleId: 'survivor-new-castaways', name: 'Liam Chen',        age: 32, city: 'Melbourne',   gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Athlete',     nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-3',  roleId: 'survivor-new-castaways', name: 'Emma Nguyen',      age: 26, city: 'Brisbane',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-4',  roleId: 'survivor-new-castaways', name: 'Noah Wilson',      age: 35, city: 'Perth',       gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Athlete',    nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-5',  roleId: 'survivor-new-castaways', name: 'Sienna Russo',     age: 29, city: 'Gold Coast',  gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-6',  roleId: 'survivor-new-castaways', name: 'Tyler Patel',      age: 31, city: 'Melbourne',   gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg',  experienceLevel: 'Professional', nationality: 'Australian', languages: ['English', 'Hindi'],        raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-7',  roleId: 'survivor-new-castaways', name: 'Chloe Anderson',   age: 27, city: 'Sydney',      gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-8',  roleId: 'survivor-new-castaways', name: 'Blake Martinez',   age: 34, city: 'Adelaide',    gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English', 'Spanish'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-9',  roleId: 'survivor-new-castaways', name: 'Mia Tran',         age: 25, city: 'Brisbane',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-10', roleId: 'survivor-new-castaways', name: 'Jordan Clarke',    age: 30, city: 'Gold Coast',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-11', roleId: 'survivor-new-castaways', name: 'Zara Kim',         age: 28, city: 'Melbourne',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English', 'Korean'],       raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-12', roleId: 'survivor-new-castaways', name: 'Hunter Wallace',   age: 33, city: 'Perth',       gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-13', roleId: 'survivor-new-castaways', name: 'Brooke Sharma',    age: 26, city: 'Sydney',      gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English', 'Hindi'],        raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-14', roleId: 'survivor-new-castaways', name: 'Lachlan O\'Brien', age: 37, city: 'Cairns',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Professional', nationality: 'Australian', languages: ['English'],                 raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  // callback (3)
  { id: 'surv-15', roleId: 'survivor-new-castaways', name: 'Georgia Walsh',    age: 29, city: 'Melbourne',   gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/hannah-levy.jpg',   experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-16', roleId: 'survivor-new-castaways', name: 'Dylan Huang',      age: 31, city: 'Sydney',      gender: 'M', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  { id: 'surv-17', roleId: 'survivor-new-castaways', name: 'Imogen Santos',    age: 24, city: 'Brisbane',    gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/ines-karim.jpg',    experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English', 'Filipino'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  // shortlisted (25)
  { id: 'surv-18', roleId: 'survivor-new-castaways', name: 'Riley Murphy',     age: 28, city: 'Hobart',      gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Amateur',     nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'surv-19', roleId: 'survivor-new-castaways', name: 'Finn Armstrong',   age: 30, city: 'Darwin',      gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Athlete',     nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-20', roleId: 'survivor-new-castaways', name: 'Tegan Morrison',   age: 27, city: 'Newcastle',   gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-21', roleId: 'survivor-new-castaways', name: 'Connor Stevens',   age: 33, city: 'Wollongong',  gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Athlete',    nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-22', roleId: 'survivor-new-castaways', name: 'Millie Forbes',    age: 25, city: 'Sydney',      gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'surv-23', roleId: 'survivor-new-castaways', name: 'Alex Lee',         age: 29, city: 'Melbourne',   gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Professional', nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'maybe', 'julie-cohen': 'good' } },
  { id: 'surv-24', roleId: 'survivor-new-castaways', name: 'Harper Reid',      age: 26, city: 'Brisbane',    gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'good', 'lara-khan': 'good' } },
  { id: 'surv-25', roleId: 'survivor-new-castaways', name: 'Sam Cooper',       age: 32, city: 'Perth',       gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'julie-cohen': 'maybe' } },
  { id: 'surv-26', roleId: 'survivor-new-castaways', name: 'Bree Nolan',       age: 28, city: 'Adelaide',    gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'surv-27', roleId: 'survivor-new-castaways', name: 'Callum Wright',    age: 34, city: 'Gold Coast',  gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Athlete',     nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-28', roleId: 'survivor-new-castaways', name: 'Lily Papadopoulos',age: 27, city: 'Sydney',      gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/sarah-lefevre.jpg', experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English', 'Greek'],        raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-29', roleId: 'survivor-new-castaways', name: 'Scott Nguyen',     age: 30, city: 'Melbourne',   gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Amateur',     nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'surv-30', roleId: 'survivor-new-castaways', name: 'Grace Hardy',      age: 29, city: 'Cairns',      gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/maya-reyes.png',    experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  { id: 'surv-31', roleId: 'survivor-new-castaways', name: 'Max Thompson',     age: 35, city: 'Townsville',  gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Professional', nationality: 'Australian', languages: ['English'],                 raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'surv-32', roleId: 'survivor-new-castaways', name: 'Tia Stephenson',   age: 24, city: 'Sydney',      gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'good' } },
  { id: 'surv-33', roleId: 'survivor-new-castaways', name: 'Ethan Russo',      age: 28, city: 'Melbourne',   gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-34', roleId: 'survivor-new-castaways', name: 'Charlotte Evans',  age: 26, city: 'Brisbane',    gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'surv-35', roleId: 'survivor-new-castaways', name: 'Ryan Boyd',        age: 31, city: 'Perth',       gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-36', roleId: 'survivor-new-castaways', name: 'Sofia Haddad',     age: 27, city: 'Adelaide',    gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English', 'Arabic'],       raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-37', roleId: 'survivor-new-castaways', name: 'Angus McCarthy',   age: 29, city: 'Darwin',      gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Athlete',     nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'surv-38', roleId: 'survivor-new-castaways', name: 'Isla Bennett',     age: 25, city: 'Hobart',      gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'maybe', 'lara-khan': 'good' } },
  { id: 'surv-39', roleId: 'survivor-new-castaways', name: 'Mitchell Lewis',   age: 32, city: 'Sydney',      gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Professional', nationality: 'Australian', languages: ['English'],                 raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-40', roleId: 'survivor-new-castaways', name: 'Zoe Patterson',    age: 28, city: 'Melbourne',   gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'good', 'lara-khan': 'good' } },
  { id: 'surv-41', roleId: 'survivor-new-castaways', name: 'Jake Phillips',    age: 30, city: 'Brisbane',    gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Athlete',    nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'julie-cohen': 'good' } },
  { id: 'surv-42', roleId: 'survivor-new-castaways', name: 'Amelia Wong',      age: 27, city: 'Gold Coast',  gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English', 'Cantonese'],    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  // no-go (15)
  { id: 'surv-43', roleId: 'survivor-new-castaways', name: 'Declan Moore',     age: 34, city: 'Sydney',      gender: 'M', status: 'no-go',       good: 1, maybe: 1, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },

  // ── Survivor US — Contestant 4 (Superfan) ─────────────────────────────────
  { id: 'surv-c4-1',  roleId: 'survivor-c04', name: 'Jamie Nguyen',       age: 27, city: 'Los Angeles',  gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-c4-2',  roleId: 'survivor-c04', name: 'Marcus Bell',        age: 33, city: 'Chicago',      gender: 'M', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-c4-3',  roleId: 'survivor-c04', name: 'Lena Kowalski',      age: 29, city: 'New York',     gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English', 'Polish'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'surv-c4-4',  roleId: 'survivor-c04', name: 'Derek Osei',         age: 31, city: 'Atlanta',      gender: 'M', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/karim-belkacem.jpg',experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-c4-5',  roleId: 'survivor-c04', name: 'Priya Menon',        age: 25, city: 'Houston',      gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English', 'Tamil'],      raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-c4-6',  roleId: 'survivor-c04', name: 'Sam Harrington',     age: 38, city: 'Seattle',      gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'surv-c4-7',  roleId: 'survivor-c04', name: 'Alicia Ferreira',    age: 42, city: 'Miami',        gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English', 'Spanish'],    raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-c4-8',  roleId: 'survivor-c04', name: 'Tyler Ross',         age: 24, city: 'Denver',       gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English'] },
  { id: 'surv-c4-9',  roleId: 'survivor-c04', name: 'Hannah Okafor',      age: 36, city: 'Dallas',       gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lucie-fontaine.jpg',experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English'] },
  { id: 'surv-c4-10', roleId: 'survivor-c04', name: 'Brandon Lee',        age: 28, city: 'Phoenix',      gender: 'M', status: 'no-go',       good: 0, maybe: 1, no: 3, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Superfan',     nationality: 'American',   languages: ['English'],               raterVotes: { 'lara-khan': 'no', 'eden-tov': 'no' } },

  // ── Survivor US — Contestant 5 (Athlete) ──────────────────────────────────
  { id: 'surv-c5-1',  roleId: 'survivor-c05', name: 'Jordan Hayes',       age: 26, city: 'Los Angeles',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-c5-2',  roleId: 'survivor-c05', name: 'Serena Walsh',       age: 29, city: 'Chicago',      gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'good' } },
  { id: 'surv-c5-3',  roleId: 'survivor-c05', name: 'Malik Johnson',      age: 32, city: 'Houston',      gender: 'M', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'surv-c5-4',  roleId: 'survivor-c05', name: 'Clara Santos',       age: 30, city: 'Miami',        gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English', 'Spanish'],    raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-c5-5',  roleId: 'survivor-c05', name: 'Ryan Park',          age: 27, city: 'Seattle',      gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/karim-belkacem.jpg',experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English', 'Korean'],     raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'good' } },
  { id: 'surv-c5-6',  roleId: 'survivor-c05', name: 'Naomi Trent',        age: 34, city: 'Atlanta',      gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'julie-cohen': 'maybe' } },
  { id: 'surv-c5-7',  roleId: 'survivor-c05', name: 'Cole Rivera',        age: 23, city: 'Dallas',       gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English', 'Spanish'],    raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-c5-8',  roleId: 'survivor-c05', name: 'Faye Nakamura',      age: 28, city: 'San Francisco',gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English', 'Japanese'] },
  { id: 'surv-c5-9',  roleId: 'survivor-c05', name: 'Conor Blake',        age: 35, city: 'Boston',       gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English'] },
  { id: 'surv-c5-10', roleId: 'survivor-c05', name: 'Diana Cruz',         age: 31, city: 'Phoenix',      gender: 'F', status: 'no-go',       good: 0, maybe: 1, no: 2, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Athlete',      nationality: 'American',   languages: ['English', 'Spanish'],    raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },

  // ── Survivor US — Contestant 6 (Underdog) ─────────────────────────────────
  { id: 'surv-c6-1',  roleId: 'survivor-c06', name: 'Bea Morrison',       age: 52, city: 'Nashville',    gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-c6-2',  roleId: 'survivor-c06', name: 'Leo Abara',          age: 22, city: 'New York',     gender: 'M', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English', 'Yoruba'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-c6-3',  roleId: 'survivor-c06', name: 'Meg Sullivan',       age: 48, city: 'Denver',       gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/lucie-fontaine.jpg',experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-c6-4',  roleId: 'survivor-c06', name: 'Gil Torres',         age: 40, city: 'San Antonio',  gender: 'M', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English', 'Spanish'],    raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-c6-5',  roleId: 'survivor-c06', name: 'Kim Zhao',           age: 37, city: 'Los Angeles',  gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English', 'Mandarin'],   raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'surv-c6-6',  roleId: 'survivor-c06', name: 'Noah Petrov',        age: 44, city: 'Chicago',      gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English', 'Russian'],    raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'surv-c6-7',  roleId: 'survivor-c06', name: 'Iris Osei',          age: 26, city: 'Atlanta',      gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English'] },
  { id: 'surv-c6-8',  roleId: 'survivor-c06', name: 'Alan Park',          age: 59, city: 'Seattle',      gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English', 'Korean'] },
  { id: 'surv-c6-9',  roleId: 'survivor-c06', name: 'Tia Carvalho',       age: 31, city: 'Miami',        gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English', 'Portuguese'] },
  { id: 'surv-c6-10', roleId: 'survivor-c06', name: 'Oscar Dahl',         age: 33, city: 'Minneapolis',  gender: 'M', status: 'no-go',       good: 0, maybe: 0, no: 3, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Amateur',      nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'no', 'eden-tov': 'no', 'lara-khan': 'no' } },

  // ── Survivor US — Contestant 7 (Strategist) ───────────────────────────────
  { id: 'surv-c7-1',  roleId: 'survivor-c07', name: 'Ava Sterling',       age: 35, city: 'New York',     gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Professional', nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-c7-2',  roleId: 'survivor-c07', name: 'Daniel Kwon',        age: 30, city: 'Los Angeles',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg',experienceLevel: 'Professional', nationality: 'American',   languages: ['English', 'Korean'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-c7-3',  roleId: 'survivor-c07', name: 'Fiona Gates',        age: 28, city: 'Chicago',      gender: 'F', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Professional', nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'surv-c7-4',  roleId: 'survivor-c07', name: 'Hugo Leclerc',       age: 43, city: 'Miami',        gender: 'M', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Professional', nationality: 'American',   languages: ['English', 'French'],     raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  { id: 'surv-c7-5',  roleId: 'survivor-c07', name: 'Imani Brooks',       age: 26, city: 'Atlanta',      gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Professional', nationality: 'American',   languages: ['English'],               raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'surv-c7-6',  roleId: 'survivor-c07', name: 'Ethan Fong',         age: 32, city: 'San Francisco',gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Professional', nationality: 'American',   languages: ['English', 'Mandarin'],   raterVotes: { 'peter-known': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-c7-7',  roleId: 'survivor-c07', name: 'Nina Vasquez',       age: 39, city: 'Houston',      gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Professional', nationality: 'American',   languages: ['English', 'Spanish'],    raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-c7-8',  roleId: 'survivor-c07', name: 'Max Decker',         age: 41, city: 'Denver',       gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Professional', nationality: 'American',   languages: ['English'] },
  { id: 'surv-c7-9',  roleId: 'survivor-c07', name: 'Priya Sundaram',     age: 27, city: 'Dallas',       gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Professional', nationality: 'American',   languages: ['English', 'Tamil'] },
  { id: 'surv-c7-10', roleId: 'survivor-c07', name: 'Sam Volkov',         age: 46, city: 'Seattle',      gender: 'M', status: 'no-go',       good: 0, maybe: 1, no: 2, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Professional', nationality: 'American',   languages: ['English', 'Russian'],    raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'surv-44', roleId: 'survivor-new-castaways', name: 'Abbey Richardson', age: 27, city: 'Melbourne',   gender: 'F', status: 'no-go',       good: 1, maybe: 1, no: 2, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'surv-45', roleId: 'survivor-new-castaways', name: 'Tom Sullivan',     age: 29, city: 'Brisbane',    gender: 'M', status: 'no-go',       good: 0, maybe: 2, no: 2, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Athlete',     nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'julie-cohen': 'no' } },
  { id: 'surv-46', roleId: 'survivor-new-castaways', name: 'Madison Clarke',   age: 28, city: 'Perth',       gender: 'F', status: 'no-go',       good: 1, maybe: 0, no: 3, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English'],                 raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'surv-47', roleId: 'survivor-new-castaways', name: 'Kyle Jenkins',     age: 33, city: 'Adelaide',    gender: 'M', status: 'no-go',       good: 1, maybe: 1, no: 2, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'lara-khan': 'maybe' } },
  { id: 'surv-48', roleId: 'survivor-new-castaways', name: 'Ella Bailey',      age: 26, city: 'Sydney',      gender: 'F', status: 'no-go',       good: 0, maybe: 2, no: 2, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },
  { id: 'surv-49', roleId: 'survivor-new-castaways', name: 'Ben Harrison',     age: 30, city: 'Melbourne',   gender: 'M', status: 'no-go',       good: 1, maybe: 1, no: 2, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Athlete',    nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'eden-tov': 'maybe' } },
  { id: 'surv-50', roleId: 'survivor-new-castaways', name: 'Sarah Park',       age: 27, city: 'Brisbane',    gender: 'F', status: 'no-go',       good: 0, maybe: 1, no: 3, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English', 'Korean'],       raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'surv-51', roleId: 'survivor-new-castaways', name: 'Adam Phillips',    age: 32, city: 'Cairns',      gender: 'M', status: 'no-go',       good: 1, maybe: 1, no: 2, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Amateur',     nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'surv-52', roleId: 'survivor-new-castaways', name: 'Jessica Walker',   age: 25, city: 'Gold Coast',  gender: 'F', status: 'no-go',       good: 0, maybe: 2, no: 2, avatar: '/avatars/hannah-levy.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'julie-cohen': 'no', 'eden-tov': 'no' } },
  { id: 'surv-53', roleId: 'survivor-new-castaways', name: 'Nathan Reed',      age: 29, city: 'Hobart',      gender: 'M', status: 'no-go',       good: 1, maybe: 0, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'surv-54', roleId: 'survivor-new-castaways', name: 'Megan Foster',     age: 27, city: 'Darwin',      gender: 'F', status: 'no-go',       good: 1, maybe: 1, no: 2, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English'],                 raterVotes: { 'eden-tov': 'no', 'julie-cohen': 'maybe' } },
  { id: 'surv-55', roleId: 'survivor-new-castaways', name: 'James Campbell',   age: 31, city: 'Sydney',      gender: 'M', status: 'no-go',       good: 0, maybe: 2, no: 3, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Amateur',     nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'surv-56', roleId: 'survivor-new-castaways', name: 'Ashley Morgan',    age: 28, city: 'Melbourne',   gender: 'F', status: 'no-go',       good: 1, maybe: 0, no: 3, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Amateur',     nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'surv-57', roleId: 'survivor-new-castaways', name: 'Tristan Cole',     age: 30, city: 'Brisbane',    gender: 'M', status: 'no-go',       good: 1, maybe: 1, no: 2, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'julie-cohen': 'no' } },
  // new (8)
  { id: 'surv-58', roleId: 'survivor-new-castaways', name: 'Lexi Turner',      age: 24, city: 'Sydney',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'] },
  { id: 'surv-59', roleId: 'survivor-new-castaways', name: 'Oscar Martin',     age: 27, city: 'Melbourne',   gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Athlete',     nationality: 'Australian', languages: ['English'] },
  { id: 'surv-60', roleId: 'survivor-new-castaways', name: 'Paige Williams',   age: 25, city: 'Brisbane',    gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English'] },
  { id: 'surv-61', roleId: 'survivor-new-castaways', name: 'Kai Robinson',     age: 29, city: 'Perth',       gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Amateur',     nationality: 'Australian', languages: ['English'] },
  { id: 'surv-62', roleId: 'survivor-new-castaways', name: 'Ruby Davidson',    age: 23, city: 'Adelaide',    gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Amateur',      nationality: 'Australian', languages: ['English'] },
  { id: 'surv-63', roleId: 'survivor-new-castaways', name: 'Fletcher Hayes',   age: 31, city: 'Sydney',      gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Professional', nationality: 'Australian', languages: ['English'] },
  { id: 'surv-64', roleId: 'survivor-new-castaways', name: 'Piper Nguyen',     age: 26, city: 'Gold Coast',  gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Social Media', nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'surv-65', roleId: 'survivor-new-castaways', name: 'Cody Burns',       age: 28, city: 'Darwin',      gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Athlete',      nationality: 'Australian', languages: ['English'] },

  // ── Survivor Australia — survivor-returning-legends ──────────────────────────
  // cast (4)
  { id: 'surv-66', roleId: 'survivor-returning-legends', name: 'Amanda Weston',  age: 38, city: 'Sydney',     gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/sarah-lefevre.jpg', experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-67', roleId: 'survivor-returning-legends', name: 'Chris Nguyen',   age: 41, city: 'Melbourne',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'surv-68', roleId: 'survivor-returning-legends', name: 'Paula Fernandez',age: 36, city: 'Brisbane',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Spanish'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-69', roleId: 'survivor-returning-legends', name: 'Danny Clarke',   age: 43, city: 'Perth',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Returning', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  // callback (2)
  { id: 'surv-70', roleId: 'survivor-returning-legends', name: 'Vanessa Lin',    age: 39, city: 'Sydney',     gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-71', roleId: 'survivor-returning-legends', name: 'Michael Torres', age: 44, city: 'Melbourne',  gender: 'M', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Returning', nationality: 'Australian', languages: ['English', 'Spanish'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  // shortlisted (12)
  { id: 'surv-72', roleId: 'survivor-returning-legends', name: 'Rebecca Walsh',  age: 37, city: 'Adelaide',   gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/hannah-levy.jpg',   experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'surv-73', roleId: 'survivor-returning-legends', name: 'Steve Parker',   age: 42, city: 'Gold Coast', gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-74', roleId: 'survivor-returning-legends', name: 'Nicole Pham',    age: 35, city: 'Cairns',     gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-75', roleId: 'survivor-returning-legends', name: 'Greg Morrison',  age: 40, city: 'Sydney',     gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'surv-76', roleId: 'survivor-returning-legends', name: 'Lisa Anderson',  age: 38, city: 'Melbourne',  gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-77', roleId: 'survivor-returning-legends', name: 'Ben Kaur',       age: 43, city: 'Brisbane',   gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Punjabi'],      raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-78', roleId: 'survivor-returning-legends', name: 'Michelle Zhang', age: 36, city: 'Perth',      gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'surv-79', roleId: 'survivor-returning-legends', name: 'Tony Ross',      age: 45, city: 'Sydney',     gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Returning', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'surv-80', roleId: 'survivor-returning-legends', name: 'Karen Hunt',     age: 39, city: 'Melbourne',  gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  { id: 'surv-81', roleId: 'survivor-returning-legends', name: 'Peter Hamilton', age: 41, city: 'Hobart',     gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Returning', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'surv-82', roleId: 'survivor-returning-legends', name: 'Diane Russo',    age: 37, city: 'Adelaide',   gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'good' } },
  { id: 'surv-83', roleId: 'survivor-returning-legends', name: 'Mark Nguyen',    age: 44, city: 'Darwin',     gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'good' } },
  // no-go (5)
  { id: 'surv-84', roleId: 'survivor-returning-legends', name: 'Sandra White',   age: 38, city: 'Brisbane',   gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'surv-85', roleId: 'survivor-returning-legends', name: 'Kevin Brown',    age: 43, city: 'Sydney',     gender: 'M', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'eden-tov': 'no' } },
  { id: 'surv-86', roleId: 'survivor-returning-legends', name: 'Helen Li',       age: 36, city: 'Melbourne',  gender: 'F', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'surv-87', roleId: 'survivor-returning-legends', name: 'Frank Martinez', age: 45, city: 'Perth',      gender: 'M', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'surv-88', roleId: 'survivor-returning-legends', name: 'Tina Zhou',      age: 40, city: 'Gold Coast', gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 3, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },
  // new (2)
  { id: 'surv-89', roleId: 'survivor-returning-legends', name: 'Dean O\'Brien',  age: 39, city: 'Cairns',     gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Returning', nationality: 'Australian', languages: ['English'] },
  { id: 'surv-90', roleId: 'survivor-returning-legends', name: 'Mandy Roberts',  age: 37, city: 'Townsville', gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Returning',  nationality: 'Australian', languages: ['English'] },

  // ── Survivor Australia — survivor-host-standin ───────────────────────────────
  { id: 'surv-91', roleId: 'survivor-host-standin', name: 'Will Pemberton',   age: 45, city: 'Sydney',     gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English'],           raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'surv-92', roleId: 'survivor-host-standin', name: 'Sandra Kim',       age: 40, city: 'Melbourne',  gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/sarah-liu.jpg',      experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English', 'Korean'],  raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'surv-93', roleId: 'survivor-host-standin', name: 'Anthony Daly',     age: 43, city: 'Brisbane',   gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English'],           raterVotes: { 'eden-tov': 'good', 'lara-khan': 'good' } },
  { id: 'surv-94', roleId: 'survivor-host-standin', name: 'Lisa Chen',        age: 38, city: 'Sydney',     gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English', 'Mandarin'], raterVotes: { 'peter-known': 'good', 'lara-khan': 'maybe' } },
  { id: 'surv-95', roleId: 'survivor-host-standin', name: 'David Nguyen',     age: 44, city: 'Perth',      gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'surv-96', roleId: 'survivor-host-standin', name: 'Angela Russo',     age: 41, city: 'Adelaide',   gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English'] },
  { id: 'surv-97', roleId: 'survivor-host-standin', name: 'Paul Morrison',    age: 47, city: 'Gold Coast',  gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English'] },
  { id: 'surv-98', roleId: 'survivor-host-standin', name: 'Teresa Singh',     age: 39, city: 'Darwin',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English', 'Hindi'] },
  { id: 'surv-99', roleId: 'survivor-host-standin', name: 'Marcus Cole',      age: 42, city: 'Cairns',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English'] },
  { id: 'surv-100',roleId: 'survivor-host-standin', name: 'Jennifer Tam',     age: 40, city: 'Hobart',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Broadcaster', nationality: 'Australian', languages: ['English', 'Cantonese'] },

  // ── MasterChef Australia — masterchef-home-cooks ─────────────────────────────
  // cast (18)
  { id: 'mc-1',  roleId: 'mc17-c05', name: 'Emma Rossi',       age: 34, city: 'Melbourne',   gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-2',  roleId: 'mc17-c05', name: 'Daniel Wong',      age: 29, city: 'Sydney',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Cantonese'],    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-3',  roleId: 'mc17-c05', name: 'Sarah Patel',      age: 42, city: 'Brisbane',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Hindi'],        raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-4',  roleId: 'mc17-c05', name: 'James Liu',        age: 37, city: 'Perth',       gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-5',  roleId: 'mc17-c05', name: 'Olivia McCarthy',  age: 31, city: 'Adelaide',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-6',  roleId: 'mc17-c05', name: 'Anthony Nguyen',   age: 45, city: 'Melbourne',   gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-7',  roleId: 'mc17-c05', name: 'Lucy Chen',        age: 28, city: 'Gold Coast',  gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-8',  roleId: 'mc17-c05', name: 'Mark Thompson',    age: 52, city: 'Sydney',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-9',  roleId: 'mc17-c05', name: 'Priya Sharma',     age: 38, city: 'Brisbane',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Hindi'],        raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-10',  roleId: 'mc17-c05', name: 'Tom Nguyen',       age: 33, city: 'Melbourne',   gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-11',  roleId: 'mc17-c01', name: 'Grace Papadopoulos',age: 46, city: 'Adelaide',  gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Greek'],        raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-12',  roleId: 'mc17-c01', name: 'Ben Robinson',     age: 27, city: 'Perth',       gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-13',  roleId: 'mc17-c01', name: 'Maria Santos',     age: 55, city: 'Sydney',      gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Filipino'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-14',  roleId: 'mc17-c01', name: 'Jake Tran',        age: 30, city: 'Gold Coast',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-15',  roleId: 'mc17-c01', name: 'Sofia Kaur',       age: 41, city: 'Melbourne',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/hannah-levy.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Punjabi'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-16',  roleId: 'mc17-c01', name: 'Nathan Berry',     age: 35, city: 'Cairns',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-17',  roleId: 'mc17-c01', name: 'Chloe Williams',   age: 26, city: 'Brisbane',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-18',  roleId: 'mc17-c01', name: 'Pierre Dubois',    age: 48, city: 'Sydney',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook', nationality: 'French',     languages: ['English', 'French'],       raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  // callback (3)
  { id: 'mc-19',  roleId: 'mc17-c01', name: 'Yasmin Haddad',    age: 36, city: 'Melbourne',   gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Arabic'],       raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-20',  roleId: 'mc17-c01', name: 'Kevin Lee',        age: 43, city: 'Sydney',      gender: 'M', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Cantonese'],    raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  { id: 'mc-21',  roleId: 'mc17-c02', name: 'Isabelle Nguyen',  age: 31, city: 'Brisbane',    gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  // shortlisted (12)
  { id: 'mc-22',  roleId: 'mc17-c02', name: 'Hamish Murray',    age: 39, city: 'Perth',       gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'mc-23',  roleId: 'mc17-c02', name: 'Rachel Kim',       age: 33, city: 'Adelaide',    gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/sarah-lefevre.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Korean'],       raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-24',  roleId: 'mc17-c02', name: 'Chris Vo',         age: 47, city: 'Melbourne',   gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-25',  roleId: 'mc17-c02', name: 'Amy Anderson',     age: 29, city: 'Gold Coast',  gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'mc-26',  roleId: 'mc17-c02', name: 'Sam Russo',        age: 38, city: 'Sydney',      gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'mc-27',  roleId: 'mc17-c02', name: 'Monica Zhang',     age: 44, city: 'Brisbane',    gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  { id: 'mc-28',  roleId: 'mc17-c02', name: 'Nico Papadopoulos',age: 35, city: 'Melbourne',   gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Greek'],        raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'mc-29',  roleId: 'mc17-c02', name: 'Penny Walsh',      age: 52, city: 'Cairns',      gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-30',  roleId: 'mc17-c02', name: 'Tyler Nguyen',     age: 28, city: 'Hobart',      gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-31',  roleId: 'mc17-c03', name: 'Angela Tran',      age: 40, city: 'Darwin',      gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'mc-32',  roleId: 'mc17-c03', name: 'Liam Carter',      age: 36, city: 'Sydney',      gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'mc-33',  roleId: 'mc17-c03', name: 'Donna Roberts',    age: 47, city: 'Gold Coast',  gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  // no-go (20)
  { id: 'mc-34',  roleId: 'mc17-c03', name: 'Brendan Murphy',   age: 41, city: 'Melbourne',   gender: 'M', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-35',  roleId: 'mc17-c03', name: 'Christine Park',   age: 34, city: 'Sydney',      gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/lola-mercier.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Korean'],       raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'mc-36',  roleId: 'mc17-c03', name: 'Gary Sullivan',    age: 58, city: 'Brisbane',    gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'mc-37',  roleId: 'mc17-c03', name: 'Helen Zhou',       age: 45, city: 'Perth',       gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'eden-tov': 'no', 'julie-cohen': 'no' } },
  { id: 'mc-38',  roleId: 'mc17-c03', name: 'Ian Collins',      age: 37, city: 'Adelaide',    gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'eden-tov': 'maybe' } },
  { id: 'mc-39',  roleId: 'mc17-c03', name: 'Janet Evans',      age: 52, city: 'Melbourne',   gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-40',  roleId: 'mc17-c03', name: 'Ken Nguyen',       age: 44, city: 'Gold Coast',  gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'mc-41',  roleId: 'mc17-c05', name: 'Linda Walsh',      age: 39, city: 'Sydney',      gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 3, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },
  { id: 'mc-42',  roleId: 'mc17-c05', name: 'Mike Thompson',    age: 55, city: 'Brisbane',    gender: 'M', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'eden-tov': 'no' } },
  { id: 'mc-43',  roleId: 'mc17-c05', name: 'Nancy Chen',       age: 48, city: 'Cairns',      gender: 'F', status: 'no-go', good: 0, maybe: 1, no: 3, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Cantonese'],    raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-44',  roleId: 'mc17-c05', name: 'Owen Hardy',       age: 35, city: 'Melbourne',   gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 2, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'mc-45',  roleId: 'mc17-c05', name: 'Patricia Lee',     age: 61, city: 'Hobart',      gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'julie-cohen': 'no' } },
  { id: 'mc-46',  roleId: 'mc17-c05', name: 'Quentin Russo',    age: 42, city: 'Darwin',      gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'peter-known': 'no', 'eden-tov': 'maybe' } },
  { id: 'mc-47',  roleId: 'mc17-c05', name: 'Rose Pham',        age: 37, city: 'Sydney',      gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/hannah-levy.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-48',  roleId: 'mc17-c05', name: 'Simon Davis',      age: 50, city: 'Melbourne',   gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'mc-49',  roleId: 'mc17-c05', name: 'Tanya Morrison',   age: 43, city: 'Brisbane',    gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },
  { id: 'mc-50',  roleId: 'mc17-c05', name: 'Victor Singh',     age: 38, city: 'Perth',       gender: 'M', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Punjabi'],      raterVotes: { 'eden-tov': 'no', 'julie-cohen': 'no' } },
  { id: 'mc-51',  roleId: 'mc17-c01', name: 'Wendy Clarke',     age: 56, city: 'Gold Coast',  gender: 'F', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'eden-tov': 'no' } },
  { id: 'mc-52',  roleId: 'mc17-c01', name: 'Xavier Haddad',    age: 33, city: 'Cairns',      gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 3, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Arabic'],       raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-53',  roleId: 'mc17-c01', name: 'Yvonne Liu',       age: 47, city: 'Sydney',      gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  // new (17)
  { id: 'mc-54',  roleId: 'mc17-c01', name: 'Andrew Nguyen',    age: 31, city: 'Melbourne',   gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'mc-55',  roleId: 'mc17-c01', name: 'Bethany Ross',     age: 27, city: 'Sydney',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'] },
  { id: 'mc-56',  roleId: 'mc17-c01', name: 'Carlos Santos',    age: 39, city: 'Brisbane',    gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Filipino'] },
  { id: 'mc-57',  roleId: 'mc17-c01', name: 'Diana Kim',        age: 33, city: 'Perth',       gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Korean'] },
  { id: 'mc-58',  roleId: 'mc17-c01', name: 'Edward Tran',      age: 45, city: 'Adelaide',    gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'mc-59',  roleId: 'mc17-c01', name: 'Fiona Brown',      age: 28, city: 'Gold Coast',  gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'] },
  { id: 'mc-60',  roleId: 'mc17-c01', name: 'George Chen',      age: 52, city: 'Melbourne',   gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Cantonese'] },
  { id: 'mc-61',  roleId: 'mc17-c02', name: 'Harriet Wong',     age: 36, city: 'Darwin',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Cantonese'] },
  { id: 'mc-62',  roleId: 'mc17-c02', name: 'Ivan Patel',       age: 41, city: 'Cairns',      gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Hindi'] },
  { id: 'mc-63',  roleId: 'mc17-c02', name: 'Julia Martinez',   age: 29, city: 'Sydney',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/lola-mercier.jpg',   experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Spanish'] },
  { id: 'mc-64',  roleId: 'mc17-c02', name: 'Karl Nguyen',      age: 47, city: 'Hobart',      gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'mc-65',  roleId: 'mc17-c02', name: 'Lorraine Russo',   age: 55, city: 'Brisbane',    gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Italian'] },
  { id: 'mc-66',  roleId: 'mc17-c02', name: 'Martin Liu',       age: 34, city: 'Perth',       gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'] },
  { id: 'mc-67',  roleId: 'mc17-c02', name: 'Natalie Clarke',   age: 30, city: 'Melbourne',   gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'] },
  { id: 'mc-68',  roleId: 'mc17-c02', name: 'Paul Haddad',      age: 43, city: 'Gold Coast',  gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Arabic'] },
  { id: 'mc-69',  roleId: 'mc17-c02', name: 'Quinn Anderson',   age: 26, city: 'Cairns',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'] },
  { id: 'mc-70',  roleId: 'mc17-c02', name: 'Robert Tran',      age: 57, city: 'Sydney',      gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'] },

  // ── MasterChef Australia — masterchef-junior ─────────────────────────────────
  // cast (6)
  { id: 'mc-71',  roleId: 'mc17-c03', name: 'Zara Mitchell',   age: 14, city: 'Sydney',     gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-72',  roleId: 'mc17-c03', name: 'Luca Russo',      age: 13, city: 'Melbourne',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Italian'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-73',  roleId: 'mc17-c03', name: 'Aisha Patel',     age: 15, city: 'Brisbane',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Hindi'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-74',  roleId: 'mc17-c03', name: 'Oliver Chen',     age: 12, city: 'Perth',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Junior', nationality: 'Australian', languages: ['English', 'Mandarin'],  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-75',  roleId: 'mc17-c03', name: 'Sophie Nguyen',   age: 14, city: 'Adelaide',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Vietnamese'], raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-76',  roleId: 'mc17-c03', name: 'Ethan Wong',      age: 13, city: 'Gold Coast', gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Cantonese'],  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  // callback (1)
  { id: 'mc-77',  roleId: 'mc17-c03', name: 'Ruby Taylor',     age: 15, city: 'Sydney',     gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  // shortlisted (5)
  { id: 'mc-78',  roleId: 'mc17-c03', name: 'Kai Thompson',    age: 14, city: 'Melbourne',  gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'mc-79',  roleId: 'mc17-c03', name: 'Mia Haddad',      age: 13, city: 'Brisbane',   gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Arabic'],    raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-80',  roleId: 'mc17-c03', name: 'Charlie Ross',    age: 15, city: 'Perth',      gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'mc-81',  roleId: 'mc17-c04', name: 'Lily Zhang',      age: 14, city: 'Adelaide',   gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Mandarin'],  raterVotes: { 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  { id: 'mc-82',  roleId: 'mc17-c04', name: 'Felix Nguyen',    age: 12, city: 'Cairns',     gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Vietnamese'], raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  // no-go (5)
  { id: 'mc-83',  roleId: 'mc17-c04', name: 'Emma Clarke',     age: 15, city: 'Gold Coast', gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-84',  roleId: 'mc17-c04', name: 'Lucas Singh',     age: 13, city: 'Sydney',     gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 2, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Hindi'],     raterVotes: { 'peter-known': 'no', 'eden-tov': 'no' } },
  { id: 'mc-85',  roleId: 'mc17-c04', name: 'Ava Morrison',    age: 14, city: 'Melbourne',  gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-86',  roleId: 'mc17-c04', name: 'Jasper Liu',      age: 15, city: 'Brisbane',   gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Mandarin'],  raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'mc-87',  roleId: 'mc17-c04', name: 'Nora Tran',       age: 13, city: 'Perth',      gender: 'F', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Vietnamese'], raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },
  // new (3)
  { id: 'mc-88',  roleId: 'mc17-c04', name: 'Billy Chen',      age: 14, city: 'Darwin',     gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Junior', nationality: 'Australian', languages: ['English', 'Cantonese'] },
  { id: 'mc-89',  roleId: 'mc17-c04', name: 'Zoe Russo',       age: 12, city: 'Hobart',     gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Junior', nationality: 'Australian', languages: ['English', 'Italian'] },
  { id: 'mc-90',  roleId: 'mc17-c04', name: 'Noah Patel',      age: 15, city: 'Cairns',     gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Junior', nationality: 'Australian', languages: ['English', 'Hindi'] },

  // ── MasterChef Australia — masterchef-guest-mentors ──────────────────────────
  // shortlisted (3)
  { id: 'mc-91',  roleId: 'mc17-c05', name: 'Marco Russo',     age: 48, city: 'Sydney',     gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Italian'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'mc-92',  roleId: 'mc17-c05', name: 'Julia Nguyen',    age: 43, city: 'Melbourne',  gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Vietnamese'], raterVotes: { 'peter-known': 'maybe', 'julie-cohen': 'good' } },
  { id: 'mc-93',  roleId: 'mc17-c05', name: 'David Chen',      age: 52, city: 'Brisbane',   gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Mandarin'],  raterVotes: { 'eden-tov': 'good', 'lara-khan': 'good' } },
  // no-go (2)
  { id: 'mc-94',  roleId: 'mc17-c05', name: 'Sandra Park',     age: 45, city: 'Perth',      gender: 'F', status: 'no-go', good: 1, maybe: 0, no: 2, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Korean'],    raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-95',  roleId: 'mc17-c05', name: 'Paul Martinez',   age: 55, city: 'Sydney',     gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'TV Personality',    nationality: 'Australian', languages: ['English'],               raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  // new (5)
  { id: 'mc-96',  roleId: 'mc17-c05', name: 'Helena Tran',     age: 41, city: 'Melbourne',  gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'mc-97',  roleId: 'mc17-c05', name: 'Rick Harrison',   age: 58, city: 'Gold Coast', gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'TV Personality',    nationality: 'Australian', languages: ['English'] },
  { id: 'mc-98',  roleId: 'mc17-c05', name: 'Yuki Suzuki',     age: 39, city: 'Sydney',     gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Celebrity Chef',    nationality: 'Japanese',   languages: ['English', 'Japanese'] },
  { id: 'mc-99',  roleId: 'mc17-c05', name: 'Frank O\'Brien',  age: 62, city: 'Cairns',     gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English'] },
  { id: 'mc-100',roleId: 'mc17-c05', name: 'Diana Haddad',    age: 46, city: 'Adelaide',   gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'TV Personality',    nationality: 'Australian', languages: ['English', 'Arabic'] },

  // ── MasterChef Australia — Season 17 ────────────────────────────────────────
  // Contestant 1 — selected (cast)
  { id: 's17-1',  roleId: 'mc17-c01', name: 'Sophie Bergmann',   age: 31, city: 'Melbourne',  gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/sophie-bergmann.jpg', video: '/casting-nonscripted/sophie-bergmann.mp4',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'German'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 's17-2',  roleId: 'mc17-c01', name: 'Omar Khalil',       age: 28, city: 'Sydney',     gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/omar-khalil.jpg', video: '/casting-nonscripted/omar-khalil.mp4', experienceLevel: 'Home Cook',   nationality: 'Lebanese',   languages: ['English', 'Arabic'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 's17-3',  roleId: 'mc17-c01', name: 'Priya Suresh',      age: 35, city: 'Brisbane',   gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/priya-suresh.jpg', video: '/casting-nonscripted/priya-suresh.mp4',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Tamil'],       raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  // Contestant 2 — selected (cast)
  { id: 's17-4',  roleId: 'mc17-c02', name: 'Marcus Rivera',     age: 42, city: 'Perth',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marcus-rivera.jpg', video: '/casting-nonscripted/marcus-rivera.mp4', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Spanish'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 's17-5',  roleId: 'mc17-c02', name: 'Lily Nakamura',     age: 26, city: 'Melbourne',  gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/lily-nakamura.jpg', video: '/casting-nonscripted/lily-nakamura.mp4',     experienceLevel: 'Home Cook',   nationality: 'Japanese',   languages: ['English', 'Japanese'],    raterVotes: { 'peter-known': 'good', 'lara-khan': 'maybe' } },
  // Contestant 3 — selected (cast)
  { id: 's17-6',  roleId: 'mc17-c03', name: 'Amara Osei',        age: 38, city: 'Sydney',     gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/amara-osei.jpg', video: '/casting-nonscripted/amara-osei.mp4', experienceLevel: 'Home Cook',   nationality: 'Ghanaian',   languages: ['English', 'Twi'],         raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 's17-7',  roleId: 'mc17-c03', name: 'Jake Thornton',     age: 33, city: 'Adelaide',   gender: 'M', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/jake-thornton.jpg', video: '/casting-nonscripted/jake-thornton.mp4',experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  // Contestant 4 — selected (cast)
  { id: 's17-8',  roleId: 'mc17-c04', name: 'Chen Wei',          age: 45, city: 'Melbourne',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Chinese',    languages: ['English', 'Mandarin'],    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 's17-9',  roleId: 'mc17-c04', name: 'Francesca Conte',   age: 30, city: 'Sydney',     gender: 'F', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/francesca-conte.jpg', video: '/casting-nonscripted/francesca-conte.mp4',    experienceLevel: 'Home Cook',   nationality: 'Italian',    languages: ['English', 'Italian'],     raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  // Contestant 5 — selected (cast)
  { id: 's17-10', roleId: 'mc17-c05', name: 'Aisha Bello',       age: 29, city: 'Brisbane',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Home Cook',   nationality: 'Nigerian',   languages: ['English', 'Yoruba'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'good' } },
  { id: 's17-11', roleId: 'mc17-c05', name: 'Tom Andreou',       age: 36, city: 'Perth',      gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Greek'],       raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  // Contestant 6 — selected (cast)
  { id: 's17-12', roleId: 'mc17-c01', name: 'Ravi Sharma',       age: 52, city: 'Melbourne',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',   nationality: 'Indian',     languages: ['English', 'Hindi'],       raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 's17-13', roleId: 'mc17-c01', name: 'Nina Kuznetsova',   age: 41, city: 'Sydney',     gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Russian',    languages: ['English', 'Russian'],     raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  // Contestant 7 — open slot (shortlisted candidates)
  { id: 's17-14', roleId: 'mc17-c02', name: 'Ben Cartwright',    age: 24, city: 'Gold Coast', gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 's17-15', roleId: 'mc17-c02', name: 'Maya Delacroix',    age: 33, city: 'Melbourne',  gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Home Cook',   nationality: 'French',     languages: ['English', 'French'],      raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 's17-16', roleId: 'mc17-c02', name: 'Carlos Mendoza',    age: 47, city: 'Sydney',     gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook',  nationality: 'Mexican',    languages: ['English', 'Spanish'],     raterVotes: { 'eden-tov': 'good', 'lara-khan': 'good' } },
  // Contestant 8 — open slot
  { id: 's17-17', roleId: 'mc17-c03', name: 'Ingrid Lindqvist',  age: 39, city: 'Brisbane',   gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Home Cook',   nationality: 'Swedish',    languages: ['English', 'Swedish'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 's17-18', roleId: 'mc17-c03', name: 'Kwame Asante',      age: 28, city: 'Perth',      gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Ghanaian',   languages: ['English', 'Twi'],         raterVotes: { 'eden-tov': 'maybe', 'lara-khan': 'good' } },
  // Contestant 9 — open slot
  { id: 's17-19', roleId: 'mc17-c04', name: 'Yuki Tanaka',       age: 36, city: 'Melbourne',  gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',   nationality: 'Japanese',   languages: ['English', 'Japanese'] },
  { id: 's17-20', roleId: 'mc17-c04', name: 'Samuel Abara',      age: 31, city: 'Sydney',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',   nationality: 'Nigerian',   languages: ['English'] },
  { id: 's17-21', roleId: 'mc17-c04', name: 'Claire Beaumont',   age: 44, city: 'Adelaide',   gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook',  nationality: 'French',     languages: ['English', 'French'] },
  // Contestant 10 — open slot
  { id: 's17-22', roleId: 'mc17-c05', name: 'Diego Ferreira',    age: 26, city: 'Brisbane',   gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Brazilian',  languages: ['English', 'Portuguese'] },
  { id: 's17-23', roleId: 'mc17-c05', name: 'Helen Papadaki',    age: 53, city: 'Sydney',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Greek',      languages: ['English', 'Greek'] },
  { id: 's17-24', roleId: 'mc17-c05', name: 'Luca Russo',        age: 34, city: 'Melbourne',  gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Italian',    languages: ['English', 'Italian'] },
  // Contestant 1 — additional applicants
  { id: 's17-25', roleId: 'mc17-c01', name: 'James Okafor',      age: 29, city: 'Los Angeles', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/james-okafor.jpg', video: '/casting-nonscripted/james-okafor.mp4',    experienceLevel: 'Home Cook',   nationality: 'American',   languages: ['English'] },
  { id: 's17-26', roleId: 'mc17-c01', name: 'Sophie Tremblay',   age: 42, city: 'Chicago',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/sophie-tremblay.jpg', video: '/casting-nonscripted/sophie-tremblay.mp4', experienceLevel: 'Home Cook',  nationality: 'American',   languages: ['English', 'French'] },
  { id: 's17-27', roleId: 'mc17-c01', name: 'Marco Delgado',     age: 55, city: 'Miami',       gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marco-delgado.jpg', video: '/casting-nonscripted/marco-delgado.mp4', experienceLevel: 'Home Cook',  nationality: 'Cuban',      languages: ['English', 'Spanish'] },
  { id: 's17-28', roleId: 'mc17-c01', name: 'Amelia Park',       age: 33, city: 'New York',    gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/amelia-park.jpg', video: '/casting-nonscripted/amelia-park.mp4',     experienceLevel: 'Home Cook',  nationality: 'Korean',     languages: ['English', 'Korean'] },
  { id: 's17-29', roleId: 'mc17-c01', name: 'David Chen',        age: 47, city: 'San Francisco',gender: 'M', status: 'new',        good: 0, maybe: 0, no: 0, avatar: '/avatars/david-chen.jpg', video: '/casting-nonscripted/david-chen.mp4',experienceLevel: 'Home Cook',  nationality: 'Taiwanese',  languages: ['English', 'Mandarin'] },
  { id: 's17-30', roleId: 'mc17-c01', name: 'Layla Hassan',      age: 38, city: 'Houston',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/layla-hassan.jpg', video: '/casting-nonscripted/layla-hassan.mp4',   experienceLevel: 'Home Cook',  nationality: 'Lebanese',   languages: ['English', 'Arabic'] },
  { id: 's17-31', roleId: 'mc17-c01', name: 'Tom Bradley',       age: 26, city: 'Nashville',   gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/tom-bradley.jpg', video: '/casting-nonscripted/tom-bradley.mp4',  experienceLevel: 'Home Cook',  nationality: 'American',   languages: ['English'] },
  // Contestant 2 — additional applicants
  { id: 's17-32', roleId: 'mc17-c02', name: 'Grace Osei',        age: 36, city: 'Atlanta',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/grace-osei.jpg', video: '/casting-nonscripted/grace-osei.mp4',   experienceLevel: 'Home Cook',  nationality: 'Ghanaian',   languages: ['English', 'Twi'] },
  { id: 's17-33', roleId: 'mc17-c02', name: 'Pablo Herrera',     age: 44, city: 'Dallas',      gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/pablo-herrera.jpg', video: '/casting-nonscripted/pablo-herrera.mp4', experienceLevel: 'Home Cook',  nationality: 'Mexican',    languages: ['English', 'Spanish'] },
  { id: 's17-34', roleId: 'mc17-c02', name: 'Mei Lin Zhou',      age: 31, city: 'Los Angeles', gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/mei-lin-zhou.jpg', video: '/casting-nonscripted/mei-lin-zhou.mp4',   experienceLevel: 'Home Cook',  nationality: 'Chinese',    languages: ['English', 'Cantonese'] },
  { id: 's17-35', roleId: 'mc17-c02', name: 'Aaron Willis',      age: 52, city: 'New Orleans', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/aaron-willis.jpg', video: '/casting-nonscripted/aaron-willis.mp4',experienceLevel: 'Home Cook', nationality: 'American',   languages: ['English'] },
  { id: 's17-36', roleId: 'mc17-c02', name: 'Priya Nair',        age: 28, city: 'Chicago',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/priya-nair.jpg', video: '/casting-nonscripted/priya-nair.mp4',   experienceLevel: 'Home Cook',  nationality: 'Indian',     languages: ['English', 'Malayalam'] },
  { id: 's17-37', roleId: 'mc17-c02', name: 'Stefan Kowalski',   age: 41, city: 'Chicago',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',  nationality: 'Polish',     languages: ['English', 'Polish'] },
  { id: 's17-38', roleId: 'mc17-c02', name: 'Rosa Pereira',      age: 35, city: 'Miami',       gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/rosa-pereira.jpg', video: '/casting-nonscripted/rosa-pereira.mp4',  experienceLevel: 'Home Cook',  nationality: 'Brazilian',  languages: ['English', 'Portuguese'] },
  { id: 's17-39', roleId: 'mc17-c02', name: 'Derek Owusu',       age: 24, city: 'Houston',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'American',   languages: ['English'] },
  // Contestant 3 — additional applicants
  { id: 's17-40', roleId: 'mc17-c03', name: 'Nadia Johansson',   age: 39, city: 'Minneapolis', gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/nadia-johansson.jpg', video: '/casting-nonscripted/nadia-johansson.mp4',   experienceLevel: 'Home Cook',  nationality: 'Swedish',    languages: ['English', 'Swedish'] },
  { id: 's17-41', roleId: 'mc17-c03', name: 'Kevin Moreau',      age: 46, city: 'Boston',      gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/kevin-moreau.jpg', video: '/casting-nonscripted/kevin-moreau.mp4',    experienceLevel: 'Home Cook',  nationality: 'French',     languages: ['English', 'French'] },
  { id: 's17-42', roleId: 'mc17-c03', name: 'Angela Santos',     age: 57, city: 'San Diego',   gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/angela-santos.jpg', video: '/casting-nonscripted/angela-santos.mp4',   experienceLevel: 'Home Cook',  nationality: 'Filipino',   languages: ['English', 'Tagalog'] },
  { id: 's17-43', roleId: 'mc17-c03', name: 'Elias Karam',       age: 32, city: 'Detroit',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/elias-karam.jpg', video: '/casting-nonscripted/elias-karam.mp4',experienceLevel: 'Home Cook',  nationality: 'Lebanese',   languages: ['English', 'Arabic'] },
  { id: 's17-44', roleId: 'mc17-c03', name: 'Maria Gonzalez',    age: 49, city: 'Phoenix',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/maria-gonzalez.jpg', video: '/casting-nonscripted/maria-gonzalez.mp4',   experienceLevel: 'Home Cook',  nationality: 'Mexican',    languages: ['English', 'Spanish'] },
  { id: 's17-45', roleId: 'mc17-c03', name: 'Alex Tran',         age: 27, city: 'San Jose',    gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',  nationality: 'Vietnamese', languages: ['English', 'Vietnamese'] },
  { id: 's17-46', roleId: 'mc17-c03', name: 'Linda Mbeki',       age: 43, city: 'Atlanta',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/linda-mbeki.jpg', video: '/casting-nonscripted/linda-mbeki.mp4', experienceLevel: 'Home Cook',  nationality: 'South African',languages: ['English'] },
  { id: 's17-47', roleId: 'mc17-c03', name: 'Ryan O\'Brien',     age: 30, city: 'Seattle',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/ryan-obrien.jpg', video: '/casting-nonscripted/ryan-obrien.mp4',experienceLevel: 'Home Cook', nationality: 'American',   languages: ['English'] },
  // Contestant 4 — additional applicants
  { id: 's17-48', roleId: 'mc17-c04', name: 'Yemi Adeyemi',      age: 34, city: 'New York',    gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook', nationality: 'Nigerian',   languages: ['English', 'Yoruba'] },
  { id: 's17-49', roleId: 'mc17-c04', name: 'Pablo Castro',      age: 51, city: 'Los Angeles', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Chilean',    languages: ['English', 'Spanish'] },
  { id: 's17-50', roleId: 'mc17-c04', name: 'Chiara Ricci',      age: 38, city: 'New York',    gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',  nationality: 'Italian',    languages: ['English', 'Italian'] },
  { id: 's17-51', roleId: 'mc17-c04', name: 'Mohammed Al-Rashid',age: 44, city: 'Dearborn',    gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg',experienceLevel: 'Home Cook',  nationality: 'Iraqi',      languages: ['English', 'Arabic'] },
  { id: 's17-52', roleId: 'mc17-c04', name: 'Rachel Stern',      age: 29, city: 'Miami',       gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Home Cook',  nationality: 'American',   languages: ['English', 'Hebrew'] },
  { id: 's17-53', roleId: 'mc17-c04', name: 'Ben Nakamura',      age: 37, city: 'Seattle',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',  nationality: 'Japanese',   languages: ['English', 'Japanese'] },
  { id: 's17-54', roleId: 'mc17-c04', name: 'Fatima Diallo',     age: 32, city: 'Columbus',    gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Home Cook',  nationality: 'Senegalese', languages: ['English', 'Wolof'] },
  { id: 's17-55', roleId: 'mc17-c04', name: 'Tyler Johnson',     age: 23, city: 'Nashville',   gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Home Cook', nationality: 'American',   languages: ['English'] },
  // Contestant 5 — additional applicants
  { id: 's17-56', roleId: 'mc17-c05', name: 'Adaeze Obi',        age: 41, city: 'Houston',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',  nationality: 'Nigerian',   languages: ['English', 'Igbo'] },
  { id: 's17-57', roleId: 'mc17-c05', name: 'Carlos Vega',       age: 48, city: 'Los Angeles', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',  nationality: 'Colombian',  languages: ['English', 'Spanish'] },
  { id: 's17-58', roleId: 'mc17-c05', name: 'Yuka Sato',         age: 27, city: 'San Francisco',gender: 'F', status: 'new',        good: 0, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',  nationality: 'Japanese',   languages: ['English', 'Japanese'] },
  { id: 's17-59', roleId: 'mc17-c05', name: 'George Papadopoulos',age: 54, city: 'New York',   gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',  nationality: 'Greek',      languages: ['English', 'Greek'] },
  { id: 's17-60', roleId: 'mc17-c05', name: 'Amara Diop',        age: 35, city: 'Minneapolis', gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Home Cook',  nationality: 'Senegalese', languages: ['English', 'French'] },
  { id: 's17-61', roleId: 'mc17-c05', name: 'Mateo Reyes',       age: 30, city: 'San Antonio', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Mexican',    languages: ['English', 'Spanish'] },
  { id: 's17-62', roleId: 'mc17-c05', name: 'Hannah Kim',        age: 39, city: 'Los Angeles', gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',  nationality: 'Korean',     languages: ['English', 'Korean'] },
  { id: 's17-63', roleId: 'mc17-c05', name: 'Patrick O\'Connor', age: 45, city: 'Boston',      gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Home Cook', nationality: 'American',   languages: ['English'] },
  // Contestant 6 — additional applicants
  { id: 's17-64', roleId: 'mc17-c01', name: 'Meera Pillai',      age: 43, city: 'Chicago',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Home Cook',  nationality: 'Indian',     languages: ['English', 'Malayalam'] },
  { id: 's17-65', roleId: 'mc17-c01', name: 'Jean-Pierre Blanc', age: 60, city: 'New Orleans', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',  nationality: 'French',     languages: ['English', 'French'] },
  { id: 's17-66', roleId: 'mc17-c01', name: 'Tanya Brooks',      age: 32, city: 'Atlanta',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Home Cook',  nationality: 'American',   languages: ['English'] },
  { id: 's17-67', roleId: 'mc17-c01', name: 'Lorenzo Ferrari',   age: 27, city: 'New York',    gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Italian',    languages: ['English', 'Italian'] },
  { id: 's17-68', roleId: 'mc17-c01', name: 'Soo-Yeon Park',     age: 38, city: 'Los Angeles', gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',  nationality: 'Korean',     languages: ['English', 'Korean'] },
  { id: 's17-69', roleId: 'mc17-c01', name: 'Abdi Farah',        age: 31, city: 'Minneapolis', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg',experienceLevel: 'Home Cook',  nationality: 'Somali',     languages: ['English', 'Somali'] },
  { id: 's17-70', roleId: 'mc17-c01', name: 'Isabella Cruz',     age: 46, city: 'Miami',       gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Home Cook',  nationality: 'Puerto Rican',languages: ['English', 'Spanish'] },
  { id: 's17-71', roleId: 'mc17-c01', name: 'Ethan Cohen',       age: 24, city: 'New York',    gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Home Cook', nationality: 'American',   languages: ['English'] },
  // Contestant 7 — additional applicants
  { id: 's17-72', roleId: 'mc17-c02', name: 'Taini Kapoor',      age: 29, city: 'Chicago',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Home Cook',  nationality: 'Indian',     languages: ['English', 'Punjabi'] },
  { id: 's17-73', roleId: 'mc17-c02', name: 'Rodrigo Lima',      age: 37, city: 'Miami',       gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',  nationality: 'Brazilian',  languages: ['English', 'Portuguese'] },
  { id: 's17-74', roleId: 'mc17-c02', name: 'Fatou Camara',      age: 44, city: 'New York',    gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',  nationality: 'Guinean',    languages: ['English', 'French'] },
  { id: 's17-75', roleId: 'mc17-c02', name: 'Hiro Yamamoto',     age: 52, city: 'Los Angeles', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',  nationality: 'Japanese',   languages: ['English', 'Japanese'] },
  { id: 's17-76', roleId: 'mc17-c02', name: 'Chloe Martin',      age: 33, city: 'San Francisco',gender: 'F', status: 'new',        good: 0, maybe: 0, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook', nationality: 'French',     languages: ['English', 'French'] },
  { id: 's17-77', roleId: 'mc17-c02', name: 'Rashid Al-Amin',    age: 28, city: 'Detroit',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg',experienceLevel: 'Home Cook',  nationality: 'Moroccan',   languages: ['English', 'Arabic'] },
  { id: 's17-78', roleId: 'mc17-c02', name: 'Sofia Papadaki',    age: 41, city: 'Chicago',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',  nationality: 'Greek',      languages: ['English', 'Greek'] },
  // Contestant 8 — additional applicants
  { id: 's17-79', roleId: 'mc17-c03', name: 'Marcus Thompson',   age: 36, city: 'Atlanta',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Home Cook', nationality: 'American',   languages: ['English'] },
  { id: 's17-80', roleId: 'mc17-c03', name: 'Leila Farsi',       age: 49, city: 'Los Angeles', gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Home Cook',  nationality: 'Iranian',    languages: ['English', 'Farsi'] },
  { id: 's17-81', roleId: 'mc17-c03', name: 'Nathan Lee',        age: 25, city: 'New York',    gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Korean',     languages: ['English', 'Korean'] },
  { id: 's17-82', roleId: 'mc17-c03', name: 'Valentina Rossi',   age: 58, city: 'Chicago',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',  nationality: 'Italian',    languages: ['English', 'Italian'] },
  { id: 's17-83', roleId: 'mc17-c03', name: 'Kofi Mensah',       age: 31, city: 'Houston',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',  nationality: 'Ghanaian',   languages: ['English', 'Twi'] },
  { id: 's17-84', roleId: 'mc17-c03', name: 'Aiko Tanaka',       age: 44, city: 'Seattle',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',  nationality: 'Japanese',   languages: ['English', 'Japanese'] },
  { id: 's17-85', roleId: 'mc17-c03', name: 'Ivan Petrov',       age: 39, city: 'New York',    gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',  nationality: 'Russian',    languages: ['English', 'Russian'] },
  { id: 's17-86', roleId: 'mc17-c03', name: 'Zoe Williams',      age: 27, city: 'New Orleans', gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Home Cook',  nationality: 'American',   languages: ['English'] },
  // Contestant 9 — additional applicants
  { id: 's17-87', roleId: 'mc17-c04', name: 'Paulo Ferreira',    age: 33, city: 'Los Angeles', gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Portuguese', languages: ['English', 'Portuguese'] },
  { id: 's17-88', roleId: 'mc17-c04', name: 'Zara Okonkwo',      age: 41, city: 'Chicago',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Home Cook',  nationality: 'Nigerian',   languages: ['English', 'Igbo'] },
  { id: 's17-89', roleId: 'mc17-c04', name: 'Viktor Novak',      age: 47, city: 'New York',    gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',  nationality: 'Czech',      languages: ['English', 'Czech'] },
  { id: 's17-90', roleId: 'mc17-c04', name: 'Catalina Torres',   age: 29, city: 'San Diego',   gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Home Cook',  nationality: 'Colombian',  languages: ['English', 'Spanish'] },
  { id: 's17-91', roleId: 'mc17-c04', name: 'Wei Zhang',         age: 55, city: 'San Francisco',gender: 'M', status: 'new',        good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',  nationality: 'Chinese',    languages: ['English', 'Mandarin'] },
  { id: 's17-92', roleId: 'mc17-c04', name: 'Miriam Levy',       age: 38, city: 'Miami',       gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',  nationality: 'Israeli',    languages: ['English', 'Hebrew'] },
  { id: 's17-93', roleId: 'mc17-c04', name: 'Jamal Monroe',      age: 22, city: 'Atlanta',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg',experienceLevel: 'Home Cook', nationality: 'American',   languages: ['English'] },
  // Contestant 10 — additional applicants
  { id: 's17-94', roleId: 'mc17-c05', name: 'Sun-Hee Yoon',      age: 43, city: 'Los Angeles', gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',  nationality: 'Korean',     languages: ['English', 'Korean'] },
  { id: 's17-95', roleId: 'mc17-c05', name: 'Daniel Abramowitz', age: 50, city: 'New York',    gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'American',   languages: ['English', 'Yiddish'] },
  { id: 's17-96', roleId: 'mc17-c05', name: 'Aminata Bah',       age: 36, city: 'Atlanta',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',  nationality: 'Guinean',    languages: ['English', 'French'] },
  { id: 's17-97', roleId: 'mc17-c05', name: 'Tomás Ruiz',        age: 28, city: 'Phoenix',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg',experienceLevel: 'Home Cook',  nationality: 'Mexican',    languages: ['English', 'Spanish'] },
  { id: 's17-98', roleId: 'mc17-c05', name: 'Oksana Petrenko',   age: 45, city: 'Chicago',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Home Cook',  nationality: 'Ukrainian',  languages: ['English', 'Ukrainian'] },
  { id: 's17-99', roleId: 'mc17-c05', name: 'Daisuke Endo',      age: 31, city: 'Seattle',     gender: 'M', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',  nationality: 'Japanese',   languages: ['English', 'Japanese'] },
  { id: 's17-100',roleId: 'mc17-c05', name: 'Blessing Okafor',   age: 26, city: 'Houston',     gender: 'F', status: 'new',         good: 0, maybe: 0, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook', nationality: 'Nigerian',   languages: ['English', 'Yoruba'] },
]

// ── Store (localStorage-backed, like castingState.ts) ──────────────────────────

const STORAGE_KEY = 'lic-selection-state-v13'

type PersistedState = {
  candidates: Candidate[]
  roleStatusOverrides: Record<string, RolePipelineStatus>
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore — demo persistence only
  }
  return { candidates: seedCandidates, roleStatusOverrides: {} }
}

let state = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore — demo persistence only
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// Cache filtered results so repeated calls return a stable reference when the
// underlying candidate list hasn't changed — required by useSyncExternalStore,
// which otherwise treats a fresh array each render as a perpetual store change.
const roleCandidatesCache = new Map<string, { source: Candidate[]; result: Candidate[] }>()

export function getCandidatesForRole(roleId: string): Candidate[] {
  const cached = roleCandidatesCache.get(roleId)
  if (cached && cached.source === state.candidates) return cached.result
  const result = state.candidates.filter((c) => c.roleId === roleId)
  roleCandidatesCache.set(roleId, { source: state.candidates, result })
  return result
}

export function useRoleCandidates(roleId: string): Candidate[] {
  return useSyncExternalStore(subscribe, () => getCandidatesForRole(roleId))
}

// Same caching strategy as `roleCandidatesCache`, keyed by the joined role ids
// so a single hook call can power a project-wide (multi-role) Kanban.
const multiRoleCandidatesCache = new Map<string, { source: Candidate[]; result: Candidate[] }>()

export function getCandidatesForRoles(roleIds: string[]): Candidate[] {
  const key = roleIds.join(',')
  const cached = multiRoleCandidatesCache.get(key)
  if (cached && cached.source === state.candidates) return cached.result
  const result = state.candidates.filter((c) => roleIds.includes(c.roleId))
  multiRoleCandidatesCache.set(key, { source: state.candidates, result })
  return result
}

/** All candidates across a set of roles — powers the project-wide selection console. */
export function useCandidatesForRoles(roleIds: string[]): Candidate[] {
  return useSyncExternalStore(subscribe, () => getCandidatesForRoles(roleIds))
}

export function useCandidate(candidateId: string): Candidate | undefined {
  return useSyncExternalStore(subscribe, () => state.candidates.find((c) => c.id === candidateId))
}

/** Move a candidate to a new board column. Offer/Cast allow only one occupant per role
 *  for scripted projects; for non-scripted (Contestant roles) the constraint is lifted
 *  since all teams share a common pool and cast slots are project-wide. */
export function moveCandidate(candidateId: string, status: CandidateStatus): { ok: boolean; reason?: string } {
  const candidate = state.candidates.find((c) => c.id === candidateId)
  if (!candidate) return { ok: false, reason: 'Candidate not found' }

  const roleType = rolesById[candidate.roleId]?.type
  const isContestantRole = roleType === 'Contestant'

  if (!isContestantRole && SINGLE_OCCUPANT_COLUMNS.has(status)) {
    const occupant = state.candidates.find((c) => c.roleId === candidate.roleId && c.status === status && c.id !== candidateId)
    if (occupant) {
      return { ok: false, reason: `${occupant.name} is already in ${BOARD_COLUMN_LABELS[status]} — move them first` }
    }
  }

  state = { ...state, candidates: state.candidates.map((c) => (c.id === candidateId ? { ...c, status } : c)) }
  persist()
  emit()
  return { ok: true }
}

export function rateCandidate(candidateId: string, signal: 'good' | 'maybe' | 'no') {
  state = {
    ...state,
    candidates: state.candidates.map((c) => {
      if (c.id !== candidateId) return c
      const updated = { ...c, [signal]: c[signal] + 1 }
      // Auto-sort between Reviewed / Shortlisted while the candidate hasn't been
      // manually advanced further down the pipeline yet. A first review also
      // moves a candidate out of the locked "New" column.
      if (c.status === 'new' || c.status === 'no-go' || c.status === 'shortlisted') {
        updated.status = candidateScore(updated) < NO_GO_THRESHOLD ? 'no-go' : 'shortlisted'
      }
      return updated
    }),
  }
  persist()
  emit()
}

const STATUS_RANK = PIPELINE_STATUSES

/** Highest pipeline stage reached among a role's candidates (for the dashboard default). */
export function deriveRoleStatus(candidates: Candidate[]): RolePipelineStatus {
  if (candidates.length === 0) return 'New'
  return candidates.reduce<RolePipelineStatus>((best, c) => {
    const label = BOARD_COLUMN_LABELS[c.status]
    return STATUS_RANK.indexOf(label) > STATUS_RANK.indexOf(best) ? label : best
  }, 'New')
}

export function useRoleStatus(roleId: string): RolePipelineStatus {
  const override = useSyncExternalStore(subscribe, () => state.roleStatusOverrides[roleId])
  const candidates = useRoleCandidates(roleId)
  return override ?? deriveRoleStatus(candidates)
}

export function setRoleStatus(roleId: string, status: RolePipelineStatus) {
  state = { ...state, roleStatusOverrides: { ...state.roleStatusOverrides, [roleId]: status } }
  persist()
  emit()
}

const RATER_POOL = ['ET', 'JC', 'LK', 'MS', 'AB', 'RT']

/** Individual teammate votes for "other ratings" bubbles — reads `raterVotes` when present
 *  (real, filterable reviewer identities), else falls back to a plausible reconstruction
 *  from the good/maybe/no tally (for candidates without explicit rater data). */
export function deriveTeamRatings(c: Candidate): { initials: string; signal: Signal }[] {
  if (c.raterVotes) {
    return Object.entries(c.raterVotes).map(([reviewerId, signal]) => ({
      initials: teamById[reviewerId]?.initials ?? reviewerId,
      signal,
    }))
  }
  const signals: Signal[] = [
    ...Array(c.good).fill('good' as const),
    ...Array(c.maybe).fill('maybe' as const),
    ...Array(c.no).fill('no' as const),
  ]
  return signals.map((signal, i) => ({ initials: RATER_POOL[i % RATER_POOL.length], signal }))
}

/** Weighted average rating out of 5, derived from the good/maybe/no tally. */
export function candidateAverageRating(c: Candidate): number {
  const total = c.good + c.maybe + c.no
  if (total === 0) return 0
  return Math.round(((c.good * 5 + c.maybe * 3 + c.no * 1.5) / total) * 10) / 10
}

/** Deterministic pseudo-random AI scene metrics, seeded by candidate id (demo only — no backend). */
export function deriveAiMetrics(c: Candidate): { label: string; value: number }[] {
  const seed = c.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const labels = ['Emotional range', 'Memorization', 'Eye contact', 'Pacing']
  return labels.map((label, i) => ({ label, value: 55 + ((seed * (i + 3)) % 45) }))
}

/** Candidate currently in Cast, else in Offer, for a role (used on the Wall). */
export function chosenCandidateForRole(roleId: string): Candidate | undefined {
  const candidates = getCandidatesForRole(roleId)
  return candidates.find((c) => c.status === 'cast') ?? candidates.find((c) => c.status === 'offer')
}

/** Count of candidates that have been shortlisted or moved further down the pipeline. */
export function shortlistedCountForRole(roleId: string): number {
  const shortlistRank = BOARD_COLUMNS.indexOf('shortlisted')
  return getCandidatesForRole(roleId).filter((c) => BOARD_COLUMNS.indexOf(c.status) >= shortlistRank).length
}
