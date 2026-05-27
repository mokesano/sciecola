<?php
declare(strict_types=1);

/**
 * @file api/wrapper/analytics.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Analytics Summary API - Provides aggregated metrics for the entire system.
 * 
 * Endpoint:
 * GET /api/analytics.php[?years=5]
 *   years = 0   → all time
 *   years = N>0 → last N years (default 10)
 * Reads from: publications, researchers, journals, work_sdgs,
 *             publication_authors, institutions
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $years = isset($_GET['years']) ? max(0, (int) $_GET['years']) : 10;

    echo json_encode([
        'status'    => 'success',
        'data'      => fetchAnalyticsData($years),
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

function fetchAnalyticsData(int $years): array
{
    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            $articles    = (int) $pdo->query('SELECT COUNT(*) FROM publications')->fetchColumn();
            $researchers = (int) $pdo->query('SELECT COUNT(*) FROM researchers')->fetchColumn();
            $journals    = (int) $pdo->query('SELECT COUNT(*) FROM journals')->fetchColumn();
            $institutions = (int) $pdo->query('SELECT COUNT(*) FROM institutions')->fetchColumn();

            if ($articles > 0) {
                $yearWhere  = $years > 0 ? 'AND publication_year >= YEAR(NOW()) - ' . ($years - 1) : '';
                $yearFilter = $years > 0 ? 'WHERE publication_year >= YEAR(NOW()) - ' . ($years - 1) : '';

                $totalCitations = (int) $pdo->query(
                    'SELECT COALESCE(SUM(citation_count), 0) FROM publications ' . $yearFilter
                )->fetchColumn();

                $avgHIndex = (float) $pdo->query(
                    'SELECT COALESCE(AVG(h_index), 0) FROM researchers'
                )->fetchColumn();

                // Publication trend by year
                $pubTrend = $pdo->query(
                    "SELECT p.publication_year AS year,
                            COUNT(DISTINCT p.doi) AS articles,
                            COUNT(DISTINCT pa.orcid) AS researchers
                     FROM publications p
                     LEFT JOIN publication_authors pa ON pa.doi = p.doi AND pa.orcid IS NOT NULL
                     WHERE p.publication_year IS NOT NULL {$yearWhere}
                     GROUP BY p.publication_year
                     ORDER BY p.publication_year ASC"
                )->fetchAll(PDO::FETCH_ASSOC);

                // Citation trend by publication year
                $citTrend = $pdo->query(
                    "SELECT publication_year AS year,
                            SUM(citation_count) AS citations
                     FROM publications
                     WHERE publication_year IS NOT NULL {$yearWhere}
                     GROUP BY publication_year
                     ORDER BY publication_year ASC"
                )->fetchAll(PDO::FETCH_ASSOC);

                // SDG distribution
                $sdgRows = $pdo->query(
                    'SELECT ws.sdg_number, COUNT(*) AS value
                     FROM work_sdgs ws
                     JOIN publications p ON p.doi = ws.doi
                     WHERE 1=1 ' . ($years > 0 ? "AND p.publication_year >= YEAR(NOW()) - " . ($years - 1) : '') . '
                     GROUP BY ws.sdg_number ORDER BY value DESC LIMIT 10'
                )->fetchAll(PDO::FETCH_ASSOC);

                // Top journals by publication count
                $topJournals = $pdo->query(
                    'SELECT j.title AS name, COUNT(p.doi) AS articles,
                            j.cite_score AS citescore, j.quartile
                     FROM journals j
                     JOIN publications p ON p.journal_id = j.id
                     GROUP BY j.id ORDER BY articles DESC LIMIT 10'
                )->fetchAll(PDO::FETCH_ASSOC);

                // Document types
                $docTypes = $pdo->query(
                    "SELECT COALESCE(NULLIF(type,''), 'other') AS type,
                            COUNT(*) AS count
                     FROM publications
                     GROUP BY type ORDER BY count DESC"
                )->fetchAll(PDO::FETCH_ASSOC);

                // Top researchers by citation count
                $topResearchers = $pdo->query(
                    'SELECT r.orcid, r.name, r.citation_count, r.h_index,
                            i.name AS institution_name,
                            COUNT(DISTINCT pa.doi) AS pub_count
                     FROM researchers r
                     LEFT JOIN institutions i ON i.id = r.institution_id
                     LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
                     WHERE r.citation_count > 0
                     GROUP BY r.orcid
                     ORDER BY r.citation_count DESC
                     LIMIT 10'
                )->fetchAll(PDO::FETCH_ASSOC);

                // Top institutions by researcher count
                $topInstitutions = $pdo->query(
                    'SELECT i.name, i.country,
                            COUNT(DISTINCT r.orcid) AS researchers_count,
                            COALESCE(SUM(r.citation_count), 0) AS total_citations
                     FROM institutions i
                     JOIN researchers r ON r.institution_id = i.id
                     GROUP BY i.id
                     ORDER BY researchers_count DESC
                     LIMIT 10'
                )->fetchAll(PDO::FETCH_ASSOC);

                return buildAnalyticsResponse(
                    $articles, $researchers, $journals, $institutions,
                    $totalCitations, round($avgHIndex, 1),
                    $pubTrend, $citTrend, $sdgRows,
                    $topJournals, $docTypes, $topResearchers, $topInstitutions
                );
            }
        } catch (Exception $e) {
            // Fall through to sample data
        }
    }

    return getSampleAnalyticsData($years);
}

// ─── Build response from DB rows ─────────────────────────────────────────────

function buildAnalyticsResponse(
    int $articles, int $researchers, int $journals, int $institutions,
    int $citations, float $avgHIndex,
    array $pubTrend, array $citTrend, array $sdgDist,
    array $topJournals, array $docTypes,
    array $topResearchers, array $topInstitutions
): array {
    $sdgColors = getSdgColors();
    $sdgNames  = getSdgNames();

    $docColors = [
        'journal-article'     => '#6366f1',
        'review'              => '#3b82f6',
        'conference-paper'    => '#10b981',
        'proceedings-article' => '#10b981',
        'book-chapter'        => '#f59e0b',
        'book'                => '#f59e0b',
        'posted-content'      => '#8b5cf6',
        'other'               => '#9ca3af',
    ];

    // Compute doc-type total for percentages
    $docTotal = max(1, array_sum(array_column($docTypes, 'count')));

    return [
        'summary' => [
            ['key' => 'articles',     'value' => number_format($articles),    'change' => ''],
            ['key' => 'researchers',  'value' => number_format($researchers), 'change' => ''],
            ['key' => 'citations',    'value' => number_format($citations),   'change' => ''],
            ['key' => 'hindex',       'value' => (string) $avgHIndex,         'change' => ''],
            ['key' => 'journals',     'value' => number_format($journals),    'change' => ''],
            ['key' => 'institutions', 'value' => number_format($institutions),'change' => ''],
        ],
        'publication_trend' => array_map(fn ($r) => [
            'year'        => (string) $r['year'],
            'articles'    => (int) $r['articles'],
            'researchers' => (int) $r['researchers'],
        ], $pubTrend),
        'citation_trend' => array_map(fn ($r) => [
            'year'      => (string) $r['year'],
            'citations' => (int) $r['citations'],
        ], $citTrend),
        'sdg_distribution' => array_map(fn ($r) => [
            'name'  => $sdgNames[(int) $r['sdg_number']] ?? 'SDG ' . $r['sdg_number'],
            'value' => (int) $r['value'],
            'sdg'   => (int) $r['sdg_number'],
            'color' => $sdgColors[(int) $r['sdg_number']] ?? '#6b7280',
        ], $sdgDist),
        'top_journals' => array_map(fn ($r) => [
            'name'      => $r['name'],
            'articles'  => (int) $r['articles'],
            'citescore' => round((float) $r['citescore'], 2),
            'quartile'  => $r['quartile'] ? 'Q' . $r['quartile'] : null,
        ], $topJournals),
        'document_types' => array_map(fn ($r) => [
            'type'    => $r['type'],
            'count'   => (int) $r['count'],
            'percent' => round((int) $r['count'] / $docTotal * 100, 1),
            'color'   => $docColors[$r['type']] ?? '#9ca3af',
        ], $docTypes),
        'top_researchers' => array_map(fn ($r) => [
            'orcid'           => $r['orcid'],
            'name'            => $r['name'],
            'institution'     => $r['institution_name'] ?? '',
            'citation_count'  => (int) $r['citation_count'],
            'h_index'         => (int) $r['h_index'],
            'pub_count'       => (int) $r['pub_count'],
        ], $topResearchers),
        'top_institutions' => array_map(fn ($r) => [
            'name'             => $r['name'],
            'country'          => $r['country'] ?? '',
            'researchers_count'=> (int) $r['researchers_count'],
            'total_citations'  => (int) $r['total_citations'],
        ], $topInstitutions),
    ];
}

// ─── Sample / fallback data ───────────────────────────────────────────────────

function getSampleAnalyticsData(int $years): array
{
    $startYear = $years > 0 ? (int) date('Y') - $years + 1 : 2018;
    $allYears  = range($startYear, (int) date('Y'));

    $pubBase = [2018=>3240, 2019=>3890, 2020=>4180, 2021=>5620, 2022=>7840, 2023=>9870, 2024=>12450, 2025=>5230];
    $citBase = [2018=>12450, 2019=>18700, 2020=>25300, 2021=>34200, 2022=>52100, 2023=>75800, 2024=>98732, 2025=>41200];

    $pubTrend = array_map(fn ($y) => [
        'year'        => (string) $y,
        'articles'    => $pubBase[$y] ?? 0,
        'researchers' => ($pubBase[$y] ?? 0) + 1200,
    ], $allYears);

    $citTrend = array_map(fn ($y) => [
        'year'      => (string) $y,
        'citations' => $citBase[$y] ?? 0,
    ], $allYears);

    return [
        'summary' => [
            ['key' => 'articles',     'value' => '24,751', 'change' => '+12.4%'],
            ['key' => 'researchers',  'value' => '12,843', 'change' => '+8.7%'],
            ['key' => 'citations',    'value' => '98,732', 'change' => '+22.1%'],
            ['key' => 'hindex',       'value' => '18.4',   'change' => '+3.2%'],
            ['key' => 'journals',     'value' => '1,259',  'change' => '+5.1%'],
            ['key' => 'institutions', 'value' => '847',    'change' => '+11.3%'],
        ],
        'publication_trend' => $pubTrend,
        'citation_trend'    => $citTrend,
        'sdg_distribution'  => [
            ['name' => 'Good Health',        'value' => 4623, 'sdg' => 3,  'color' => '#4c9f38'],
            ['name' => 'Quality Education',  'value' => 3812, 'sdg' => 4,  'color' => '#c5192d'],
            ['name' => 'Climate Action',     'value' => 3263, 'sdg' => 13, 'color' => '#3f7e44'],
            ['name' => 'Industry',           'value' => 2865, 'sdg' => 9,  'color' => '#fd6925'],
            ['name' => 'Sustainable Cities', 'value' => 2421, 'sdg' => 11, 'color' => '#fd9d24'],
            ['name' => 'Partnerships',       'value' => 1957, 'sdg' => 17, 'color' => '#19486a'],
            ['name' => 'Clean Energy',       'value' => 1842, 'sdg' => 7,  'color' => '#fcc30b'],
            ['name' => 'Clean Water',        'value' => 1236, 'sdg' => 6,  'color' => '#26bde2'],
        ],
        'top_journals' => [
            ['name' => 'Nature Climate Change',         'articles' => 234, 'citescore' => 4.56, 'quartile' => 'Q1'],
            ['name' => 'Journal of Cleaner Production', 'articles' => 198, 'citescore' => 3.21, 'quartile' => 'Q1'],
            ['name' => 'Global Environmental Change',   'articles' => 176, 'citescore' => 3.12, 'quartile' => 'Q1'],
            ['name' => 'Sustainability',                'articles' => 156, 'citescore' => 1.87, 'quartile' => 'Q3'],
            ['name' => 'Marine Pollution Bulletin',     'articles' => 134, 'citescore' => 2.89, 'quartile' => 'Q2'],
            ['name' => 'Environmental Research',        'articles' => 112, 'citescore' => 2.45, 'quartile' => 'Q2'],
            ['name' => 'Energy Policy',                 'articles' =>  98, 'citescore' => 2.10, 'quartile' => 'Q2'],
            ['name' => 'BMC Public Health',             'articles' =>  87, 'citescore' => 1.92, 'quartile' => 'Q2'],
        ],
        'document_types' => [
            ['type' => 'journal-article',  'count' => 18432, 'percent' => 74.5, 'color' => '#6366f1'],
            ['type' => 'review',           'count' =>  3698, 'percent' => 14.9, 'color' => '#3b82f6'],
            ['type' => 'conference-paper', 'count' =>  1987, 'percent' =>  8.0, 'color' => '#10b981'],
            ['type' => 'book-chapter',     'count' =>   634, 'percent' =>  2.6, 'color' => '#f59e0b'],
        ],
        'top_researchers' => [
            ['orcid' => '0000-0000-0001-0001', 'name' => 'Prof. Ahmad Fauzi',    'institution' => 'Universitas Indonesia',     'citation_count' => 4532, 'h_index' => 34, 'pub_count' => 128],
            ['orcid' => '0000-0000-0001-0002', 'name' => 'Dr. Siti Rahayu',      'institution' => 'Institut Teknologi Bandung', 'citation_count' => 3891, 'h_index' => 29, 'pub_count' =>  97],
            ['orcid' => '0000-0000-0001-0003', 'name' => 'Prof. Budi Santoso',   'institution' => 'Universitas Gadjah Mada',    'citation_count' => 3245, 'h_index' => 27, 'pub_count' =>  84],
            ['orcid' => '0000-0000-0001-0004', 'name' => 'Dr. Dewi Kusuma',      'institution' => 'IPB University',             'citation_count' => 2987, 'h_index' => 24, 'pub_count' =>  73],
            ['orcid' => '0000-0000-0001-0005', 'name' => 'Dr. Rudi Hartono',     'institution' => 'Universitas Airlangga',      'citation_count' => 2654, 'h_index' => 22, 'pub_count' =>  68],
        ],
        'top_institutions' => [
            ['name' => 'Universitas Indonesia',     'country' => 'ID', 'researchers_count' => 1247, 'total_citations' => 48750],
            ['name' => 'Institut Teknologi Bandung','country' => 'ID', 'researchers_count' =>  987, 'total_citations' => 39820],
            ['name' => 'Universitas Gadjah Mada',  'country' => 'ID', 'researchers_count' =>  856, 'total_citations' => 31450],
            ['name' => 'IPB University',            'country' => 'ID', 'researchers_count' =>  723, 'total_citations' => 26780],
            ['name' => 'Universitas Airlangga',     'country' => 'ID', 'researchers_count' =>  634, 'total_citations' => 21340],
        ],
    ];
}

// ─── Static lookup tables ─────────────────────────────────────────────────────

function getSdgColors(): array
{
    return [
        1=>'#e5243b', 2=>'#dda63a', 3=>'#4c9f38', 4=>'#c5192d', 5=>'#ff3a21',
        6=>'#26bde2', 7=>'#fcc30b', 8=>'#a21942', 9=>'#fd6925', 10=>'#dd1367',
        11=>'#fd9d24',12=>'#bf8b2e',13=>'#3f7e44',14=>'#0a97d9',15=>'#56c02b',
        16=>'#00689d',17=>'#19486a',
    ];
}

function getSdgNames(): array
{
    return [
        1=>'No Poverty', 2=>'Zero Hunger', 3=>'Good Health', 4=>'Quality Education',
        5=>'Gender Equality', 6=>'Clean Water', 7=>'Clean Energy', 8=>'Decent Work',
        9=>'Industry & Innovation', 10=>'Reduced Inequalities', 11=>'Sustainable Cities',
        12=>'Responsible Consumption', 13=>'Climate Action', 14=>'Life Below Water',
        15=>'Life on Land', 16=>'Peace & Justice', 17=>'Partnerships',
    ];
}
