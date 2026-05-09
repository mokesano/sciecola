// Central export for all mock data
export { JOURNALS, getJournalById } from './journals';
export {
  RESEARCHERS,
  getResearcherById,
  getResearcherByOrcid,
  getResearchersByInstitution,
  getResearchersBySdg,
  getTopResearchers,
} from './researchers';
export {
  ARTICLES,
  getArticleById,
  getArticleByDoi,
  getArticlesBySdg,
  getArticlesByAuthor,
  getArticlesByJournal,
  getRecentArticles,
  getTopArticles,
  SDG_PUBLICATION_COUNTS,
  PUBLICATIONS_BY_YEAR,
} from './articles';

// Platform-level aggregated stats (used by StatCards, Analytics, etc.)
import { ARTICLES, SDG_PUBLICATION_COUNTS } from './articles';
import { RESEARCHERS } from './researchers';
import { JOURNALS } from './journals';

export const PLATFORM_STATS = {
  totalArticles:   ARTICLES.length,
  totalResearchers: RESEARCHERS.length,
  totalJournals:   JOURNALS.length,
  totalInstitutions: 10,
  totalCountries:  15,
  totalCitations:  ARTICLES.reduce((s, a) => s + a.citationCount, 0),
  avgWisScore:     parseFloat((RESEARCHERS.reduce((s, r) => s + r.wisScore, 0) / RESEARCHERS.length).toFixed(1)),
  publicationsGrowth: 18,
  researchersGrowth:  12,
  institutionsGrowth: 9,
};

// SDG distribution for charts
export const SDG_CHART_DATA = SDG_PUBLICATION_COUNTS.map(({ sdg, count }) => ({
  sdg,
  name: `SDG ${sdg}`,
  value: count,
}));
