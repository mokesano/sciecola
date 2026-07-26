/**
 * Local PHP backend API client.
 * Talks to the PHP layer at /api/SDG_Classification_API.php and related endpoints.
 */

const API_BASE = '/api/SDG_Classification_API.php';

async function get(params = {}) {
  const url = new URL(API_BASE, window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function post(params = {}) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(params).toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// ---------- ORCID ----------

/**
 * Initialise an ORCID analysis session.
 * Returns total_works count so the caller can paginate.
 */
export async function orcidInit(orcid) {
  return get({ action: 'orcid_init', orcid });
}

/**
 * Fetch one batch of classified works for an ORCID.
 */
export async function orcidBatch(orcid, offset = 0, batchSize = 20) {
  return get({ action: 'orcid_batch', orcid, offset, batch_size: batchSize });
}

// ---------- DOI ----------

/**
 * Classify a single article by DOI.
 */
export async function classifyDoi(doi) {
  return get({ action: 'doi', doi });
}

// ---------- Stats ----------

/**
 * Fetch global platform statistics (total articles, researchers, journals, etc.).
 */
export async function fetchStats() {
  return get({ action: 'stats' });
}

// ---------- Trends ----------

/**
 * Fetch SDG publication trend data by year.
 * Optional: filter by orcid or institutionId.
 */
export async function fetchTrends(filters = {}) {
  return get({ action: 'trends', ...filters });
}

export default { orcidInit, orcidBatch, classifyDoi, fetchStats, fetchTrends };
