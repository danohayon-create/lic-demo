import type { SceneAnalysis, TranscriptLine } from './types'

/** Video for the audition under review (LIC Player). */
export const auditionVideo = '/media/audition.mp4'

/** Total duration of the audition take, display string. */
export const auditionDuration = '03:14'

/** Timecoded transcript / synced sides shown under the player. */
export const auditionTranscript: TranscriptLine[] = [
  { timecode: '00:12', character: 'FANNY', text: "You think I haven't tried to leave?" },
  { timecode: '00:18', text: 'I packed a bag every Sunday for two years.' },
  { timecode: '00:24', character: 'JAKE', text: "So what's stopping you tonight?" },
]

/** AI + team scene analysis for Maya's audition as Fanny Brice. */
export const sceneAnalyses: SceneAnalysis[] = [
  {
    id: 'sa-maya-fanny',
    roleId: 'fanny-brice',
    talentId: 'maya-reyes',
    metrics: [
      { label: 'Emotional range', value: 86 },
      { label: 'Memorization', value: 100 },
      { label: 'Eye contact', value: 74 },
      { label: 'Pacing', value: 68 },
    ],
    averageRating: 4.0,
    decision: 'good',
    teamRatings: [
      { initials: 'ET', signal: 'maybe' },
      { initials: 'JC', signal: 'good' },
      { initials: 'LK', signal: 'good' },
    ],
    ratedSummary: '3 of 5 teammates have rated',
  },
]

export const sceneAnalysesById = Object.fromEntries(sceneAnalyses.map((s) => [s.id, s]))

/** Lookup a scene analysis by role + talent. */
export const sceneAnalysisFor = (roleId: string, talentId: string) =>
  sceneAnalyses.find((s) => s.roleId === roleId && s.talentId === talentId)
