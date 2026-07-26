/**
 * Wizdam APIs client — wraps https://api.sangia.org endpoints.
 * All requests are proxied through the local PHP backend (/api/proxy.php)
 * to keep the API key server-side and avoid CORS issues.
 */

// Dinamis: Baca dari .env, fallback ke path relatif jika kosong
const ENV_BASE = import.meta.env.VITE_API_BASE_URL || '';
const BASE_URL = ENV_BASE 
  ? `${ENV_BASE.replace(/\/$/, '')}/api/proxy.php`
  : '/api/proxy.php';

async function request(endpoint, method = 'GET', body = null, params = {}) {
  const url = new URL(BASE_URL, window.location.origin);
  url.searchParams.set('endpoint', endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url.toString(), options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---------- ORCID ----------

/**
 * Fetch researcher profile and works from ORCID.
 * @param {string} orcid  – ORCID iD (0000-0000-0000-0000)
 * @param {object} [supplied] – Optional pre-fetched data from local DB
 */
export async function fetchOrcidProfile(orcid, supplied = null) {
  const body = supplied
    ? { supplied_works: supplied.works, supplied_person: supplied.person }
    : null;
  return request('/api/v1/orcid/profile', body ? 'POST' : 'GET', body, { orcid });
}

// ---------- SDG Classification ----------

/**
 * Classify a single article by title/abstract.
 */
export async function classifyText(title, abstract) {
  return request('/api/v1/sdg/classify', 'POST', { title, abstract });
}

/**
 * Classify by DOI (Crossref lookup + classify).
 */
export async function classifyDoi(doi) {
  return request('/api/v1/sdg/classify', 'POST', { doi });
}

/**
 * Classify all works for an ORCID researcher.
 * @param {string} orcid
 * @param {number} offset  – pagination offset
 * @param {number} batchSize
 */
export async function classifyOrcid(orcid, offset = 0, batchSize = 20) {
  return request('/api/v1/sdg/classify', 'POST', {
    orcid,
    offset,
    batch_size: batchSize,
  });
}

// ---------- Citation / DOI ----------

/**
 * Fetch citation metadata for a DOI via Crossref.
 */
export async function fetchCitation(doi) {
  return request('/api/v1/citation/doi', 'GET', null, { doi });
}

// ---------- Journal ----------

/**
 * Fetch journal metrics by ISSN.
 */
export async function fetchJournalMetrics(issn) {
  return request('/api/v1/journal/metrics', 'GET', null, { issn });
}

// ---------- Trends ----------

/**
 * Analyse publication trends for a set of works.
 * @param {Array} works  – array of { title, abstract, publication_year, sdgs? }
 */
export async function analyzeTrends(works) {
  return request('/api/v1/trend/analyze', 'POST', { works });
}

// ---------- Impact ----------

/**
 * Calculate Wizdam Impact Score for a researcher.
 */
export async function calculateImpact(orcid, suppliedData = null) {
  const body = { orcid, ...(suppliedData || {}) };
  return request('/api/v1/impact/calculate', 'POST', body);
}

// ---------- Scopus ----------

/**
 * Fetch Scopus author metrics.
 */
export async function fetchScopusAuthor(scopusId) {
  return request('/api/v1/scopus/author', 'GET', null, { author_id: scopusId });
}

export default {
  fetchOrcidProfile,
  classifyText,
  classifyDoi,
  classifyOrcid,
  fetchCitation,
  fetchJournalMetrics,
  analyzeTrends,
  calculateImpact,
  fetchScopusAuthor,
};
