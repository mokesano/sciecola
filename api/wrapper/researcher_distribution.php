<?php
declare(strict_types=1);

/**
 * @file api/wrapper/researcher_distribution.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Researcher Distribution API — GLOBAL (All countries + institutions)
 * 
 * Endpoints:
 * GET /api/researcher_distribution.php[?groupBy=country|institution&sdg=13]
 *
 * Dipakai oleh halaman ResearcherDistribution.jsx untuk:
 *   - Choropleth peta dunia (groupBy=country): warna negara berdasarkan jumlah peneliti
 *   - Marker peta (groupBy=institution): titik institusi dengan jitter lokal agar tidak tumpang-tindih
 *   - Tabel statistik + detail panel
 *
 * Sumber: researchers, institutions, publication_authors, publications, work_sdgs.
 *
 * Catatan:
 *   - Database hanya punya `country` (bukan province) — page yang lama keliru menyebut "Provinsi"
 *   - avgImpact dinormalisasi 0-100 via log(avg_citations) untuk perbandingan adil antar negara
 *   - top_sdg dihitung dari publikasi peneliti di negara/institusi tersebut
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $groupBy   = in_array($_GET['groupBy'] ?? 'country', ['country', 'institution'], true)
        ? $_GET['groupBy'] : 'country';
    $sdgFilter = max(0, min(17, (int)($_GET['sdg'] ?? 0)));

    echo json_encode([
        'status'    => 'success',
        'groupBy'   => $groupBy,
        'data'      => fetchResearcherDistribution($groupBy, $sdgFilter),
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────

function fetchResearcherDistribution(string $groupBy, int $sdgFilter): array
{
    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            $rows = $groupBy === 'institution'
                ? fetchByInstitution($pdo, $sdgFilter)
                : fetchByCountry($pdo, $sdgFilter);

            if (!empty($rows)) return $rows;
        } catch (Exception $e) {
            error_log('researcher_distribution: ' . $e->getMessage());
        }
    }

    return getSampleDistribution($groupBy);
}

// ─── By country ───────────────────────────────────────────────────────────────

function fetchByCountry(PDO $pdo, int $sdgFilter): array
{
    $where  = '';
    $params = [];
    if ($sdgFilter >= 1 && $sdgFilter <= 17) {
        $where = ' AND EXISTS (
            SELECT 1 FROM work_sdgs ws
            JOIN publication_authors pa2 ON pa2.doi = ws.doi
            WHERE pa2.orcid = r.orcid AND ws.sdg_number = ?
        )';
        $params[] = $sdgFilter;
    }

    $stmt = $pdo->prepare(
        "SELECT
            COALESCE(r.country, 'Unknown') AS country,
            COUNT(DISTINCT r.orcid) AS researcher_count,
            COUNT(DISTINCT r.institution_id) AS institution_count,
            COALESCE(AVG(r.citation_count), 0) AS avg_citations,
            COUNT(DISTINCT pa.doi) AS publication_count
        FROM researchers r
        LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
        WHERE r.country IS NOT NULL AND r.country != ''
        {$where}
        GROUP BY r.country
        HAVING researcher_count > 0
        ORDER BY researcher_count DESC"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($rows)) return [];

    // Hitung max avg_citations untuk normalisasi
    $maxAvg = 1.0;
    foreach ($rows as $r) $maxAvg = max($maxAvg, (float) $r['avg_citations']);
    $logMax = log($maxAvg + 1);

    // Top SDG per country (single query, group di PHP)
    $topSdgMap = fetchTopSdgPerCountry($pdo);
    $coords    = getCountryCoordinates();

    return array_map(function ($r) use ($logMax, $topSdgMap, $coords) {
        $country  = (string) $r['country'];
        $avgCit   = (float) $r['avg_citations'];
        $avgImpact = $logMax > 0 ? round(log($avgCit + 1) / $logMax * 100, 1) : 0.0;
        $coord    = $coords[$country] ?? ['lat' => 0, 'lng' => 0];

        return [
            'name'         => $country,
            'researchers'  => (int) $r['researcher_count'],
            'institutions' => (int) $r['institution_count'],
            'avg_impact'   => $avgImpact,
            'avg_citations'=> round($avgCit, 1),
            'publications' => (int) $r['publication_count'],
            'top_sdg'      => $topSdgMap[$country] ?? null,
            'lat'          => $coord['lat'],
            'lng'          => $coord['lng'],
        ];
    }, $rows);
}

// ─── By institution ───────────────────────────────────────────────────────────

function fetchByInstitution(PDO $pdo, int $sdgFilter): array
{
    $where  = '';
    $params = [];
    if ($sdgFilter >= 1 && $sdgFilter <= 17) {
        $where = ' AND EXISTS (
            SELECT 1 FROM work_sdgs ws
            JOIN publication_authors pa2 ON pa2.doi = ws.doi
            WHERE pa2.orcid = r.orcid AND ws.sdg_number = ?
        )';
        $params[] = $sdgFilter;
    }

    $stmt = $pdo->prepare(
        "SELECT
            i.id,
            i.name,
            i.country,
            i.city,
            COUNT(DISTINCT r.orcid) AS researcher_count,
            COALESCE(AVG(r.citation_count), 0) AS avg_citations,
            COUNT(DISTINCT pa.doi) AS publication_count
        FROM institutions i
        LEFT JOIN researchers r ON r.institution_id = i.id
        LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
        WHERE i.name IS NOT NULL
        {$where}
        GROUP BY i.id
        HAVING researcher_count > 0
        ORDER BY researcher_count DESC
        LIMIT 100"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($rows)) return [];

    $maxAvg = 1.0;
    foreach ($rows as $r) $maxAvg = max($maxAvg, (float) $r['avg_citations']);
    $logMax = log($maxAvg + 1);

    $topSdgMap = fetchTopSdgPerInstitution($pdo);
    $coords    = getCountryCoordinates();

    return array_map(function ($r) use ($logMax, $topSdgMap, $coords) {
        $id        = (int) $r['id'];
        $country   = (string) ($r['country'] ?? 'Unknown');
        $avgCit    = (float) $r['avg_citations'];
        $avgImpact = $logMax > 0 ? round(log($avgCit + 1) / $logMax * 100, 1) : 0.0;
        $base      = $coords[$country] ?? ['lat' => 0, 'lng' => 0];
        // Jitter deterministik agar institusi di negara sama tidak tumpang-tindih
        $jitterLat = ($id % 100) / 200 - 0.25;            // ±0.25°
        $jitterLng = (($id * 7) % 100) / 200 - 0.25;

        return [
            'id'           => $id,
            'name'         => $r['name'],
            'country'      => $country,
            'city'         => $r['city'],
            'researchers'  => (int) $r['researcher_count'],
            'avg_impact'   => $avgImpact,
            'avg_citations'=> round($avgCit, 1),
            'publications' => (int) $r['publication_count'],
            'top_sdg'      => $topSdgMap[$id] ?? null,
            'lat'          => $base['lat'] + $jitterLat,
            'lng'          => $base['lng'] + $jitterLng,
        ];
    }, $rows);
}

// ─── Helper: top SDG per country/institution ─────────────────────────────────

function fetchTopSdgPerCountry(PDO $pdo): array
{
    $rows = $pdo->query(
        "SELECT r.country, ws.sdg_number, COUNT(*) AS cnt
         FROM researchers r
         JOIN publication_authors pa ON pa.orcid = r.orcid
         JOIN work_sdgs ws ON ws.doi = pa.doi
         WHERE r.country IS NOT NULL AND r.country != ''
         GROUP BY r.country, ws.sdg_number
         ORDER BY r.country, cnt DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    $sdgMeta = getSdgMetaMap();
    $map     = [];
    foreach ($rows as $r) {
        $country = $r['country'];
        if (!isset($map[$country])) {
            $sdgNum = (int) $r['sdg_number'];
            $map[$country] = [
                'number' => $sdgNum,
                'name'   => $sdgMeta[$sdgNum]['name'] ?? "SDG {$sdgNum}",
                'color'  => $sdgMeta[$sdgNum]['color'] ?? '#6b7280',
            ];
        }
    }
    return $map;
}

function fetchTopSdgPerInstitution(PDO $pdo): array
{
    $rows = $pdo->query(
        "SELECT r.institution_id, ws.sdg_number, COUNT(*) AS cnt
         FROM researchers r
         JOIN publication_authors pa ON pa.orcid = r.orcid
         JOIN work_sdgs ws ON ws.doi = pa.doi
         WHERE r.institution_id IS NOT NULL
         GROUP BY r.institution_id, ws.sdg_number
         ORDER BY r.institution_id, cnt DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    $sdgMeta = getSdgMetaMap();
    $map     = [];
    foreach ($rows as $r) {
        $id = (int) $r['institution_id'];
        if (!isset($map[$id])) {
            $sdgNum = (int) $r['sdg_number'];
            $map[$id] = [
                'number' => $sdgNum,
                'name'   => $sdgMeta[$sdgNum]['name'] ?? "SDG {$sdgNum}",
                'color'  => $sdgMeta[$sdgNum]['color'] ?? '#6b7280',
            ];
        }
    }
    return $map;
}

// ─── Static data ─────────────────────────────────────────────────────────────

function getSdgMetaMap(): array
{
    return [
        1  => ['name' => 'No Poverty',               'color' => '#e5243b'],
        2  => ['name' => 'Zero Hunger',              'color' => '#dda63a'],
        3  => ['name' => 'Good Health',              'color' => '#4c9f38'],
        4  => ['name' => 'Quality Education',        'color' => '#c5192d'],
        5  => ['name' => 'Gender Equality',          'color' => '#ff3a21'],
        6  => ['name' => 'Clean Water',              'color' => '#26bde2'],
        7  => ['name' => 'Clean Energy',             'color' => '#fcc30b'],
        8  => ['name' => 'Decent Work',              'color' => '#a21942'],
        9  => ['name' => 'Industry & Innovation',    'color' => '#fd6925'],
        10 => ['name' => 'Reduced Inequalities',     'color' => '#dd1367'],
        11 => ['name' => 'Sustainable Cities',       'color' => '#fd9d24'],
        12 => ['name' => 'Responsible Consumption', 'color' => '#bf8b2e'],
        13 => ['name' => 'Climate Action',           'color' => '#3f7e44'],
        14 => ['name' => 'Life Below Water',         'color' => '#0a97d9'],
        15 => ['name' => 'Life on Land',             'color' => '#56c02b'],
        16 => ['name' => 'Peace & Justice',          'color' => '#00689d'],
        17 => ['name' => 'Partnerships',             'color' => '#19486a'],
    ];
}

function getCountryCoordinates(): array
{
    return [
        // Asia
        'Indonesia'         => ['lat' => -0.7893, 'lng' => 113.9213],
        'Malaysia'          => ['lat' => 4.2105,  'lng' => 101.6964],
        'Philippines'       => ['lat' => 12.8797, 'lng' => 121.7740],
        'Thailand'          => ['lat' => 15.8700, 'lng' => 100.9925],
        'Vietnam'           => ['lat' => 14.0583, 'lng' => 108.2772],
        'Singapore'         => ['lat' => 1.3521,  'lng' => 103.8198],
        'Cambodia'          => ['lat' => 12.5657, 'lng' => 104.9910],
        'Laos'              => ['lat' => 19.8523, 'lng' => 102.4955],
        'Myanmar'           => ['lat' => 21.9162, 'lng' => 95.9560],
        'Brunei'            => ['lat' => 4.5353,  'lng' => 114.7277],
        'India'             => ['lat' => 20.5937, 'lng' => 78.9629],
        'China'             => ['lat' => 35.8617, 'lng' => 104.1954],
        'Japan'             => ['lat' => 36.2048, 'lng' => 138.2529],
        'South Korea'       => ['lat' => 35.9078, 'lng' => 127.7669],
        'Taiwan'            => ['lat' => 23.6978, 'lng' => 120.9605],
        'Hong Kong'         => ['lat' => 22.3193, 'lng' => 114.1694],
        'Pakistan'          => ['lat' => 30.3753, 'lng' => 69.3451],
        'Bangladesh'        => ['lat' => 23.6850, 'lng' => 90.3563],
        'Sri Lanka'         => ['lat' => 7.8731,  'lng' => 80.7718],
        'Nepal'             => ['lat' => 28.3949, 'lng' => 84.1240],
        // Europe
        'United Kingdom'    => ['lat' => 55.3781, 'lng' => -3.4360],
        'Germany'           => ['lat' => 51.1657, 'lng' => 10.4515],
        'France'            => ['lat' => 46.2276, 'lng' => 2.2137],
        'Italy'             => ['lat' => 41.8719, 'lng' => 12.5674],
        'Spain'             => ['lat' => 40.4637, 'lng' => -3.7492],
        'Netherlands'       => ['lat' => 52.1326, 'lng' => 5.2913],
        'Belgium'           => ['lat' => 50.5039, 'lng' => 4.4699],
        'Sweden'            => ['lat' => 60.1282, 'lng' => 18.6435],
        'Norway'            => ['lat' => 60.4720, 'lng' => 8.4689],
        'Switzerland'       => ['lat' => 46.8182, 'lng' => 8.2275],
        'Austria'           => ['lat' => 47.5162, 'lng' => 14.5501],
        'Poland'            => ['lat' => 51.9194, 'lng' => 19.1451],
        'Russia'            => ['lat' => 61.5240, 'lng' => 105.3188],
        'Ukraine'           => ['lat' => 48.3794, 'lng' => 31.1656],
        'Greece'            => ['lat' => 39.0742, 'lng' => 21.8243],
        'Portugal'          => ['lat' => 39.3999, 'lng' => -8.2245],
        'Ireland'           => ['lat' => 53.4129, 'lng' => -8.2439],
        'Denmark'           => ['lat' => 56.2639, 'lng' => 9.5018],
        'Finland'           => ['lat' => 61.9241, 'lng' => 25.7482],
        'Czech Republic'    => ['lat' => 49.8175, 'lng' => 15.4730],
        'Hungary'           => ['lat' => 47.1625, 'lng' => 19.5033],
        'Romania'           => ['lat' => 45.9432, 'lng' => 24.9668],
        // Americas
        'United States'     => ['lat' => 37.0902, 'lng' => -95.7129],
        'Canada'            => ['lat' => 56.1304, 'lng' => -106.3468],
        'Mexico'            => ['lat' => 23.6345, 'lng' => -102.5528],
        'Brazil'            => ['lat' => -14.2350,'lng' => -51.9253],
        'Argentina'         => ['lat' => -38.4161,'lng' => -63.6167],
        'Chile'             => ['lat' => -35.6751,'lng' => -71.5430],
        'Colombia'          => ['lat' => 4.5709,  'lng' => -74.2973],
        'Peru'              => ['lat' => -9.1900, 'lng' => -75.0152],
        'Venezuela'         => ['lat' => 6.4238,  'lng' => -66.5897],
        // Oceania
        'Australia'         => ['lat' => -25.2744,'lng' => 133.7751],
        'New Zealand'       => ['lat' => -40.9006,'lng' => 174.8860],
        // Africa
        'South Africa'      => ['lat' => -30.5595,'lng' => 22.9375],
        'Egypt'             => ['lat' => 26.8206, 'lng' => 30.8025],
        'Nigeria'           => ['lat' => 9.0820,  'lng' => 8.6753],
        'Kenya'             => ['lat' => -0.0236, 'lng' => 37.9062],
        'Morocco'           => ['lat' => 31.7917, 'lng' => -7.0926],
        'Ethiopia'          => ['lat' => 9.1450,  'lng' => 40.4897],
        'Ghana'             => ['lat' => 7.3697,  'lng' => -5.3631],
        'Uganda'            => ['lat' => 1.3733,  'lng' => 32.2903],
        // Middle East
        'Saudi Arabia'      => ['lat' => 23.8859, 'lng' => 45.0792],
        'UAE'               => ['lat' => 23.4241, 'lng' => 53.8478],
        'Israel'            => ['lat' => 31.0461, 'lng' => 34.8516],
        'Iran'              => ['lat' => 32.4279, 'lng' => 53.6880],
        'Turkey'            => ['lat' => 38.9637, 'lng' => 35.2433],
    ];
}

function getSampleDistribution(string $groupBy): array
{
    $sdgMeta = getSdgMetaMap();
    $coords  = getCountryCoordinates();

    if ($groupBy === 'institution') {
        $sample = [
            ['id' => 1,  'name' => 'Universitas Indonesia',          'country' => 'Indonesia',       'city' => 'Jakarta',     'researchers' => 1247, 'avg_impact' => 78.5, 'publications' => 4530, 'top_sdg_num' => 13],
            ['id' => 2,  'name' => 'Institut Teknologi Bandung',     'country' => 'Indonesia',       'city' => 'Bandung',     'researchers' =>  987, 'avg_impact' => 76.2, 'publications' => 3820, 'top_sdg_num' =>  9],
            ['id' => 3,  'name' => 'Universitas Gadjah Mada',        'country' => 'Indonesia',       'city' => 'Yogyakarta',  'researchers' =>  856, 'avg_impact' => 74.8, 'publications' => 3145, 'top_sdg_num' =>  4],
            ['id' => 4,  'name' => 'National University of Singapore','country' => 'Singapore',      'city' => 'Singapore',   'researchers' =>  723, 'avg_impact' => 88.4, 'publications' => 5670, 'top_sdg_num' =>  3],
            ['id' => 5,  'name' => 'University of Malaya',            'country' => 'Malaysia',        'city' => 'Kuala Lumpur','researchers' =>  634, 'avg_impact' => 75.6, 'publications' => 2980, 'top_sdg_num' =>  3],
            ['id' => 6,  'name' => 'Tokyo University',                'country' => 'Japan',           'city' => 'Tokyo',       'researchers' =>  587, 'avg_impact' => 91.2, 'publications' => 6234, 'top_sdg_num' =>  9],
            ['id' => 7,  'name' => 'University of Sydney',            'country' => 'Australia',       'city' => 'Sydney',      'researchers' =>  445, 'avg_impact' => 84.3, 'publications' => 3812, 'top_sdg_num' => 13],
            ['id' => 8,  'name' => 'University of Tokyo',             'country' => 'Japan',           'city' => 'Tokyo',       'researchers' =>  398, 'avg_impact' => 89.7, 'publications' => 4521, 'top_sdg_num' =>  7],
        ];
        return array_map(function ($r) use ($coords, $sdgMeta) {
            $base = $coords[$r['country']] ?? ['lat' => 0, 'lng' => 0];
            $jLat = ($r['id'] % 100) / 200 - 0.25;
            $jLng = (($r['id'] * 7) % 100) / 200 - 0.25;
            $n    = $r['top_sdg_num'];
            return array_merge($r, [
                'avg_citations' => $r['avg_impact'] * 15,
                'top_sdg'       => ['number' => $n, 'name' => $sdgMeta[$n]['name'], 'color' => $sdgMeta[$n]['color']],
                'lat'           => $base['lat'] + $jLat,
                'lng'           => $base['lng'] + $jLng,
            ]);
        }, $sample);
    }

    // groupBy = country
    $sample = [
        ['name' => 'Indonesia',       'researchers' => 5847, 'institutions' => 234, 'avg_impact' => 72.8, 'publications' => 18432, 'top_sdg_num' => 13],
        ['name' => 'United States',   'researchers' => 4231, 'institutions' => 187, 'avg_impact' => 93.4, 'publications' => 38120, 'top_sdg_num' =>  3],
        ['name' => 'United Kingdom',  'researchers' => 2156, 'institutions' =>  87, 'avg_impact' => 89.2, 'publications' => 15670, 'top_sdg_num' => 13],
        ['name' => 'Japan',           'researchers' => 1987, 'institutions' =>  76, 'avg_impact' => 88.1, 'publications' => 14234, 'top_sdg_num' =>  9],
        ['name' => 'Australia',       'researchers' => 1543, 'institutions' =>  56, 'avg_impact' => 86.5, 'publications' => 12876, 'top_sdg_num' => 13],
        ['name' => 'China',           'researchers' => 1432, 'institutions' =>  98, 'avg_impact' => 84.3, 'publications' => 21345, 'top_sdg_num' =>  9],
        ['name' => 'Germany',         'researchers' => 1187, 'institutions' =>  64, 'avg_impact' => 87.6, 'publications' => 10234, 'top_sdg_num' =>  7],
        ['name' => 'Malaysia',        'researchers' => 1054, 'institutions' =>  43, 'avg_impact' => 74.5, 'publications' =>  6789, 'top_sdg_num' =>  3],
        ['name' => 'Singapore',       'researchers' =>  876, 'institutions' =>  21, 'avg_impact' => 87.9, 'publications' =>  8932, 'top_sdg_num' =>  3],
        ['name' => 'Netherlands',     'researchers' =>  765, 'institutions' =>  38, 'avg_impact' => 86.4, 'publications' =>  7234, 'top_sdg_num' => 13],
    ];
    return array_map(function ($r) use ($coords, $sdgMeta) {
        $coord = $coords[$r['name']] ?? ['lat' => 0, 'lng' => 0];
        $n     = $r['top_sdg_num'];
        return array_merge($r, [
            'avg_citations' => $r['avg_impact'] * 15,
            'top_sdg'       => ['number' => $n, 'name' => $sdgMeta[$n]['name'], 'color' => $sdgMeta[$n]['color']],
            'lat'           => $coord['lat'],
            'lng'           => $coord['lng'],
        ]);
    }, $sample);
}
