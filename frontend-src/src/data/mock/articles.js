// 100 mock articles fully interconnected with researchers and journals
import { RESEARCHERS } from './researchers';
import { JOURNALS } from './journals';

const SDG_TITLES = {
  1:  ['Poverty Alleviation Strategies', 'Social Protection Mechanisms', 'Income Inequality and Rural Development'],
  2:  ['Food Security in Developing Nations', 'Sustainable Agriculture Practices', 'Zero Hunger Policy Frameworks'],
  3:  ['Public Health Interventions', 'Community Health Outcomes', 'Infectious Disease Prevention'],
  4:  ['Digital Learning Environments', 'Quality Education Access', 'Educational Technology Adoption'],
  5:  ['Gender Equality in STEM', 'Women Empowerment Programs', 'Female Labor Force Participation'],
  6:  ['Clean Water Access', 'Sanitation Infrastructure', 'Groundwater Contamination'],
  7:  ['Solar Energy Adoption', 'Renewable Energy Policy', 'Wind Power Optimization'],
  8:  ['Sustainable Economic Growth', 'Decent Work Conditions', 'Employment Policy'],
  9:  ['Industry 4.0 Transitions', 'Infrastructure Development', 'Innovation Ecosystems'],
  10: ['Reducing Income Inequality', 'Social Mobility Barriers', 'Inclusive Growth'],
  11: ['Smart City Planning', 'Urban Sustainability', 'Resilient Communities'],
  12: ['Circular Economy Models', 'Responsible Consumption Patterns', 'Sustainable Production'],
  13: ['Climate Change Mitigation', 'Carbon Footprint Reduction', 'Climate Adaptation Policy'],
  14: ['Marine Ecosystem Conservation', 'Ocean Pollution Control', 'Fisheries Sustainability'],
  15: ['Terrestrial Biodiversity', 'Forest Conservation', 'Land Degradation Restoration'],
  16: ['Institutional Integrity', 'Access to Justice', 'Peace-building Mechanisms'],
  17: ['Global Partnership Frameworks', 'International Development Cooperation', 'Technology Transfer'],
};

const ABSTRACTS = [
  'This study examines the relationship between sustainable development goals and regional policy outcomes, providing empirical evidence from a longitudinal dataset covering 15 years of intervention data.',
  'Using a mixed-methods approach, we analyze the effectiveness of targeted programs in achieving measurable outcomes aligned with international sustainability benchmarks.',
  'Our findings suggest a statistically significant correlation between institutional capacity and SDG progress, with implications for evidence-based policy design.',
  'This paper presents a systematic review of 120 peer-reviewed studies, synthesizing insights about barriers and enablers of sustainable development transitions.',
  'Employing structural equation modeling, we investigate pathways through which innovation-driven growth contributes to SDG achievement in emerging economies.',
  'A multi-country comparative analysis reveals heterogeneous effects of global sustainability initiatives, underscoring the importance of context-specific implementation strategies.',
  'We develop a novel index combining economic, social, and environmental indicators to track progress toward sustainability goals at subnational levels.',
  'Machine learning algorithms applied to satellite imagery provide new insights into land-use change dynamics and their SDG implications across tropical regions.',
];

export const ARTICLES = Array.from({ length: 100 }, (_, i) => {
  const id    = i + 1;
  const sdg1  = (i % 17) + 1;
  const sdg2  = ((i + 5) % 17) + 1;
  const sdgs  = sdg2 !== sdg1 ? [sdg1, sdg2] : [sdg1];
  const journal = JOURNALS[i % JOURNALS.length];
  const leadResearcher = RESEARCHERS[i % RESEARCHERS.length];
  const coAuthor1 = RESEARCHERS[(i + 13) % RESEARCHERS.length];
  const coAuthor2 = RESEARCHERS[(i + 27) % RESEARCHERS.length];
  const titleOptions = SDG_TITLES[sdg1];
  const title = `${titleOptions[i % titleOptions.length]}: Evidence from ${['Indonesia', 'Southeast Asia', 'Developing Nations', 'Emerging Economies', 'Asia-Pacific'][i % 5]}`;
  const year  = 2019 + (i % 6);
  const month = String((i % 12) + 1).padStart(2, '0');

  return {
    id: `art-${String(id).padStart(5, '0')}`,
    doi: `10.${String(10000 + (i % 90000)).padStart(5, '0')}/art-${String(id).padStart(7, '0')}`,
    title,
    abstract: ABSTRACTS[i % ABSTRACTS.length],
    year,
    publishedDate: `${year}-${month}-${String((i % 28) + 1).padStart(2, '0')}`,
    journalId: journal.id,
    journalName: journal.name,
    publisher: journal.publisher,
    quartile: journal.quartile,
    sdgs,
    primarySdg: sdg1,
    authors: [leadResearcher.id, coAuthor1.id, coAuthor2.id],
    authorNames: [leadResearcher.name, coAuthor1.name, coAuthor2.name],
    leadAuthorId: leadResearcher.id,
    leadAuthorOrcid: leadResearcher.orcid,
    citationCount: Math.floor(Math.random() * 300) + 1,
    downloadCount: Math.floor(Math.random() * 5000) + 50,
    altmetricScore: Math.floor(Math.random() * 100),
    openAccess: journal.openAccess,
    language: i % 10 === 0 ? 'id' : 'en',
    keywords: [journal.fields[0], journal.fields[1] || 'Sustainability', SDG_TITLES[sdg1][0].split(' ')[0]],
    type: ['journal-article', 'review-article', 'conference-paper'][i % 3],
    pages: `${100 + i}-${120 + i}`,
    volume: String(Math.floor(i / 4) + 1),
    issue: String((i % 4) + 1),
    sdgScores: {
      [sdg1]: parseFloat((0.6 + Math.random() * 0.4).toFixed(2)),
      ...(sdg2 !== sdg1 ? { [sdg2]: parseFloat((0.3 + Math.random() * 0.3).toFixed(2)) } : {}),
    },
  };
});

export const getArticleById    = (id)     => ARTICLES.find(a => a.id === id) || null;
export const getArticleByDoi   = (doi)    => ARTICLES.find(a => a.doi === doi) || null;
export const getArticlesBySdg  = (sdg)    => ARTICLES.filter(a => a.sdgs.includes(Number(sdg)));
export const getArticlesByAuthor = (rId)  => ARTICLES.filter(a => a.authors.includes(rId));
export const getArticlesByJournal= (jId)  => ARTICLES.filter(a => a.journalId === jId);
export const getRecentArticles = (n = 10) => [...ARTICLES].sort((a, b) => b.year - a.year).slice(0, n);
export const getTopArticles    = (n = 10) => [...ARTICLES].sort((a, b) => b.citationCount - a.citationCount).slice(0, n);

// Aggregate: SDG publication counts
export const SDG_PUBLICATION_COUNTS = Array.from({ length: 17 }, (_, i) => {
  const sdg = i + 1;
  return { sdg, count: ARTICLES.filter(a => a.sdgs.includes(sdg)).length };
});

// Aggregate: Publications by year
export const PUBLICATIONS_BY_YEAR = [2019, 2020, 2021, 2022, 2023, 2024].map(year => ({
  year,
  count: ARTICLES.filter(a => a.year === year).length,
}));
