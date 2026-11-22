<?php
declare(strict_types=1);

/**
 * @file api/wrapper/journal_profile.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Journal Profile API - Aggregates journal metrics with SDG classification.
 * 
 * Combines data from:
 * - Scopus journal-checker: Journal metrics (CiteScore, Quartile, SJR, SNIP)
 * - SDG Classification API: Article distribution by SDGs (optional)
 *
 * Response includes: journal info, metrics, coverage, SDG distribution
 *
 * @author Rochmady and Claude Code
 * @version 1.0.0
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
if (!defined('DB_DATABASE')) require_once ROOT_PATH . '/config/config.php';
require_once ROOT_PATH . '/includes/autoload.php';

try {
    // Validate ISSN parameter
    if (!isset($_GET['issn']) || empty(trim($_GET['issn']))) {
        throw new Exception('Parameter ISSN tidak boleh kosong', 400);
    }

    $issn = trim($_GET['issn']);

    // Clean ISSN format (remove dashes, accept with or without)
    $cleanIssn = str_replace('-', '', $issn);
    if (!preg_match('/^\d{4}\d{4}$/', $cleanIssn)) {
        throw new Exception('Format ISSN tidak valid. ISSN harus berformat XXXX-XXXX', 400);
    }

    // Step 1: Metrik Scopus (boleh gagal: banyak jurnal nasional tidak terindeks Scopus)
    $scopusData  = null;
    $scopusError = null;
    try {
        $scopusData = fetchScopusJournalMetrics($issn);
    } catch (Exception $e) {
        $scopusError = $e;
    }

    // Step 2: Data nyata dari database Sciecola (artikel, penulis, sitasi, SDG, tren)
    $localData = fetchLocalJournalData($issn);

    if ($scopusData === null && $localData === null) {
        throw $scopusError ?? new Exception('Jurnal tidak ditemukan', 404);
    }
    if ($scopusData === null) {
        $scopusData = emptyScopusData($issn, $localData);
    }

    // Step 3: Build unified response
    $response = buildJournalProfileResponse($scopusData, $localData ?? []);

    http_response_code(200);
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code($e->getCode() ?: 400);
    echo json_encode([
        'status'    => 'error',
        'code'      => $e->getCode() ?: 400,
        'message'   => $e->getMessage(),
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Fetch Scopus journal metrics.
 * Dulu lebih dulu memanggil http://localhost/api/scopus/journal-checker.php dan melempar error
 * bila gagal — di cPanel URL itu tidak ada, sehingga halaman jurnal selalu error 500 sebelum
 * sempat memakai jalur langsung di bawah. Kini langsung memakai jalur langsung.
 */
function fetchScopusJournalMetrics($issn) {
    // Format ISSN with dash for Scopus API
    $formattedIssn = substr(str_replace('-', '', $issn), 0, 4) . '-' . substr(str_replace('-', '', $issn), 4);
    return fetchScopusMetricsDirectly($formattedIssn);
}

/**
 * Call ScopusAPI class directly from journal-checker.php
 */
function fetchScopusMetricsDirectly($issn) {
    // Include the ScopusAPI class
    $journalCheckerPath = dirname(__DIR__) . '/../api/scopus/journal-checker.php';

    if (!file_exists($journalCheckerPath)) {
        throw new Exception('Journal checker API tidak ditemukan', 500);
    }

    // API key Scopus hanya dari environment (.env). Dulu ada key tertanam di kode ini —
    // key tersebut sebaiknya dicabut/diganti di portal Elsevier.
    $scopusApiKey = getenv('SCOPUS_API_KEY') ?: '';
    if ($scopusApiKey === '') {
        // Tanpa key lokal: pakai wizdam-apis (menyimpan key Scopus di servernya sendiri)
        $res = \Sciecola\Integration\SangiaApiClient::journalMetrics($issn);
        if ($res) {
            return mapWizdamJournalMetrics($res, $issn);
        }
        throw new Exception('Metrik Scopus tidak tersedia (SCOPUS_API_KEY / SANGIA_API_KEY belum diatur)', 503);
    }

    // We'll use output buffering to capture and parse
    // But first, let's create a simple cURL wrapper for Scopus API
    return fetchScopusDirectlyViaCurl($issn, $scopusApiKey);
}

/**
 * Fetch Scopus data directly via cURL
 */
function fetchScopusDirectlyViaCurl($issn, $apiKey) {
    // Clean ISSN
    $cleanIssn = str_replace('-', '', $issn);

    // Scopus API endpoint
    $url = "https://api.elsevier.com/content/serial/title/issn/" . $cleanIssn;

    $headers = [
        'Accept: application/json',
        'X-ELS-APIKey: ' . $apiKey,
        'User-Agent: JournalProfileAPI/1.0',
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception('Connection error: ' . $error, 500);
    }

    if ($httpCode === 401) {
        throw new Exception('Invalid Scopus API Key', 401);
    }

    if ($httpCode === 404) {
        throw new Exception('Jurnal dengan ISSN ' . $issn . ' tidak ditemukan di Scopus', 404);
    }

    if ($httpCode !== 200) {
        throw new Exception('Scopus API error: HTTP ' . $httpCode, 500);
    }

    $data = json_decode($response, true);
    if (!$data) {
        throw new Exception('Invalid JSON response from Scopus API', 500);
    }

    // Parse Scopus response
    return parseScopusResponse($data, $issn);
}

/**
 * Parse Scopus API response and extract journal metrics
 */
function parseScopusResponse($data, $originalIssn) {
    if (!isset($data['serial-metadata-response']['entry'][0])) {
        throw new Exception('Jurnal tidak ditemukan di Scopus', 404);
    }

    $entry = $data['serial-metadata-response']['entry'][0];

    return [
        'success'           => true,
        'issn'              => $originalIssn,
        'title'             => $entry['dc:title'] ?? 'N/A',
        'publisher'         => $entry['dc:publisher'] ?? 'N/A',
        'scopus_id'         => $entry['source-id'] ?? null,
        'subject_areas'     => extractSubjectAreas($entry),
        'citescore'         => extractCiteScore($entry),
        'citescore_year'    => extractCiteScoreYear($entry),
        'quartile'          => extractQuartile($entry),
        'quartile_year'     => extractQuartileYear($entry),
        'sjr'               => extractSJR($entry),
        'snip'              => extractSNIP($entry),
        'coverage_start'    => extractCoverageStart($entry),
        'coverage_end'      => extractCoverageEnd($entry),
        'open_access'       => extractOpenAccessStatus($entry),
        'country'           => extractCountry($entry),
        'publication_type'  => extractPublicationType($entry),
    ];
}

/**
 * Extract subject areas from Scopus response
 */
function extractSubjectAreas($entry) {
    $subjects = [];

    if (isset($entry['subject-area']) && is_array($entry['subject-area'])) {
        foreach ($entry['subject-area'] as $subject) {
            if (is_array($subject) && isset($subject['$'])) {
                $subjects[] = $subject['$'];
            } elseif (is_string($subject)) {
                $subjects[] = $subject;
            }
        }
    }

    return $subjects;
}

/**
 * Extract CiteScore from response
 */
function extractCiteScore($entry) {
    if (isset($entry['citeScoreYearInfoList']['citeScoreCurrentMetric'])) {
        return (float)$entry['citeScoreYearInfoList']['citeScoreCurrentMetric'];
    }
    return null;
}

/**
 * Extract CiteScore year
 */
function extractCiteScoreYear($entry) {
    if (isset($entry['citeScoreYearInfoList']['citeScoreCurrentMetricYear'])) {
        return (int)$entry['citeScoreYearInfoList']['citeScoreCurrentMetricYear'];
    }
    return null;
}

/**
 * Extract Quartile from SJR data
 */
function extractQuartile($entry) {
    if (isset($entry['SJRList']['SJR'])) {
        $sjrList = $entry['SJRList']['SJR'];
        if (is_array($sjrList) && !empty($sjrList)) {
            $latest = end($sjrList);
            if (isset($latest['quartile'])) {
                return $latest['quartile'];
            }
        }
    }
    return null;
}

/**
 * Extract Quartile year
 */
function extractQuartileYear($entry) {
    if (isset($entry['SJRList']['SJR'])) {
        $sjrList = $entry['SJRList']['SJR'];
        if (is_array($sjrList) && !empty($sjrList)) {
            $latest = end($sjrList);
            if (isset($latest['@year'])) {
                return (int)$latest['@year'];
            }
        }
    }
    return null;
}

/**
 * Extract SJR
 */
function extractSJR($entry) {
    if (isset($entry['SJRList']['SJR'])) {
        $sjrList = $entry['SJRList']['SJR'];
        if (is_array($sjrList) && !empty($sjrList)) {
            $latest = end($sjrList);
            if (isset($latest['$'])) {
                return (float)$latest['$'];
            }
        }
    }
    return null;
}

/**
 * Extract SNIP
 */
function extractSNIP($entry) {
    if (isset($entry['SNIPList']['SNIP'])) {
        $snipList = $entry['SNIPList']['SNIP'];
        if (is_array($snipList) && !empty($snipList)) {
            $latest = end($snipList);
            if (isset($latest['$'])) {
                return (float)$latest['$'];
            }
        }
    }
    return null;
}

/**
 * Extract coverage start year
 */
function extractCoverageStart($entry) {
    if (isset($entry['coverageStartYear'])) {
        return (int)$entry['coverageStartYear'];
    }
    return null;
}

/**
 * Extract coverage end year
 */
function extractCoverageEnd($entry) {
    if (isset($entry['coverageEndYear'])) {
        return (int)$entry['coverageEndYear'];
    }
    return null;
}

/**
 * Extract open access status
 */
function extractOpenAccessStatus($entry) {
    if (isset($entry['openAccess']['openAccessStatus'])) {
        return strtolower($entry['openAccess']['openAccessStatus']) === 'all' || strtolower($entry['openAccess']['openAccessStatus']) === 'hybrid';
    }
    return false;
}

/**
 * Extract country
 */
function extractCountry($entry) {
    if (isset($entry['dc:coverage'])) {
        return $entry['dc:coverage'];
    }
    return null;
}

/**
 * Extract publication type
 */
function extractPublicationType($entry) {
    if (isset($entry['publicationType']['$'])) {
        return $entry['publicationType']['$'];
    }
    return 'Journal';
}

/**
 * Build unified journal profile response
 */
function buildJournalProfileResponse($scopusData, $sdgData = []) {
    if (empty($scopusData['success'])) {
        throw new Exception($scopusData['error'] ?? 'Failed to fetch journal data', 500);
    }

    // Data nyata dari database Sciecola (kosong bila jurnal belum punya artikel tersimpan)
    $sdgDistribution  = $sdgData['sdg_distribution'] ?? [];
    $publicationTrend = $sdgData['publication_trend'] ?? [];
    $citationTrend    = []; // belum ada data sitasi per tahun

    return [
        'status'             => 'success',
        'id'                 => sanitizeId($scopusData['title']),
        'name'               => $scopusData['title'] ?? 'Unknown Journal',
        'issn'               => $scopusData['issn'] ?? null,
        'eissn'              => $scopusData['issn'] ?? null, // Scopus doesn't distinguish
        'publisher'          => $scopusData['publisher'] ?? 'Unknown Publisher',
        'website'            => null, // Not available from Scopus API
        'subject'            => !empty($scopusData['subject_areas']) ? $scopusData['subject_areas'][0] : 'Multidisciplinary',
        'country'            => $scopusData['country'] ?? null,
        'language'           => 'English',
        'established'        => (string)($scopusData['coverage_start'] ?? date('Y')),
        'frequency'          => 'Regular',
        'coverImage'         => null, // No image from Scopus
        'scope'              => null,
        'editorialBoard'     => [],

        // Stats from Scopus
        'totalArticles'      => (int) ($sdgData['total_articles'] ?? 0),
        'totalAuthors'       => (int) ($sdgData['total_authors'] ?? 0),
        'totalCitations'     => (int) ($sdgData['total_citations'] ?? 0),
        'totalViews'         => 0, // belum ada pelacakan kunjungan
        'impactScore'        => $scopusData['citescore'] ?? 0,
        'sdgsCovered'        => count($sdgDistribution),

        // Performance metrics
        'acceptanceRate'     => 'N/A',
        'avgReviewTime'      => 'N/A',
        'avgPublishTime'     => 'N/A',
        'citationsPerArticle' => 'N/A',
        'hIndex'             => 'N/A',

        // Scopus metrics
        'citescore'          => $scopusData['citescore'],
        'citeScoreYear'      => $scopusData['citescore_year'],
        'quartile'           => $scopusData['quartile'],
        'quartileYear'       => $scopusData['quartile_year'],
        'sjr'                => $scopusData['sjr'],
        'snip'               => $scopusData['snip'],
        'coverageStart'      => $scopusData['coverage_start'],
        'coverageEnd'        => $scopusData['coverage_end'],
        'openAccess'         => $scopusData['open_access'],
        'publicationType'    => $scopusData['publication_type'],
        'scopusId'           => $scopusData['scopus_id'],

        // Subject areas
        'subjectAreas'       => $scopusData['subject_areas'],

        // SDG Distribution
        'sdgDistribution'    => $sdgDistribution,

        // Trends
        'publicationTrend'   => $publicationTrend,
        'citationTrend'      => $citationTrend,

        'topArticles'        => $sdgData['top_articles'] ?? [],
        'accessStats'        => [], // belum ada pelacakan kunjungan/unduhan
        'indexing'           => !empty($scopusData['scopus_id']) ? ['Scopus'] : [],

        'timestamp'          => date('c'),
        'api_version'        => 'v1.0.0',
    ];
}

/**
 * Generate sample SDG distribution
 */
function generateSampleSDGDistribution() {
    return [
        ['name' => 'Climate Action', 'value' => 15, 'color' => '#10b981', 'sdg' => 13],
        ['name' => 'Sustainable Cities', 'value' => 12, 'color' => '#f59e0b', 'sdg' => 11],
        ['name' => 'Good Health', 'value' => 10, 'color' => '#ef4444', 'sdg' => 3],
        ['name' => 'Clean Energy', 'value' => 8, 'color' => '#fbbf24', 'sdg' => 7],
        ['name' => 'Quality Education', 'value' => 6, 'color' => '#3b82f6', 'sdg' => 4],
        ['name' => 'Others', 'value' => 10, 'color' => '#6b7280', 'sdg' => 0],
    ];
}

/**
 * Generate sample publication trend
 */
function generateSamplePublicationTrend() {
    $trend = [];
    $currentYear = (int)date('Y');

    for ($i = 6; $i >= 0; $i--) {
        $year = $currentYear - $i;
        $trend[] = [
            'year'  => (string)$year,
            'count' => 40 + ($i * 8),
        ];
    }

    return $trend;
}

/**
 * Generate sample citation trend
 */
function generateSampleCitationTrend() {
    $trend = [];
    $currentYear = (int)date('Y');

    for ($i = 6; $i >= 0; $i--) {
        $year = $currentYear - $i;
        $trend[] = [
            'year'      => (string)$year,
            'citations' => 300 + ($i * 150),
        ];
    }

    return $trend;
}

/**
 * Generate sample access stats
 */
function generateSampleAccessStats() {
    $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    $stats = [];

    foreach ($months as $month) {
        $stats[] = [
            'month' => $month,
            'views' => mt_rand(5000, 15000),
        ];
    }

    return $stats;
}

/**
 * Sanitize ID from journal name
 */
function sanitizeId($name) {
    $id = strtolower($name);
    $id = preg_replace('/[^a-z0-9]+/', '-', $id);
    $id = trim($id, '-');
    return $id;
}

/**
 * Data jurnal dari database Sciecola berdasarkan ISSN (print atau elektronik).
 * @return array|null null bila jurnal tidak ada di database
 */
function fetchLocalJournalData($issn) {
    $pdo = \Sciecola\Database\Db::pdo();
    if ($pdo === null) return null;
    $clean = str_replace('-', '', $issn);
    $dash  = substr($clean, 0, 4) . '-' . substr($clean, 4);
    try {
        $st = $pdo->prepare('SELECT * FROM journals WHERE issn IN (?, ?) OR e_issn IN (?, ?) LIMIT 1');
        $st->execute([$dash, $clean, $dash, $clean]);
        $j = $st->fetch(PDO::FETCH_ASSOC);
        if (!$j) return null;
        $jid = (int) $j['id'];

        $tot = $pdo->prepare('SELECT COUNT(*) AS n, COALESCE(SUM(citation_count),0) AS c FROM publications WHERE journal_id = ?');
        $tot->execute([$jid]);
        $t = $tot->fetch(PDO::FETCH_ASSOC);

        $au = $pdo->prepare('SELECT COUNT(DISTINCT pa.name) FROM publication_authors pa JOIN publications p ON p.doi = pa.doi WHERE p.journal_id = ?');
        $au->execute([$jid]);

        $tr = $pdo->prepare('SELECT publication_year AS y, COUNT(*) AS n FROM publications WHERE journal_id = ? AND publication_year IS NOT NULL GROUP BY publication_year ORDER BY publication_year');
        $tr->execute([$jid]);
        $trend = array_map(fn ($r) => ['year' => (string) $r['y'], 'articles' => (int) $r['n']], $tr->fetchAll(PDO::FETCH_ASSOC));

        $sd = $pdo->prepare('SELECT ws.sdg_number AS sdg, COUNT(DISTINCT ws.doi) AS n FROM work_sdgs ws JOIN publications p ON p.doi = ws.doi WHERE p.journal_id = ? GROUP BY ws.sdg_number ORDER BY n DESC');
        $sd->execute([$jid]);
        $rows = $sd->fetchAll(PDO::FETCH_ASSOC);
        $sum  = max(1, array_sum(array_column($rows, 'n')));
        $dist = array_map(fn ($r) => [
            'sdg'   => (int) $r['sdg'],
            'name'  => 'SDG ' . (int) $r['sdg'],
            'value' => (int) round($r['n'] / $sum * 100),
            'count' => (int) $r['n'],
        ], $rows);

        $ta = $pdo->prepare('SELECT doi, title, publication_year, citation_count FROM publications WHERE journal_id = ? ORDER BY citation_count DESC, publication_year DESC LIMIT 5');
        $ta->execute([$jid]);
        $top = array_map(fn ($r) => [
            'doi' => $r['doi'], 'title' => $r['title'],
            'year' => $r['publication_year'] !== null ? (int) $r['publication_year'] : null,
            'citations' => (int) $r['citation_count'],
        ], $ta->fetchAll(PDO::FETCH_ASSOC));

        return [
            'journal'           => $j,
            'total_articles'    => (int) $t['n'],
            'total_citations'   => (int) $t['c'],
            'total_authors'     => (int) $au->fetchColumn(),
            'publication_trend' => $trend,
            'sdg_distribution'  => $dist,
            'top_articles'      => $top,
        ];
    } catch (Throwable $e) {
        return null;
    }
}

/** Kerangka data Scopus kosong untuk jurnal yang hanya ada di database lokal. */
function emptyScopusData($issn, array $local) {
    $j = $local['journal'] ?? [];
    return [
        'success' => true, 'issn' => $j['issn'] ?? $issn, 'title' => $j['title'] ?? 'Unknown Journal',
        'publisher' => $j['publisher'] ?? null, 'scopus_id' => null, 'subject_areas' => [],
        'citescore' => isset($j['cite_score']) ? (float) $j['cite_score'] : null, 'citescore_year' => null,
        'quartile' => isset($j['quartile']) ? 'Q' . (int) $j['quartile'] : null, 'quartile_year' => null,
        'sjr' => isset($j['sjr_score']) ? (float) $j['sjr_score'] : null, 'snip' => isset($j['snip_score']) ? (float) $j['snip_score'] : null,
        'coverage_start' => null, 'coverage_end' => null, 'open_access' => null,
        'country' => $j['country'] ?? null, 'publication_type' => 'Journal',
    ];
}

/** Memetakan respons wizdam-apis /api/v1/journal/metrics ke bentuk parseScopusResponse(). */
function mapWizdamJournalMetrics(array $res, $issn) {
    $j = $res['journal'] ?? [];
    $m = $res['metrics'] ?? [];
    return [
        'success' => true, 'issn' => $j['issn_print'] ?? $issn, 'title' => $j['title'] ?? 'N/A',
        'publisher' => $j['publisher'] ?? 'N/A', 'scopus_id' => null,
        'subject_areas' => array_values(array_filter(array_map(fn ($a) => $a['name'] ?? null, $m['subject_areas'] ?? []))),
        'citescore' => $m['citescore'] ?? null, 'citescore_year' => null,
        'quartile' => $m['quartile'] ?? null, 'quartile_year' => null,
        'sjr' => $m['sjr'] ?? null, 'snip' => $m['snip'] ?? null,
        'coverage_start' => null, 'coverage_end' => null,
        'open_access' => $j['open_access'] ?? null, 'country' => null,
        'publication_type' => $j['publication_type'] ?? 'Journal',
    ];
}
