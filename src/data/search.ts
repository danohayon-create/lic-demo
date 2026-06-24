import type { SearchState } from './types'

/** Default talent-search state (studio search surface). */
export const searchState: SearchState = {
  query: 'vulnerable, sharp, 24–32, drama-leaning',
  aiParsed: true,
  resultCount: 1847,
  resultSummary: '1,847 talents match · sorted by AI performance fit',
  filters: [
    { label: 'Role type', values: ['Lead', 'Supporting'], extra: 3 },
    { label: 'Location', values: ['Los Angeles', 'Remote OK'] },
    { label: 'Age range', values: ['24–34'] },
    { label: 'Gender', values: ['Female'] },
    { label: 'Languages', values: ['English', 'Spanish'], extra: 1 },
    { label: 'Union', values: ['SAG-AFTRA'] },
    { label: 'Height', values: ['165–175 cm'] },
    { label: 'Skills', values: ['Vulnerability', 'Comedic timing'], extra: 4 },
  ],
}
