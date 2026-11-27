<?php
declare(strict_types=1);

/**
 * @file api/wrapper/article_profile.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Article Profile API - Aggregates DOI article data with SDG classification and journal metrics.
 * Combines data from:
 * - Database sangia_ecosystem (publications, publication_authors, work_sdgs, journals), bila ada
 * - Mesin SDG lokal (SdgEngine, in-process) bila DOI belum ada di database; hasilnya disimpan ke DB
 * - Crossref API: Journal ISSN (via Crossref direct call)
 * - wizdam-apis /api/v1/journal/metrics: Journal metrics (CiteScore, Quartile, SJR, SNIP)
 *
 * Response includes: article info, authors, SDG distribution, journal metrics, citation trends
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
    // Validate DOI parameter
    if (!isset($_GET['doi']) || empty(trim($_GET['doi']))) {
        throw new Exception('Parameter DOI tidak boleh kosong', 400);
    }

    $doi = trim($_GET['doi']);
    $force_refresh = isset($_GET['refresh']) && $_GET['refresh'] === 'true';

    // Clean DOI
    $clean_doi = preg_replace('/^https?:\/\/(dx\.)?doi\.org\//i', '', $doi);
    $clean_doi = preg_replace('/^doi:/i', '', $clean_doi);
    $clean_doi = trim($clean_doi);

    if (!preg_match('/^10\.\d{4,}\//', $clean_doi)) {
        throw new Exception('Format DOI tidak valid. DOI harus diawali dengan "10.xxxx/"', 400);
    }

    $doi = $clean_doi;

    // Step 1: Data artikel + SDG (database dulu, lalu mesin SDG lokal)
    @set_time_limit(60);
    $articleData = getArticleData($doi, $force_refresh);

    // Step 2: Extract journal ISSN and fetch Scopus metrics
    $journalData = [];
    if (!empty($articleData['journal'])) {
        $issn = extractISSNFromCrossref($doi);
        if ($issn) {
            $journalData = fetchScopusJournalData($issn);
        }
    }

    // Step 3: Build response combining all data
    $response = buildArticleProfileResponse($articleData, $journalData);

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
 * Data artikel + klasifikasi SDG.
 * 1) Database (publications + publication_authors + work_sdgs + journals) bila DOI sudah tersimpan.
 * 2) Mesin SDG lokal di proses yang sama (SdgEngine); hasilnya langsung disimpan ke database.
 * Dulu fungsi ini memanggil http://localhost/api/SDG_Classification_API.php — URL yang tidak ada
 * di susunan cPanel (document root = public/) sehingga halaman selalu error 500.
 */
function getArticleData($doi, $force_refresh = false) {
    $doi = strtolower($doi);

    if (!$force_refresh && ($fromDb = getArticleFromDatabase($doi)) !== null) {
        return $fromDb;
    }

    try {
        $data = \Sciecola\Sdg\SdgEngine::doi($doi, (bool) $force_refresh);
    } catch (Throwable $e) {
        $code = (int) $e->getCode();
        throw new Exception('Analisis SDG gagal: ' . $e->getMessage(), $code >= 400 && $code < 600 ? $code : 502);
    }

    $pdo = \Sciecola\Database\Db::pdo();
    if ($pdo !== null) {
        try {
            (new \Sciecola\Cache\CacheMigrator($pdo, ROOT_PATH . '/cache'))->migrateData($data, 'article_profile:' . $doi);
        } catch (Throwable $e) {
            // tampilan tetap jalan walau penyimpanan gagal
        }
    }
    $data['data_source'] = 'engine';
    return $data;
}

/**
 * Menyusun data artikel dari database dalam bentuk yang sama dengan keluaran mesin SDG.
 * Dipakai bila DOI sudah punya hasil klasifikasi (work_sdgs) atau abstrak tersimpan.
 */
function getArticleFromDatabase($doi) {
    $pdo = \Sciecola\Database\Db::pdo();
    if ($pdo === null) return null;
    try {
        $st = $pdo->prepare('SELECT p.*, j.title AS journal_title FROM publications p LEFT JOIN journals j ON j.id = p.journal_id WHERE p.doi = ?');
        $st->execute([$doi]);
        $p = $st->fetch(PDO::FETCH_ASSOC);
        if (!$p) return null;

        $st = $pdo->prepare('SELECT sdg_number, confidence, classification_detail FROM work_sdgs WHERE doi = ? ORDER BY confidence DESC');
        $st->execute([$doi]);
        $sdgRows = $st->fetchAll(PDO::FETCH_ASSOC);
        if ($sdgRows === [] && trim((string) $p['abstract']) === '') {
            return null; // belum pernah diklasifikasi: jalankan mesin
        }

        $st = $pdo->prepare('SELECT name FROM publication_authors WHERE doi = ? ORDER BY sequence');
        $st->execute([$doi]);
        $authors = $st->fetchAll(PDO::FETCH_COLUMN);

        $sdgs = []; $confidence = []; $detailed = []; $ctypes = [];
        foreach ($sdgRows as $r) {
            $key = 'SDG' . (int) $r['sdg_number'];
            $sdgs[] = $key;
            if ($r['confidence'] !== null) $confidence[$key] = (float) $r['confidence'];
            $detail = json_decode((string) $r['classification_detail'], true) ?: [];
            if (!empty($detail['analysis'])) $detailed[$key] = $detail['analysis'];
            if (!empty($detail['contributor_type'])) $ctypes[$key] = $detail['contributor_type'];
        }
        $raw = json_decode((string) $p['raw_data_json'], true) ?: [];

        return [
            'status'            => 'success',
            'doi'               => $p['doi'],
            'title'             => $p['title'],
            'abstract'          => $p['abstract'],
            'authors'           => $authors,
            'journal'           => $p['journal_title'] ?? '',
            'publisher'         => $p['publisher'],
            'published_date'    => $raw['published_date'] ?? ($p['publication_year'] ? (string) $p['publication_year'] : null),
            'year'              => $p['publication_year'] !== null ? (int) $p['publication_year'] : null,
            'citations'         => (int) $p['citation_count'],
            'sdgs'              => $sdgs,
            'sdg_confidence'    => $confidence,
            'contributor_types' => $ctypes,
            'detailed_analysis' => $detailed,
            'data_source'       => 'database',
        ];
    } catch (Throwable $e) {
        return null;
    }
}

/**
 * Extract ISSN from Crossref API
 */
function extractISSNFromCrossref($doi) {
    $url = "https://api.crossref.org/works/" . urlencode($doi);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERAGENT      => 'SciecolaBot/1.0 (mailto:sciecola@sangia.org)',
        CURLOPT_TIMEOUT        => 10,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }

    $data = json_decode($response, true);
    if (!$data || !isset($data['message'])) {
        return null;
    }

    $message = $data['message'];

    // Try to get ISSN from various locations
    if (!empty($message['ISSN'])) {
        // Usually an array, take first one
        $issns = (array)$message['ISSN'];
        return !empty($issns[0]) ? $issns[0] : null;
    }

    // Try container-title (journal name) as fallback
    return null;
}

/**
 * Metrik jurnal dari wizdam-apis (GET /api/v1/journal/metrics).
 * Dulu memanggil http://localhost/api/scopus/journal-checker.php yang mengembalikan HTML
 * (dan tidak terjangkau di cPanel), sehingga metrik jurnal selalu kosong.
 */
function fetchScopusJournalData($issn) {
    if (empty($issn)) {
        return [];
    }
    $res = \Sciecola\Integration\SangiaApiClient::journalMetrics($issn);
    if (!$res) {
        return ['issn' => $issn];
    }
    $metrics = $res['metrics'] ?? [];
    return [
        'issn'      => $res['journal']['issn_print'] ?? $issn,
        'quartile'  => $metrics['quartile'] ?? null,
        'citescore' => $metrics['citescore'] ?? null,
        'sjr'       => $metrics['sjr'] ?? null,
        'snip'      => $metrics['snip'] ?? null,
    ];
}

/**
 * Build unified article profile response
 */
function buildArticleProfileResponse($articleData, $journalData = []) {
    // Extract SDG distribution
    $sdgDistribution = [];
    if (!empty($articleData['sdg_confidence'])) {
        foreach ($articleData['sdg_confidence'] as $sdgNum => $confidence) {
            $sdgDistribution[] = [
                'sdg'   => (int)str_replace('SDG', '', $sdgNum),
                'name'  => getSdgName((int)str_replace('SDG', '', $sdgNum)),
                'value' => round($confidence * 100),
                'color' => getSdgColor((int)str_replace('SDG', '', $sdgNum)),
            ];
        }
    }

    // Sort by value descending
    usort($sdgDistribution, function($a, $b) {
        return $b['value'] - $a['value'];
    });

    // Build response
    return [
        'status'           => 'success',
        'doi'              => $articleData['doi'] ?? null,
        'title'            => $articleData['title'] ?? null,
        'abstract'         => $articleData['abstract'] ?? null,
        'articleType'      => 'Research Article',
        'language'         => 'English',
        'publishedDate'    => $articleData['published_date'] ?? null,
        'year'             => $articleData['year'] ?? null,
        'authors'          => formatAuthorsForDisplay($articleData['authors'] ?? []),
        'journal'          => [
            'name'       => $articleData['journal'] ?? null,
            'issn'       => $journalData['issn'] ?? null,
            'quartile'   => $journalData['quartile'] ?? null,
            'citescore'  => $journalData['citescore'] ?? null,
        ],
        'publisher'        => $articleData['publisher'] ?? null,
        'coverImage'       => null,
        'citations'        => (int) ($articleData['citations'] ?? 0),
        'hIndex'           => 0,
        'views'            => 0,
        'downloads'        => 0,
        'altmetricScore'   => 0,
        'impactScore'      => $journalData['citescore'] ?? 0,
        'sdgDistribution'  => $sdgDistribution,
        'sdgs'             => $articleData['sdgs'] ?? [],
        // Belum ada sumber data tren sitasi/kinerja per tahun: kirim kosong (UI menampilkan keadaan kosong),
        // bukan angka buatan seperti sebelumnya.
        'citationTrend'    => [],
        'performanceMetrics' => [],
        'dataSource'       => $articleData['data_source'] ?? null,
        'versions'         => generateVersionHistory($articleData['published_date'] ?? null),
        'topCitations'     => [],
        'relatedArticles'  => [],
        'keywords'         => extractKeywordsFromAnalysis($articleData['detailed_analysis'] ?? []),
        'timestamp'        => date('c'),
        'api_version'      => 'v1.0.0',
    ];
}

/**
 * Format authors for display
 */
function formatAuthorsForDisplay($authors) {
    $formatted = [];
    foreach ($authors as $index => $name) {
        if (is_array($name)) {
            $name = $name['name'] ?? '';
        }
        $formatted[] = [
            'name'        => $name,
            'affiliation' => 'External Author',
            'id'          => $index + 1,
        ];
    }
    return $formatted;
}

/**
 * Extract keywords from SDG analysis
 */
function extractKeywordsFromAnalysis($analysis) {
    $keywords = [];
    foreach ($analysis as $sdgAnalysis) {
        if (!empty($sdgAnalysis['evidence']['keyword_matches'])) {
            foreach ($sdgAnalysis['evidence']['keyword_matches'] as $match) {
                $keywords[] = $match['keyword'];
            }
        }
    }
    return array_slice(array_unique($keywords), 0, 10);
}

/**
 * Generate citation trend mock data
 * TODO: Integrate with real citation metrics API (Scopus, OpenAlex)
 */
function generateCitationTrendData() {
    $currentYear = (int)date('Y');
    $data = [];
    for ($i = 4; $i >= 0; $i--) {
        $data[] = [
            'year'      => (string)($currentYear - $i),
            'citations' => max(0, (5 - $i) * 20),
        ];
    }
    return $data;
}

/**
 * Generate performance metrics mock data
 * TODO: Integrate with real metrics API
 */
function generatePerformanceMetricsData() {
    $currentYear = (int)date('Y');
    $data = [];
    for ($i = 4; $i >= 0; $i--) {
        $year = $currentYear - $i;
        $data[] = [
            'year'      => (string)$year,
            'citations' => max(0, (5 - $i) * 20),
            'views'     => max(1000, (5 - $i) * 5000),
            'downloads' => max(100, (5 - $i) * 500),
        ];
    }
    return $data;
}

/**
 * Generate version history
 */
function generateVersionHistory($publishDate = null) {
    $history = [];
    if ($publishDate) {
        $history[] = [
            'date'  => $publishDate,
            'event' => 'Versi Online (Published)',
            'type'  => 'published',
        ];
    }
    return $history;
}

/**
 * Get SDG name by number
 */
function getSdgName($sdgNum) {
    $names = [
        1  => 'No Poverty',
        2  => 'Zero Hunger',
        3  => 'Good Health & Well-being',
        4  => 'Quality Education',
        5  => 'Gender Equality',
        6  => 'Clean Water & Sanitation',
        7  => 'Affordable & Clean Energy',
        8  => 'Decent Work & Economic Growth',
        9  => 'Industry, Innovation & Infrastructure',
        10 => 'Reduced Inequalities',
        11 => 'Sustainable Cities & Communities',
        12 => 'Responsible Consumption & Production',
        13 => 'Climate Action',
        14 => 'Life Below Water',
        15 => 'Life on Land',
        16 => 'Peace, Justice & Strong Institutions',
        17 => 'Partnerships for the Goals',
    ];
    return $names[$sdgNum] ?? "SDG {$sdgNum}";
}

/**
 * Get SDG color by number
 */
function getSdgColor($sdgNum) {
    $colors = [
        1  => '#e5243b',
        2  => '#dda63b',
        3  => '#4c9f38',
        4  => '#c6192b',
        5  => '#dd3e39',
        6  => '#26bde2',
        7  => '#fccc0a',
        8  => '#a21942',
        9  => '#dd5e89',
        10 => '#dd3e39',
        11 => '#fd6d3d',
        12 => '#bf8b2e',
        13 => '#407d52',
        14 => '#0a97d9',
        15 => '#56c596',
        16 => '#002449',
        17 => '#19486a',
    ];
    return $colors[$sdgNum] ?? '#999999';
}
