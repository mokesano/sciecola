/**
 * wizdamApiContract.js
 *
 * Letakkan di: /frontend-src/src/api/wizdamApiContract.js (sdgs-mapper)
 *
 * Contract layer untuk semua panggilan ke api.sangia.org dari React.
 * Memastikan data yang masuk ke komponen sudah tervalidasi strukturnya.
 *
 * Penggunaan di komponen React:
 *   import { fetchResearcherProfile, fetchDoiAnalysis } from '../api/wizdamApiContract';
 *
 *   const profile = await fetchResearcherProfile('0000-0002-1234-5678');
 *   // profile.researcher_info.name sudah dijamin ada
 */

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const CONTRACT_VERSION = '1.0.0';

// ─── Tipe data (JSDoc untuk IDE autocomplete) ─────────────────────────────────

/**
 * @typedef {Object} ResearcherInfo
 * @property {string} name
 * @property {string} orcid
 * @property {string|null} affiliation
 * @property {string|null} country
 * @property {string|null} avatar_url
 */

/**
 * @typedef {Object} SdgSummaryItem
 * @property {number} work_count
 * @property {number} avg_confidence  - 0 sampai 1
 * @property {number} [percentage]
 */

/**
 * @typedef {Object} ImpactMetrics
 * @property {number} h_index
 * @property {number} citations
 * @property {number} impact_score
 * @property {{ year: number, count: number }[]} [citation_trend]
 * @property {number} [wizdam_impact_score]
 */

/**
 * @typedef {Object} WorkItem
 * @property {string} title
 * @property {string|null} doi
 * @property {number|null} year
 * @property {string[]} [sdg_classifications]      - ['SDG3', 'SDG6']
 * @property {Record<string, number>} [confidence_scores]  - { SDG3: 0.92 }
 */

/**
 * @typedef {Object} OrcidAnalysisData
 * @property {ResearcherInfo} researcher_info
 * @property {Record<string, SdgSummaryItem>} sdg_summary
 * @property {WorkItem[]} works
 * @property {ImpactMetrics} [impact_metrics]
 * @property {number} [total_works]
 */


// ─── Validator internal ───────────────────────────────────────────────────────

class WizdamContractError extends Error {
    constructor(message) {
        super(`[Wizdam Contract] ${message}`);
        this.name = 'WizdamContractError';
    }
}

class WizdamApiError extends Error {
    constructor(message, errorCode = 'UNKNOWN_ERROR', httpStatus = 0) {
        super(message);
        this.name = 'WizdamApiError';
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }
}

function assertString(value, path) {
    if (typeof value !== 'string') {
        throw new WizdamContractError(`${path}: diharapkan string, dapat ${typeof value}`);
    }
}

function assertNumber(value, path, min = -Infinity, max = Infinity) {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new WizdamContractError(`${path}: diharapkan number, dapat ${typeof value}`);
    }
    if (value < min || value > max) {
        throw new WizdamContractError(`${path}: nilai ${value} di luar rentang [${min}, ${max}]`);
    }
}

function assertArray(value, path) {
    if (!Array.isArray(value)) {
        throw new WizdamContractError(`${path}: diharapkan array, dapat ${typeof value}`);
    }
}

function assertObject(value, path) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new WizdamContractError(`${path}: diharapkan object, dapat ${Array.isArray(value) ? 'array' : typeof value}`);
    }
}

function requireKeys(obj, keys, path) {
    for (const key of keys) {
        if (!(key in obj)) {
            throw new WizdamContractError(
                `${path}: field wajib '${key}' tidak ditemukan. Ada: ${Object.keys(obj).join(', ')}`
            );
        }
    }
}

function assertOrcid(value, path = 'orcid') {
    if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(value)) {
        throw new WizdamContractError(`${path}: format ORCID tidak valid: '${value}'`);
    }
}

function assertSdgId(sdgId, path = '') {
    if (!/^SDG(1[0-7]|[1-9])$/.test(sdgId)) {
        throw new WizdamContractError(`${path}: SDG ID tidak valid: '${sdgId}'. Harus SDG1–SDG17`);
    }
}

/**
 * Validasi envelope standar dan kembalikan data.
 * @param {any} parsed - Hasil JSON.parse
 * @param {string} context
 * @returns {any} parsed.data
 */
function validateEnvelope(parsed, context) {
    assertObject(parsed, context);
    requireKeys(parsed, ['status'], context);

    const validStatuses = ['success', 'error', 'pending'];
    if (!validStatuses.includes(parsed.status)) {
        throw new WizdamContractError(
            `${context}: 'status' harus [${validStatuses.join(', ')}], dapat: '${parsed.status}'`
        );
    }

    if (parsed.status === 'error') {
        throw new WizdamApiError(
            parsed.message ?? 'API mengembalikan error tanpa pesan',
            parsed.error_code ?? 'UNKNOWN_ERROR'
        );
    }

    if (parsed.status === 'success' && !('data' in parsed)) {
        throw new WizdamContractError(`${context}: status=success tapi tidak ada field 'data'`);
    }

    return parsed.data;
}

function validateResearcherInfo(ri, path = 'researcher_info') {
    assertObject(ri, path);
    requireKeys(ri, ['name', 'orcid'], path);
    assertString(ri.name, `${path}.name`);
    assertOrcid(ri.orcid, `${path}.orcid`);
}

function validateImpactMetrics(im, path = 'impact_metrics') {
    assertObject(im, path);
    requireKeys(im, ['h_index', 'citations', 'impact_score'], path);
    assertNumber(im.h_index, `${path}.h_index`, 0);
    assertNumber(im.citations, `${path}.citations`, 0);
    assertNumber(im.impact_score, `${path}.impact_score`, 0);
}

function validateWorkItem(work, path) {
    assertObject(work, path);
    requireKeys(work, ['title'], path);
    assertString(work.title, `${path}.title`);

    if (work.confidence_scores !== undefined) {
        assertObject(work.confidence_scores, `${path}.confidence_scores`);
        for (const [sdgId, score] of Object.entries(work.confidence_scores)) {
            assertSdgId(sdgId, `${path}.confidence_scores`);
            assertNumber(score, `${path}.confidence_scores.${sdgId}`, 0, 1);
        }
    }
}


// ─── HTTP fetch wrapper ───────────────────────────────────────────────────────

async function wizdamFetch(endpoint, options = {}) {
    const url = `${API_BASE}/${endpoint.replace(/^\//, '')}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Contract-Version': CONTRACT_VERSION,
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
    });

    if (response.status === 429) {
        throw new WizdamApiError('Rate limit tercapai', 'RATE_LIMITED', 429);
    }

    if (response.status >= 500) {
        throw new WizdamApiError(`Server error ${response.status}`, 'SERVER_ERROR', response.status);
    }

    const rawText = await response.text();

    let parsed;
    try {
        parsed = JSON.parse(rawText);
    } catch {
        throw new WizdamContractError(`Response bukan JSON valid dari ${endpoint}: ${rawText.slice(0, 200)}`);
    }

    return parsed;
}


// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Ambil profil peneliti dari api atau /api/researcher_profile.php
 *
 * @param {string} orcid
 * @param {AbortSignal} [signal]
 * @returns {Promise<OrcidAnalysisData>}
 */
export async function fetchResearcherProfile(orcid, signal) {
    assertOrcid(orcid, 'orcid parameter');

    const parsed = await wizdamFetch(`researcher_profile.php?orcid=${encodeURIComponent(orcid)}`, {
        method: 'GET',
        signal,
    });

    const data = validateEnvelope(parsed, 'OrcidAnalysis');

    requireKeys(data, ['researcher_info', 'sdg_summary', 'works'], 'data');
    validateResearcherInfo(data.researcher_info);

    assertObject(data.sdg_summary, 'sdg_summary');
    for (const [sdgId, summary] of Object.entries(data.sdg_summary)) {
        assertSdgId(sdgId, 'sdg_summary');
        requireKeys(summary, ['work_count', 'avg_confidence'], `sdg_summary.${sdgId}`);
    }

    assertArray(data.works, 'works');
    data.works.forEach((w, i) => validateWorkItem(w, `works[${i}]`));

    if (data.impact_metrics) {
        validateImpactMetrics(data.impact_metrics);
    }

    return data;
}

/**
 * Analisis SDG untuk satu artikel berdasarkan DOI
 *
 * @param {string} doi
 * @param {AbortSignal} [signal]
 */
export async function fetchDoiAnalysis(doi, signal) {
    if (!doi || typeof doi !== 'string') {
        throw new WizdamContractError('doi harus berupa string tidak kosong');
    }

    const parsed = await wizdamFetch(`article_profile.php?doi=${encodeURIComponent(doi)}`, {
        signal,
    });

    const data = validateEnvelope(parsed, 'DoiAnalysis');
    requireKeys(data, ['work'], 'data');
    validateWorkItem(data.work, 'work');

    return data;
}

/**
 * Hitung impact metrics (h-index, citations, dll)
 * Memanggil POST /api/v1/impact/calculate di wizdam-apis
 *
 * @param {{ orcid: string, identifiers?: string[] }} payload
 * @param {AbortSignal} [signal]
 * @returns {Promise<ImpactMetrics>}
 */
export async function fetchImpactMetrics(payload, signal) {
    assertOrcid(payload.orcid, 'payload.orcid');

    const parsed = await wizdamFetch('impact/calculate', {
        body: payload,
        signal,
    });

    const data = validateEnvelope(parsed, 'ImpactCalculate');
    validateImpactMetrics(data);

    return data;
}

/**
 * Poll status async job
 *
 * @param {string} jobId
 * @param {AbortSignal} [signal]
 */
export async function fetchJobStatus(jobId, signal) {
    if (!jobId) throw new WizdamContractError('jobId tidak boleh kosong');

    const parsed = await wizdamFetch(`crawl_queue.php?action=status&job_id=${encodeURIComponent(jobId)}`, {
        signal,
    });

    const data = validateEnvelope(parsed, 'AsyncJob');
    requireKeys(data, ['job_id', 'status'], 'data');

    const validStatuses = ['pending', 'running', 'completed', 'failed'];
    if (!validStatuses.includes(data.status)) {
        throw new WizdamContractError(`data.status harus [${validStatuses.join(', ')}], dapat: '${data.status}'`);
    }

    return data;
}

// ─── Export tipe error untuk dipakai di komponen ─────────────────────────────

export { WizdamContractError, WizdamApiError };


// ─── React hook helper (opsional, tapi direkomendasikan) ─────────────────────

/**
 * Contoh penggunaan di komponen React:
 *
 * import { useWizdamFetch } from '../api/wizdamApiContract';
 *
 * function ResearcherProfile({ orcid }) {
 *   const { data, loading, error } = useWizdamFetch(
 *     () => fetchResearcherProfile(orcid),
 *     [orcid]
 *   );
 *
 *   if (loading) return <Spinner />;
 *   if (error instanceof WizdamContractError) return <ContractErrorBanner />;
 *   if (error instanceof WizdamApiError) return <ApiErrorBanner code={error.errorCode} />;
 *   return <ProfileView data={data} />;
 * }
 */