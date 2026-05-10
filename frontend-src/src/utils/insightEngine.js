import { ARTICLES, SDG_PUBLICATION_COUNTS, PUBLICATIONS_BY_YEAR } from '../data/mock/articles';
import { RESEARCHERS } from '../data/mock/researchers';

const SDG_NAMES = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health & Well-being',
  4: 'Quality Education', 5: 'Gender Equality', 6: 'Clean Water & Sanitation',
  7: 'Affordable & Clean Energy', 8: 'Decent Work & Economic Growth',
  9: 'Industry, Innovation & Infrastructure', 10: 'Reduced Inequalities',
  11: 'Sustainable Cities & Communities', 12: 'Responsible Consumption & Production',
  13: 'Climate Action', 14: 'Life Below Water', 15: 'Life on Land',
  16: 'Peace, Justice & Strong Institutions', 17: 'Partnerships for the Goals',
};

export function generateInsights() {
  const sorted = [...SDG_PUBLICATION_COUNTS].sort((a, b) => b.count - a.count);
  const topSdg = sorted[0];
  const secondSdg = sorted[1];
  const leastSdg = sorted[sorted.length - 1];

  const yearCounts = PUBLICATIONS_BY_YEAR;
  const latestYear = yearCounts[yearCounts.length - 1];
  const prevYear = yearCounts[yearCounts.length - 2];
  const growthPct = prevYear.count > 0
    ? Math.round(((latestYear.count - prevYear.count) / prevYear.count) * 100)
    : 0;

  const totalArticles = ARTICLES.length;
  const totalCitations = ARTICLES.reduce((s, a) => s + a.citationCount, 0);
  const avgCitations = Math.round(totalCitations / totalArticles);

  const oaArticles = ARTICLES.filter(a => a.openAccess).length;
  const oaPct = Math.round((oaArticles / totalArticles) * 100);

  const topCited = [...ARTICLES].sort((a, b) => b.citationCount - a.citationCount)[0];

  const multiSdgArticles = ARTICLES.filter(a => a.sdgs.length > 1).length;
  const multiSdgPct = Math.round((multiSdgArticles / totalArticles) * 100);

  const sdg13Count = ARTICLES.filter(a => a.sdgs.includes(13)).length;
  const sdg4Count = ARTICLES.filter(a => a.sdgs.includes(4)).length;

  const institutionCounts = {};
  RESEARCHERS.forEach(r => {
    institutionCounts[r.institution] = (institutionCounts[r.institution] || 0) + 1;
  });
  const topInstitution = Object.entries(institutionCounts).sort((a, b) => b[1] - a[1])[0];

  const avgHIndex = Math.round(
    RESEARCHERS.reduce((s, r) => s + r.hIndex, 0) / RESEARCHERS.length
  );

  const wisCategories = { Exceptional: 0, High: 0, Moderate: 0, Low: 0 };
  RESEARCHERS.forEach(r => { wisCategories[r.wisCategory] = (wisCategories[r.wisCategory] || 0) + 1; });
  const topCategory = Object.entries(wisCategories).sort((a, b) => b[1] - a[1])[0];

  const q1Articles = ARTICLES.filter(a => a.quartile === 'Q1').length;
  const q1Pct = Math.round((q1Articles / totalArticles) * 100);

  return [
    {
      id: 1,
      sdg: topSdg.sdg,
      text: `SDG ${topSdg.sdg} (${SDG_NAMES[topSdg.sdg]}) menjadi topik riset terbanyak dengan ${topSdg.count} artikel terindeks — ${Math.round((topSdg.count / totalArticles) * 100)}% dari seluruh koleksi platform.`,
      trend: 'up',
    },
    {
      id: 2,
      sdg: 0,
      text: `Publikasi pada tahun ${latestYear.year} ${growthPct >= 0 ? 'meningkat' : 'turun'} ${Math.abs(growthPct)}% dibanding ${prevYear.year}, mencerminkan ${growthPct >= 0 ? 'pertumbuhan' : 'penurunan'} minat riset berkelanjutan.`,
      trend: growthPct >= 0 ? 'up' : 'down',
    },
    {
      id: 3,
      sdg: 13,
      text: `Riset terkait SDG 13 (Climate Action) mencakup ${sdg13Count} artikel — salah satu topik dengan pertumbuhan paling cepat di antara peneliti Indonesia.`,
      trend: 'up',
    },
    {
      id: 4,
      sdg: 0,
      text: `Rata-rata sitasi per artikel di platform ini adalah ${avgCitations}, menunjukkan dampak akademik yang signifikan dari riset berorientasi SDGs.`,
      trend: 'neutral',
    },
    {
      id: 5,
      sdg: 0,
      text: `${oaPct}% artikel tersedia sebagai open access, memperluas jangkauan dan dampak sosial penelitian bagi komunitas global.`,
      trend: 'up',
    },
    {
      id: 6,
      sdg: topCited.primarySdg,
      text: `Artikel dengan sitasi tertinggi (${topCited.citationCount}×) berjudul "${topCited.title.substring(0, 60)}..." — terkait SDG ${topCited.primarySdg}.`,
      trend: 'up',
    },
    {
      id: 7,
      sdg: 0,
      text: `${multiSdgPct}% artikel di platform ini relevan dengan lebih dari satu SDG, mencerminkan sifat interdisipliner riset pembangunan berkelanjutan.`,
      trend: 'neutral',
    },
    {
      id: 8,
      sdg: secondSdg.sdg,
      text: `SDG ${secondSdg.sdg} (${SDG_NAMES[secondSdg.sdg]}) menempati posisi kedua dengan ${secondSdg.count} artikel, menunjukkan minat riset yang konsisten dari komunitas akademik.`,
      trend: 'up',
    },
    {
      id: 9,
      sdg: 4,
      text: `Riset terkait SDG 4 (Quality Education) dengan ${sdg4Count} artikel — topik paling banyak diteliti oleh peneliti dari institusi pendidikan Indonesia.`,
      trend: 'up',
    },
    {
      id: 10,
      sdg: 0,
      text: `${topInstitution[0]} memiliki kontribusi peneliti terbanyak (${topInstitution[1]} peneliti), menjadikannya institusi paling aktif di platform Sciecola.`,
      trend: 'up',
    },
    {
      id: 11,
      sdg: 0,
      text: `Rata-rata H-Index peneliti di platform adalah ${avgHIndex}, dengan ${wisCategories.Exceptional + wisCategories.High} peneliti berkategori High atau Exceptional dalam Wizdam Impact Score.`,
      trend: 'neutral',
    },
    {
      id: 12,
      sdg: leastSdg.sdg,
      text: `SDG ${leastSdg.sdg} (${SDG_NAMES[leastSdg.sdg]}) masih under-represented dengan hanya ${leastSdg.count} artikel — peluang besar bagi peneliti yang ingin mengisi gap riset.`,
      trend: 'down',
    },
  ];
}

export const CACHED_INSIGHTS = generateInsights();
