import { useSyncExternalStore } from 'react'
import { teamById } from './team'
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
  { id: 'mc-1',  roleId: 'masterchef-home-cooks', name: 'Emma Rossi',       age: 34, city: 'Melbourne',   gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-2',  roleId: 'masterchef-home-cooks', name: 'Daniel Wong',      age: 29, city: 'Sydney',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Cantonese'],    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-3',  roleId: 'masterchef-home-cooks', name: 'Sarah Patel',      age: 42, city: 'Brisbane',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Hindi'],        raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-4',  roleId: 'masterchef-home-cooks', name: 'James Liu',        age: 37, city: 'Perth',       gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-5',  roleId: 'masterchef-home-cooks', name: 'Olivia McCarthy',  age: 31, city: 'Adelaide',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-6',  roleId: 'masterchef-home-cooks', name: 'Anthony Nguyen',   age: 45, city: 'Melbourne',   gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-7',  roleId: 'masterchef-home-cooks', name: 'Lucy Chen',        age: 28, city: 'Gold Coast',  gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-8',  roleId: 'masterchef-home-cooks', name: 'Mark Thompson',    age: 52, city: 'Sydney',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-9',  roleId: 'masterchef-home-cooks', name: 'Priya Sharma',     age: 38, city: 'Brisbane',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Hindi'],        raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-10', roleId: 'masterchef-home-cooks', name: 'Tom Nguyen',       age: 33, city: 'Melbourne',   gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-11', roleId: 'masterchef-home-cooks', name: 'Grace Papadopoulos',age: 46, city: 'Adelaide',  gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Greek'],        raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-12', roleId: 'masterchef-home-cooks', name: 'Ben Robinson',     age: 27, city: 'Perth',       gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-13', roleId: 'masterchef-home-cooks', name: 'Maria Santos',     age: 55, city: 'Sydney',      gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Filipino'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-14', roleId: 'masterchef-home-cooks', name: 'Jake Tran',        age: 30, city: 'Gold Coast',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-15', roleId: 'masterchef-home-cooks', name: 'Sofia Kaur',       age: 41, city: 'Melbourne',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/hannah-levy.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Punjabi'],      raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-16', roleId: 'masterchef-home-cooks', name: 'Nathan Berry',     age: 35, city: 'Cairns',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-17', roleId: 'masterchef-home-cooks', name: 'Chloe Williams',   age: 26, city: 'Brisbane',    gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-18', roleId: 'masterchef-home-cooks', name: 'Pierre Dubois',    age: 48, city: 'Sydney',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook', nationality: 'French',     languages: ['English', 'French'],       raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  // callback (3)
  { id: 'mc-19', roleId: 'masterchef-home-cooks', name: 'Yasmin Haddad',    age: 36, city: 'Melbourne',   gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Arabic'],       raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-20', roleId: 'masterchef-home-cooks', name: 'Kevin Lee',        age: 43, city: 'Sydney',      gender: 'M', status: 'callback',    good: 3, maybe: 1, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Cantonese'],    raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  { id: 'mc-21', roleId: 'masterchef-home-cooks', name: 'Isabelle Nguyen',  age: 31, city: 'Brisbane',    gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  // shortlisted (12)
  { id: 'mc-22', roleId: 'masterchef-home-cooks', name: 'Hamish Murray',    age: 39, city: 'Perth',       gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'mc-23', roleId: 'masterchef-home-cooks', name: 'Rachel Kim',       age: 33, city: 'Adelaide',    gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/sarah-lefevre.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Korean'],       raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-24', roleId: 'masterchef-home-cooks', name: 'Chris Vo',         age: 47, city: 'Melbourne',   gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-25', roleId: 'masterchef-home-cooks', name: 'Amy Anderson',     age: 29, city: 'Gold Coast',  gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'mc-26', roleId: 'masterchef-home-cooks', name: 'Sam Russo',        age: 38, city: 'Sydney',      gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'mc-27', roleId: 'masterchef-home-cooks', name: 'Monica Zhang',     age: 44, city: 'Brisbane',    gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  { id: 'mc-28', roleId: 'masterchef-home-cooks', name: 'Nico Papadopoulos',age: 35, city: 'Melbourne',   gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Greek'],        raterVotes: { 'peter-known': 'maybe', 'eden-tov': 'good' } },
  { id: 'mc-29', roleId: 'masterchef-home-cooks', name: 'Penny Walsh',      age: 52, city: 'Cairns',      gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-30', roleId: 'masterchef-home-cooks', name: 'Tyler Nguyen',     age: 28, city: 'Hobart',      gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-31', roleId: 'masterchef-home-cooks', name: 'Angela Tran',      age: 40, city: 'Darwin',      gender: 'F', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'mc-32', roleId: 'masterchef-home-cooks', name: 'Liam Carter',      age: 36, city: 'Sydney',      gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'mc-33', roleId: 'masterchef-home-cooks', name: 'Donna Roberts',    age: 47, city: 'Gold Coast',  gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  // no-go (20)
  { id: 'mc-34', roleId: 'masterchef-home-cooks', name: 'Brendan Murphy',   age: 41, city: 'Melbourne',   gender: 'M', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-35', roleId: 'masterchef-home-cooks', name: 'Christine Park',   age: 34, city: 'Sydney',      gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/lola-mercier.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Korean'],       raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'mc-36', roleId: 'masterchef-home-cooks', name: 'Gary Sullivan',    age: 58, city: 'Brisbane',    gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'mc-37', roleId: 'masterchef-home-cooks', name: 'Helen Zhou',       age: 45, city: 'Perth',       gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'eden-tov': 'no', 'julie-cohen': 'no' } },
  { id: 'mc-38', roleId: 'masterchef-home-cooks', name: 'Ian Collins',      age: 37, city: 'Adelaide',    gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'eden-tov': 'maybe' } },
  { id: 'mc-39', roleId: 'masterchef-home-cooks', name: 'Janet Evans',      age: 52, city: 'Melbourne',   gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-40', roleId: 'masterchef-home-cooks', name: 'Ken Nguyen',       age: 44, city: 'Gold Coast',  gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'mc-41', roleId: 'masterchef-home-cooks', name: 'Linda Walsh',      age: 39, city: 'Sydney',      gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 3, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },
  { id: 'mc-42', roleId: 'masterchef-home-cooks', name: 'Mike Thompson',    age: 55, city: 'Brisbane',    gender: 'M', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'eden-tov': 'no' } },
  { id: 'mc-43', roleId: 'masterchef-home-cooks', name: 'Nancy Chen',       age: 48, city: 'Cairns',      gender: 'F', status: 'no-go', good: 0, maybe: 1, no: 3, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Cantonese'],    raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-44', roleId: 'masterchef-home-cooks', name: 'Owen Hardy',       age: 35, city: 'Melbourne',   gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 2, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'mc-45', roleId: 'masterchef-home-cooks', name: 'Patricia Lee',     age: 61, city: 'Hobart',      gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'eden-tov': 'no', 'julie-cohen': 'no' } },
  { id: 'mc-46', roleId: 'masterchef-home-cooks', name: 'Quentin Russo',    age: 42, city: 'Darwin',      gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Italian'],      raterVotes: { 'peter-known': 'no', 'eden-tov': 'maybe' } },
  { id: 'mc-47', roleId: 'masterchef-home-cooks', name: 'Rose Pham',        age: 37, city: 'Sydney',      gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/hannah-levy.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'],   raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-48', roleId: 'masterchef-home-cooks', name: 'Simon Davis',      age: 50, city: 'Melbourne',   gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'lara-khan': 'no' } },
  { id: 'mc-49', roleId: 'masterchef-home-cooks', name: 'Tanya Morrison',   age: 43, city: 'Brisbane',    gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English'],                  raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },
  { id: 'mc-50', roleId: 'masterchef-home-cooks', name: 'Victor Singh',     age: 38, city: 'Perth',       gender: 'M', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Punjabi'],      raterVotes: { 'eden-tov': 'no', 'julie-cohen': 'no' } },
  { id: 'mc-51', roleId: 'masterchef-home-cooks', name: 'Wendy Clarke',     age: 56, city: 'Gold Coast',  gender: 'F', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English'],                  raterVotes: { 'peter-known': 'no', 'eden-tov': 'no' } },
  { id: 'mc-52', roleId: 'masterchef-home-cooks', name: 'Xavier Haddad',    age: 33, city: 'Cairns',      gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 3, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook', nationality: 'Australian', languages: ['English', 'Arabic'],       raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-53', roleId: 'masterchef-home-cooks', name: 'Yvonne Liu',       age: 47, city: 'Sydney',      gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Mandarin'],     raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  // new (17)
  { id: 'mc-54', roleId: 'masterchef-home-cooks', name: 'Andrew Nguyen',    age: 31, city: 'Melbourne',   gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'mc-55', roleId: 'masterchef-home-cooks', name: 'Bethany Ross',     age: 27, city: 'Sydney',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'] },
  { id: 'mc-56', roleId: 'masterchef-home-cooks', name: 'Carlos Santos',    age: 39, city: 'Brisbane',    gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Filipino'] },
  { id: 'mc-57', roleId: 'masterchef-home-cooks', name: 'Diana Kim',        age: 33, city: 'Perth',       gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Korean'] },
  { id: 'mc-58', roleId: 'masterchef-home-cooks', name: 'Edward Tran',      age: 45, city: 'Adelaide',    gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'mc-59', roleId: 'masterchef-home-cooks', name: 'Fiona Brown',      age: 28, city: 'Gold Coast',  gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'] },
  { id: 'mc-60', roleId: 'masterchef-home-cooks', name: 'George Chen',      age: 52, city: 'Melbourne',   gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Cantonese'] },
  { id: 'mc-61', roleId: 'masterchef-home-cooks', name: 'Harriet Wong',     age: 36, city: 'Darwin',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Cantonese'] },
  { id: 'mc-62', roleId: 'masterchef-home-cooks', name: 'Ivan Patel',       age: 41, city: 'Cairns',      gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Hindi'] },
  { id: 'mc-63', roleId: 'masterchef-home-cooks', name: 'Julia Martinez',   age: 29, city: 'Sydney',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/lola-mercier.jpg',   experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Spanish'] },
  { id: 'mc-64', roleId: 'masterchef-home-cooks', name: 'Karl Nguyen',      age: 47, city: 'Hobart',      gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'mc-65', roleId: 'masterchef-home-cooks', name: 'Lorraine Russo',   age: 55, city: 'Brisbane',    gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Italian'] },
  { id: 'mc-66', roleId: 'masterchef-home-cooks', name: 'Martin Liu',       age: 34, city: 'Perth',       gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Mandarin'] },
  { id: 'mc-67', roleId: 'masterchef-home-cooks', name: 'Natalie Clarke',   age: 30, city: 'Melbourne',   gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'] },
  { id: 'mc-68', roleId: 'masterchef-home-cooks', name: 'Paul Haddad',      age: 43, city: 'Gold Coast',  gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English', 'Arabic'] },
  { id: 'mc-69', roleId: 'masterchef-home-cooks', name: 'Quinn Anderson',   age: 26, city: 'Cairns',      gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Home Cook',   nationality: 'Australian', languages: ['English'] },
  { id: 'mc-70', roleId: 'masterchef-home-cooks', name: 'Robert Tran',      age: 57, city: 'Sydney',      gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Home Cook',  nationality: 'Australian', languages: ['English', 'Vietnamese'] },

  // ── MasterChef Australia — masterchef-junior ─────────────────────────────────
  // cast (6)
  { id: 'mc-71', roleId: 'masterchef-junior', name: 'Zara Mitchell',   age: 14, city: 'Sydney',     gender: 'F', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-72', roleId: 'masterchef-junior', name: 'Luca Russo',      age: 13, city: 'Melbourne',  gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Italian'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-73', roleId: 'masterchef-junior', name: 'Aisha Patel',     age: 15, city: 'Brisbane',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/anais-roche.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Hindi'],     raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-74', roleId: 'masterchef-junior', name: 'Oliver Chen',     age: 12, city: 'Perth',      gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Junior', nationality: 'Australian', languages: ['English', 'Mandarin'],  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  { id: 'mc-75', roleId: 'masterchef-junior', name: 'Sophie Nguyen',   age: 14, city: 'Adelaide',   gender: 'F', status: 'cast',        good: 4, maybe: 1, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Vietnamese'], raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  { id: 'mc-76', roleId: 'masterchef-junior', name: 'Ethan Wong',      age: 13, city: 'Gold Coast', gender: 'M', status: 'cast',        good: 5, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Cantonese'],  raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'good' } },
  // callback (1)
  { id: 'mc-77', roleId: 'masterchef-junior', name: 'Ruby Taylor',     age: 15, city: 'Sydney',     gender: 'F', status: 'callback',    good: 3, maybe: 2, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'maybe' } },
  // shortlisted (5)
  { id: 'mc-78', roleId: 'masterchef-junior', name: 'Kai Thompson',    age: 14, city: 'Melbourne',  gender: 'M', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe' } },
  { id: 'mc-79', roleId: 'masterchef-junior', name: 'Mia Haddad',      age: 13, city: 'Brisbane',   gender: 'F', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/sofia-bello.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Arabic'],    raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'good' } },
  { id: 'mc-80', roleId: 'masterchef-junior', name: 'Charlie Ross',    age: 15, city: 'Perth',      gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'peter-known': 'good', 'lara-khan': 'good' } },
  { id: 'mc-81', roleId: 'masterchef-junior', name: 'Lily Zhang',      age: 14, city: 'Adelaide',   gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/lea-martin.jpg',    experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Mandarin'],  raterVotes: { 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  { id: 'mc-82', roleId: 'masterchef-junior', name: 'Felix Nguyen',    age: 12, city: 'Cairns',     gender: 'M', status: 'shortlisted', good: 2, maybe: 1, no: 0, avatar: '/avatars/vincent-berry.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Vietnamese'], raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  // no-go (5)
  { id: 'mc-83', roleId: 'masterchef-junior', name: 'Emma Clarke',     age: 15, city: 'Gold Coast', gender: 'F', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/lucie-fontaine.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-84', roleId: 'masterchef-junior', name: 'Lucas Singh',     age: 13, city: 'Sydney',     gender: 'M', status: 'no-go', good: 1, maybe: 0, no: 2, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Hindi'],     raterVotes: { 'peter-known': 'no', 'eden-tov': 'no' } },
  { id: 'mc-85', roleId: 'masterchef-junior', name: 'Ava Morrison',    age: 14, city: 'Melbourne',  gender: 'F', status: 'no-go', good: 1, maybe: 1, no: 2, avatar: '/avatars/zoe-andrieu.jpg',   experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English'],                raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-86', roleId: 'masterchef-junior', name: 'Jasper Liu',      age: 15, city: 'Brisbane',   gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Mandarin'],  raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  { id: 'mc-87', roleId: 'masterchef-junior', name: 'Nora Tran',       age: 13, city: 'Perth',      gender: 'F', status: 'no-go', good: 1, maybe: 0, no: 3, avatar: '/avatars/nadia-ferrand.jpg', experienceLevel: 'Junior',  nationality: 'Australian', languages: ['English', 'Vietnamese'], raterVotes: { 'julie-cohen': 'no', 'lara-khan': 'no' } },
  // new (3)
  { id: 'mc-88', roleId: 'masterchef-junior', name: 'Billy Chen',      age: 14, city: 'Darwin',     gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'Junior', nationality: 'Australian', languages: ['English', 'Cantonese'] },
  { id: 'mc-89', roleId: 'masterchef-junior', name: 'Zoe Russo',       age: 12, city: 'Hobart',     gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/lola-mercier.jpg',  experienceLevel: 'Junior', nationality: 'Australian', languages: ['English', 'Italian'] },
  { id: 'mc-90', roleId: 'masterchef-junior', name: 'Noah Patel',      age: 15, city: 'Cairns',     gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/karim-belkacem.jpg', experienceLevel: 'Junior', nationality: 'Australian', languages: ['English', 'Hindi'] },

  // ── MasterChef Australia — masterchef-guest-mentors ──────────────────────────
  // shortlisted (3)
  { id: 'mc-91', roleId: 'masterchef-guest-mentors', name: 'Marco Russo',     age: 48, city: 'Sydney',     gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/thomas-granger.jpg', experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Italian'],   raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'mc-92', roleId: 'masterchef-guest-mentors', name: 'Julia Nguyen',    age: 43, city: 'Melbourne',  gender: 'F', status: 'shortlisted', good: 2, maybe: 2, no: 0, avatar: '/avatars/margot-chen.jpg',   experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Vietnamese'], raterVotes: { 'peter-known': 'maybe', 'julie-cohen': 'good' } },
  { id: 'mc-93', roleId: 'masterchef-guest-mentors', name: 'David Chen',      age: 52, city: 'Brisbane',   gender: 'M', status: 'shortlisted', good: 3, maybe: 1, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Mandarin'],  raterVotes: { 'eden-tov': 'good', 'lara-khan': 'good' } },
  // no-go (2)
  { id: 'mc-94', roleId: 'masterchef-guest-mentors', name: 'Sandra Park',     age: 45, city: 'Perth',      gender: 'F', status: 'no-go', good: 1, maybe: 0, no: 2, avatar: '/avatars/eva-sokolov.jpg',   experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Korean'],    raterVotes: { 'eden-tov': 'no', 'lara-khan': 'no' } },
  { id: 'mc-95', roleId: 'masterchef-guest-mentors', name: 'Paul Martinez',   age: 55, city: 'Sydney',     gender: 'M', status: 'no-go', good: 0, maybe: 2, no: 2, avatar: '/avatars/julien-faure.jpg',  experienceLevel: 'TV Personality',    nationality: 'Australian', languages: ['English'],               raterVotes: { 'peter-known': 'maybe', 'lara-khan': 'no' } },
  // new (5)
  { id: 'mc-96', roleId: 'masterchef-guest-mentors', name: 'Helena Tran',     age: 41, city: 'Melbourne',  gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/noor-haddad.jpg',   experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English', 'Vietnamese'] },
  { id: 'mc-97', roleId: 'masterchef-guest-mentors', name: 'Rick Harrison',   age: 58, city: 'Gold Coast', gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/theo-vance.jpg',    experienceLevel: 'TV Personality',    nationality: 'Australian', languages: ['English'] },
  { id: 'mc-98', roleId: 'masterchef-guest-mentors', name: 'Yuki Suzuki',     age: 39, city: 'Sydney',     gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/sarah-liu.jpg',     experienceLevel: 'Celebrity Chef',    nationality: 'Japanese',   languages: ['English', 'Japanese'] },
  { id: 'mc-99', roleId: 'masterchef-guest-mentors', name: 'Frank O\'Brien',  age: 62, city: 'Cairns',     gender: 'M', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/marc-dubreuil.jpg', experienceLevel: 'Celebrity Chef',    nationality: 'Australian', languages: ['English'] },
  { id: 'mc-100',roleId: 'masterchef-guest-mentors', name: 'Diana Haddad',    age: 46, city: 'Adelaide',   gender: 'F', status: 'new', good: 0, maybe: 0, no: 0, avatar: '/avatars/camille-vidal.jpg', experienceLevel: 'TV Personality',    nationality: 'Australian', languages: ['English', 'Arabic'] },
]

// ── Store (localStorage-backed, like castingState.ts) ──────────────────────────

const STORAGE_KEY = 'lic-selection-state-v8'

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

/** Move a candidate to a new board column. Offer/Cast allow only one occupant. */
export function moveCandidate(candidateId: string, status: CandidateStatus): { ok: boolean; reason?: string } {
  const candidate = state.candidates.find((c) => c.id === candidateId)
  if (!candidate) return { ok: false, reason: 'Candidate not found' }

  if (SINGLE_OCCUPANT_COLUMNS.has(status)) {
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
