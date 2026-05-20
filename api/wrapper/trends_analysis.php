<?php
/**
 * Trends Analysis API
 * GET /api/trends_analysis.php[?years=5&sdg=13]
 *   years = 0 → all time
 *   sdg   = 1..17 → filter by SDG (optional)
 * Reads from: publications, work_sdgs, publication_authors, researchers, institutions
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $years = isset($_GET['years']) ? max(0, (int) $_GET['years']) : 7;
    $sdg   = isset($_GET['sdg'])   ? max(0, min(17, (int) $_GET['sdg'])) : 0;

    echo json_encode([
        'status'    => 'success',
        'data'      => fetchTrendsAnalysisData($years, $sdg),
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

function fetchTrendsAnalysisData(int $years, int $sdg): array
{
    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            $articles = (int) $pdo->query('SELECT COUNT(*) FROM publications')->fetchColumn();

            if ($articles > 0) {
                return buildTrendsResponseFromDb($pdo, $years, $sdg);
            }
        } catch (Exception $e) {
            // Fall through to sample data
        }
    }

    return getSampleTrendsData($years);
}

function buildTrendsResponseFromDb(PDO $pdo, int $years, int $sdg): array
{
    $yearLimit = $years > 0 ? 'AND p.publication_year >= YEAR(NOW()) - ' . ($years - 1) : '';
    $sdgJoin   = $sdg > 0 ? 'JOIN work_sdgs wsf ON wsf.doi = p.doi AND wsf.sdg_number = ' . $sdg : '';

    // ── 1. Impact trends per year (academic = avg citation; total = composite)
    $stmt = $pdo->query(
        "SELECT p.publication_year AS year,
                COUNT(DISTINCT p.doi) AS pub_count,
                COALESCE(SUM(p.citation_count), 0) AS total_citations,
                COALESCE(AVG(p.citation_count), 0) AS avg_citations
         FROM publications p
         {$sdgJoin}
         WHERE p.publication_year IS NOT NULL {$yearLimit}
         GROUP BY p.publication_year
         ORDER BY p.publication_year ASC"
    );
    $impactRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ── 2. Topic growth by SDG (between earliest and latest year in range)
    $topicRows = $pdo->query(
        "SELECT ws.sdg_number, p.publication_year AS year, COUNT(*) AS cnt
         FROM work_sdgs ws
         JOIN publications p ON p.doi = ws.doi
         WHERE p.publication_year IS NOT NULL {$yearLimit}
         GROUP BY ws.sdg_number, p.publication_year"
    )->fetchAll(PDO::FETCH_ASSOC);

    // ── 3. Top collaborator countries (excluding Indonesia)
    $countryRows = $pdo->query(
        "SELECT i.country, COUNT(DISTINCT p.doi) AS collaborations
         FROM publications p
         JOIN publication_authors pa ON pa.doi = p.doi
         JOIN researchers r ON r.orcid = pa.orcid
         JOIN institutions i ON i.id = r.institution_id
         WHERE i.country IS NOT NULL
           AND i.country NOT IN ('Indonesia', 'ID', 'id')
           AND p.publication_year IS NOT NULL {$yearLimit}
         GROUP BY i.country
         ORDER BY collaborations DESC
         LIMIT 8"
    )->fetchAll(PDO::FETCH_ASSOC);

    // ── 4. Collab trend (national vs international per year)
    $collabRows = $pdo->query(
        "SELECT p.publication_year AS year,
                COUNT(DISTINCT p.doi) AS total_pubs,
                COUNT(DISTINCT CASE WHEN mc.doi IS NOT NULL THEN p.doi END) AS intl_pubs
         FROM publications p
         LEFT JOIN (
             SELECT pa2.doi
             FROM publication_authors pa2
             JOIN researchers r2 ON r2.orcid = pa2.orcid
             JOIN institutions i2 ON i2.id = r2.institution_id
             GROUP BY pa2.doi
             HAVING COUNT(DISTINCT i2.country) > 1
         ) mc ON mc.doi = p.doi
         WHERE p.publication_year IS NOT NULL {$yearLimit}
         GROUP BY p.publication_year
         ORDER BY p.publication_year ASC"
    )->fetchAll(PDO::FETCH_ASSOC);

    return assembleTrendsResponse($impactRows, $topicRows, $countryRows, $collabRows);
}

function assembleTrendsResponse(array $impactRows, array $topicRows, array $countryRows, array $collabRows): array
{
    $sdgMeta = getSdgMetaMap();

    // Build impact_trends + deltas
    $impactTrends = [];
    $maxAvg = 1;
    foreach ($impactRows as $r) {
        $maxAvg = max($maxAvg, (float) $r['avg_citations']);
    }
    foreach ($impactRows as $r) {
        $academic = $maxAvg > 0 ? round(((float) $r['avg_citations'] / $maxAvg) * 100, 1) : 0.0;
        $impactTrends[] = [
            'year'      => (string) $r['year'],
            'academic'  => $academic,
            'social'    => 0,    // not available in DB
            'practical' => 0,    // not available in DB
            'total'     => $academic,
            'pub_count' => (int) $r['pub_count'],
            'citations' => (int) $r['total_citations'],
        ];
    }

    $impactDeltas = ['academic' => 0, 'social' => 0, 'practical' => 0, 'total' => 0];
    if (count($impactTrends) >= 2) {
        $first = $impactTrends[0];
        $last  = end($impactTrends);
        foreach (['academic','social','practical','total'] as $dim) {
            $impactDeltas[$dim] = $first[$dim] > 0
                ? round((($last[$dim] - $first[$dim]) / $first[$dim]) * 100, 1)
                : 0;
        }
    }

    // Build topics_growth (SDG growth between earliest and latest year)
    $sdgYearMap = [];
    foreach ($topicRows as $r) {
        $sdgYearMap[(int) $r['sdg_number']][(int) $r['year']] = (int) $r['cnt'];
    }
    $topicsGrowth = [];
    foreach ($sdgYearMap as $sdgNum => $byYear) {
        ksort($byYear);
        $years   = array_keys($byYear);
        $first   = $byYear[$years[0]] ?? 0;
        $last    = $byYear[end($years)] ?? 0;
        $current = (int) array_sum($byYear);
        $growth  = $first > 0 ? round((($last - $first) / $first) * 100, 1) : 0;
        $topicsGrowth[] = [
            'sdg'           => $sdgNum,
            'topic'         => $sdgMeta[$sdgNum]['name'] ?? "SDG {$sdgNum}",
            'growth'        => $growth,
            'current_count' => $current,
            'color'         => $sdgMeta[$sdgNum]['color'] ?? '#6b7280',
        ];
    }
    usort($topicsGrowth, fn ($a, $b) => $b['growth'] <=> $a['growth']);
    $topicsGrowth = array_slice($topicsGrowth, 0, 8);

    // Build field_trends: SDG counts per year (limited to top 5 SDGs by total count)
    $sdgTotals = array_map(fn ($yearMap) => array_sum($yearMap), $sdgYearMap);
    arsort($sdgTotals);
    $topSdgKeys = array_slice(array_keys($sdgTotals), 0, 5);

    $allYears = [];
    foreach ($sdgYearMap as $byYear) {
        $allYears = array_merge($allYears, array_keys($byYear));
    }
    $allYears = array_values(array_unique($allYears));
    sort($allYears);

    $fieldTrends = [];
    foreach ($allYears as $y) {
        $row = ['year' => (string) $y];
        foreach ($topSdgKeys as $sdgNum) {
            $row["sdg{$sdgNum}"] = (int) ($sdgYearMap[$sdgNum][$y] ?? 0);
        }
        $fieldTrends[] = $row;
    }

    $topSdgsForChart = array_map(fn ($n) => [
        'sdg'   => (int) $n,
        'name'  => $sdgMeta[$n]['name'] ?? "SDG {$n}",
        'color' => $sdgMeta[$n]['color'] ?? '#6b7280',
    ], $topSdgKeys);

    // Collab trend
    $collabTrend = array_map(fn ($r) => [
        'year'          => (string) $r['year'],
        'total'         => (int) $r['total_pubs'],
        'international' => (int) $r['intl_pubs'],
        'national'      => (int) $r['total_pubs'] - (int) $r['intl_pubs'],
        'intl_percent'  => (int) $r['total_pubs'] > 0
            ? round((int) $r['intl_pubs'] / (int) $r['total_pubs'] * 100, 1) : 0,
    ], $collabRows);

    // Top countries
    $topCountries = array_map(fn ($r) => [
        'country'        => $r['country'],
        'collaborations' => (int) $r['collaborations'],
    ], $countryRows);

    // Prediction: linear extrapolation of total impact 2 years forward
    $prediction = [];
    if (count($impactTrends) >= 2) {
        foreach ($impactTrends as $row) {
            $prediction[] = [
                'year'      => $row['year'],
                'actual'    => $row['total'],
                'predicted' => null,
            ];
        }
        // Simple linear: extrapolate from last 2 points
        $n         = count($impactTrends);
        $delta     = $impactTrends[$n-1]['total'] - $impactTrends[$n-2]['total'];
        $lastYear  = (int) $impactTrends[$n-1]['year'];
        $lastTotal = $impactTrends[$n-1]['total'];
        // Include the last actual point in the prediction line for continuity
        $prediction[$n-1]['predicted'] = $lastTotal;
        for ($i = 1; $i <= 2; $i++) {
            $prediction[] = [
                'year'      => (string) ($lastYear + $i),
                'actual'    => null,
                'predicted' => round(max(0, min(100, $lastTotal + $delta * $i)), 1),
            ];
        }
    }

    return [
        'impact_trends'      => $impactTrends,
        'impact_deltas'      => $impactDeltas,
        'topics_growth'      => $topicsGrowth,
        'field_trends'       => $fieldTrends,
        'top_sdgs'           => $topSdgsForChart,
        'collab_trend'       => $collabTrend,
        'top_countries'      => $topCountries,
        'prediction'         => $prediction,
        'regional_benchmark' => getRegionalBenchmark(),
    ];
}

// ─── Static reference data ───────────────────────────────────────────────────

function getRegionalBenchmark(): array
{
    return [
        ['country' => 'Singapore',   'impact' => 86.4, 'growth' => 7.2],
        ['country' => 'Malaysia',    'impact' => 78.3, 'growth' => 12.4],
        ['country' => 'Indonesia',   'impact' => 74.6, 'growth' => 15.8, 'highlight' => true],
        ['country' => 'Thailand',    'impact' => 72.1, 'growth' => 10.5],
        ['country' => 'Vietnam',     'impact' => 68.4, 'growth' => 18.3],
        ['country' => 'Philippines', 'impact' => 65.8, 'growth' => 14.2],
    ];
}

function getSdgMetaMap(): array
{
    return [
        1  => ['name' => 'No Poverty',               'color' => '#e5243b'],
        2  => ['name' => 'Zero Hunger',               'color' => '#dda63a'],
        3  => ['name' => 'Good Health',               'color' => '#4c9f38'],
        4  => ['name' => 'Quality Education',         'color' => '#c5192d'],
        5  => ['name' => 'Gender Equality',           'color' => '#ff3a21'],
        6  => ['name' => 'Clean Water',               'color' => '#26bde2'],
        7  => ['name' => 'Clean Energy',              'color' => '#fcc30b'],
        8  => ['name' => 'Decent Work',               'color' => '#a21942'],
        9  => ['name' => 'Industry & Innovation',     'color' => '#fd6925'],
        10 => ['name' => 'Reduced Inequalities',      'color' => '#dd1367'],
        11 => ['name' => 'Sustainable Cities',        'color' => '#fd9d24'],
        12 => ['name' => 'Responsible Consumption',   'color' => '#bf8b2e'],
        13 => ['name' => 'Climate Action',            'color' => '#3f7e44'],
        14 => ['name' => 'Life Below Water',          'color' => '#0a97d9'],
        15 => ['name' => 'Life on Land',              'color' => '#56c02b'],
        16 => ['name' => 'Peace & Justice',           'color' => '#00689d'],
        17 => ['name' => 'Partnerships',              'color' => '#19486a'],
    ];
}

// ─── Sample / fallback data ───────────────────────────────────────────────────

function getSampleTrendsData(int $years): array
{
    $startYear = $years > 0 ? (int) date('Y') - $years + 1 : 2019;
    $impactBase = [2019=>55, 2020=>60, 2021=>68, 2022=>72, 2023=>78, 2024=>82, 2025=>85];

    $impactTrends = [];
    for ($y = $startYear; $y <= (int) date('Y'); $y++) {
        $base = $impactBase[$y] ?? 70;
        $impactTrends[] = [
            'year'      => (string) $y,
            'academic'  => $base + 2,
            'social'    => max(40, $base - 12),
            'practical' => max(35, $base - 18),
            'total'     => $base,
            'pub_count' => 1200 + ($y - 2019) * 800,
            'citations' => 12000 + ($y - 2019) * 18000,
        ];
    }
    $first = $impactTrends[0] ?? null;
    $last  = end($impactTrends) ?: null;
    $delta = fn ($k) => ($first && $last && $first[$k] > 0)
        ? round((($last[$k] - $first[$k]) / $first[$k]) * 100, 1) : 0;

    $impactDeltas = [
        'academic'  => $delta('academic'),
        'social'    => $delta('social'),
        'practical' => $delta('practical'),
        'total'     => $delta('total'),
    ];

    $prediction = [];
    foreach ($impactTrends as $row) {
        $prediction[] = ['year' => $row['year'], 'actual' => $row['total'], 'predicted' => null];
    }
    if (count($impactTrends) >= 1) {
        $n = count($impactTrends);
        $prediction[$n-1]['predicted'] = $impactTrends[$n-1]['total'];
        $lastY = (int) $impactTrends[$n-1]['year'];
        $lastV = $impactTrends[$n-1]['total'];
        $step  = 3;
        for ($i = 1; $i <= 2; $i++) {
            $prediction[] = ['year' => (string) ($lastY + $i), 'actual' => null, 'predicted' => $lastV + $step * $i];
        }
    }

    return [
        'impact_trends' => $impactTrends,
        'impact_deltas' => $impactDeltas,
        'topics_growth' => [
            ['sdg' => 13, 'topic' => 'Climate Action',          'growth' => 78.5, 'current_count' => 3263, 'color' => '#3f7e44'],
            ['sdg' =>  9, 'topic' => 'Industry & Innovation',   'growth' => 65.2, 'current_count' => 2865, 'color' => '#fd6925'],
            ['sdg' =>  7, 'topic' => 'Clean Energy',            'growth' => 58.7, 'current_count' => 1842, 'color' => '#fcc30b'],
            ['sdg' =>  3, 'topic' => 'Good Health',             'growth' => 42.1, 'current_count' => 4623, 'color' => '#4c9f38'],
            ['sdg' => 11, 'topic' => 'Sustainable Cities',      'growth' => 38.4, 'current_count' => 2421, 'color' => '#fd9d24'],
            ['sdg' =>  4, 'topic' => 'Quality Education',       'growth' => 32.6, 'current_count' => 3812, 'color' => '#c5192d'],
            ['sdg' =>  6, 'topic' => 'Clean Water',             'growth' => 28.9, 'current_count' => 1236, 'color' => '#26bde2'],
            ['sdg' => 17, 'topic' => 'Partnerships',            'growth' => 24.3, 'current_count' => 1957, 'color' => '#19486a'],
        ],
        'top_sdgs' => [
            ['sdg' => 3,  'name' => 'Good Health',           'color' => '#4c9f38'],
            ['sdg' => 4,  'name' => 'Quality Education',     'color' => '#c5192d'],
            ['sdg' => 13, 'name' => 'Climate Action',        'color' => '#3f7e44'],
            ['sdg' => 9,  'name' => 'Industry & Innovation', 'color' => '#fd6925'],
            ['sdg' => 11, 'name' => 'Sustainable Cities',    'color' => '#fd9d24'],
        ],
        'field_trends' => array_map(fn ($t) => [
            'year' => $t['year'],
            'sdg3'  => 400 + ((int)$t['year'] - 2019) * 80,
            'sdg4'  => 350 + ((int)$t['year'] - 2019) * 70,
            'sdg13' => 300 + ((int)$t['year'] - 2019) * 90,
            'sdg9'  => 250 + ((int)$t['year'] - 2019) * 75,
            'sdg11' => 200 + ((int)$t['year'] - 2019) * 65,
        ], $impactTrends),
        'collab_trend' => array_map(fn ($t) => [
            'year'         => $t['year'],
            'total'        => $t['pub_count'],
            'national'     => (int) round($t['pub_count'] * 0.65),
            'international'=> (int) round($t['pub_count'] * 0.35),
            'intl_percent' => 35,
        ], $impactTrends),
        'top_countries' => [
            ['country' => 'Australia',      'collaborations' => 1245],
            ['country' => 'Japan',          'collaborations' => 1087],
            ['country' => 'USA',            'collaborations' =>  956],
            ['country' => 'Malaysia',       'collaborations' =>  874],
            ['country' => 'United Kingdom', 'collaborations' =>  723],
            ['country' => 'Singapore',      'collaborations' =>  658],
            ['country' => 'Netherlands',    'collaborations' =>  534],
            ['country' => 'Germany',        'collaborations' =>  487],
        ],
        'prediction'         => $prediction,
        'regional_benchmark' => getRegionalBenchmark(),
    ];
}
