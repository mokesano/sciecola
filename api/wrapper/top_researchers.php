<?php
declare(strict_types=1);

/**
 * @file api/wrapper/top_researchers.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Top Researchers API.
 * 
 * Endpoints:
 * GET /api/top_researchers.php[?page=1&limit=10&sort=impact|citations|hindex|publications
 *                              &sdg=13&country=Indonesia&search=...]
 *
 * Dipakai oleh halaman TopResearchers.jsx untuk:
 *   - Tabel peneliti paginated dengan composite impact_score
 *   - Distribusi peneliti per SDG (bar chart)
 *   - Detail panel: top publications, collaboration breakdown (domestic/international)
 *
 * Sumber: researchers, institutions, publication_authors, publications,
 *         journals, work_sdgs.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $page    = max(1, (int)($_GET['page'] ?? 1));
    $limit   = min(50, max(1, (int)($_GET['limit'] ?? 10)));
    $sort    = in_array($_GET['sort'] ?? 'impact', ['impact', 'citations', 'hindex', 'publications', 'name'], true)
        ? $_GET['sort'] : 'impact';
    $sdg     = max(0, min(17, (int)($_GET['sdg'] ?? 0)));
    $country = trim((string)($_GET['country'] ?? ''));
    $search  = trim((string)($_GET['search']  ?? ''));

    echo json_encode([
        'status'    => 'success',
        'data'      => fetchTopResearchersData($page, $limit, $sort, $sdg, $country, $search),
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────

function fetchTopResearchersData(int $page, int $limit, string $sort, int $sdg, string $country, string $search): array
{
    $offset = ($page - 1) * $limit;

    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            $totalResearchers = (int) $pdo->query('SELECT COUNT(*) FROM researchers')->fetchColumn();
            if ($totalResearchers > 0) {
                return buildResponseFromDb($pdo, $page, $limit, $offset, $sort, $sdg, $country, $search, $totalResearchers);
            }
        } catch (Exception $e) {
            // Fall through to sample data
        }
    }

    return getSampleData($page, $limit, $sort, $sdg, $country);
}

// ─── DB path ──────────────────────────────────────────────────────────────────

function buildResponseFromDb(PDO $pdo, int $page, int $limit, int $offset, string $sort, int $sdg, string $country, string $search, int $totalResearchers): array
{
    [$where, $params] = buildWhereClause($sdg, $country, $search);

    // Total filtered
    $countStmt = $pdo->prepare("SELECT COUNT(DISTINCT r.orcid) FROM researchers r LEFT JOIN institutions i ON i.id = r.institution_id {$where}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // Max values untuk normalisasi (1 query — minimal overhead)
    $maxRow = $pdo->query(
        'SELECT COALESCE(MAX(h_index),1) AS max_h,
                COALESCE(MAX(citation_count),1) AS max_cit
         FROM researchers'
    )->fetch(PDO::FETCH_ASSOC);
    $maxH      = max(1, (int) $maxRow['max_h']);
    $maxCit    = max(1, (int) $maxRow['max_cit']);
    $logMaxCit = log($maxCit + 1);

    $orderBy = match ($sort) {
        'citations'    => 'r.citation_count DESC',
        'hindex'       => 'r.h_index DESC',
        'publications' => 'pub_count DESC',
        'name'         => 'r.name ASC',
        default        => 'r.citation_count DESC',   // 'impact' diaproksimasi via citation_count
    };

    // Peneliti paginated + agregasi collab
    $sql = "SELECT r.orcid, r.name, r.h_index, r.citation_count, r.country AS researcher_country,
                   i.name AS institution_name, i.country AS institution_country,
                   COUNT(DISTINCT pa.doi) AS pub_count,
                   COUNT(DISTINCT CASE
                       WHEN co_i.country IS NOT NULL
                            AND co_i.country = COALESCE(i.country, r.country)
                            AND co_pa.orcid <> r.orcid
                       THEN co_pa.orcid END) AS domestic_collabs,
                   COUNT(DISTINCT CASE
                       WHEN co_i.country IS NOT NULL
                            AND co_i.country <> COALESCE(i.country, r.country)
                            AND co_pa.orcid <> r.orcid
                       THEN co_pa.orcid END) AS intl_collabs
            FROM researchers r
            LEFT JOIN institutions i  ON i.id = r.institution_id
            LEFT JOIN publication_authors pa    ON pa.orcid = r.orcid
            LEFT JOIN publication_authors co_pa ON co_pa.doi = pa.doi
            LEFT JOIN researchers       co_r    ON co_r.orcid = co_pa.orcid
            LEFT JOIN institutions      co_i    ON co_i.id = co_r.institution_id
            {$where}
            GROUP BY r.orcid
            ORDER BY {$orderBy}
            LIMIT ? OFFSET ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([...$params, $limit, $offset]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Top publications per researcher (batch)
    $pubsMap = [];
    if ($rows) {
        $orcids = array_column($rows, 'orcid');
        $placeholders = implode(',', array_fill(0, count($orcids), '?'));
        $pubStmt = $pdo->prepare(
            "SELECT pa.orcid, p.doi, p.title, p.publication_year AS year, p.citation_count AS citations,
                    j.title AS journal
             FROM publication_authors pa
             JOIN publications p ON p.doi = pa.doi
             LEFT JOIN journals j ON j.id = p.journal_id
             WHERE pa.orcid IN ($placeholders)
             ORDER BY p.citation_count DESC"
        );
        $pubStmt->execute($orcids);
        foreach ($pubStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $orc = $r['orcid'];
            if (!isset($pubsMap[$orc])) $pubsMap[$orc] = [];
            if (count($pubsMap[$orc]) < 3) {
                $pubsMap[$orc][] = [
                    'doi'       => $r['doi'],
                    'title'     => $r['title'],
                    'journal'   => $r['journal'] ?? '',
                    'year'      => (int) $r['year'],
                    'citations' => (int) $r['citations'],
                ];
            }
        }
    }

    // SDG distribution: jumlah peneliti per SDG
    $sdgRows = $pdo->query(
        'SELECT ws.sdg_number, COUNT(DISTINCT pa.orcid) AS researcher_count
         FROM work_sdgs ws
         JOIN publication_authors pa ON pa.doi = ws.doi
         WHERE pa.orcid IS NOT NULL
         GROUP BY ws.sdg_number
         ORDER BY researcher_count DESC
         LIMIT 8'
    )->fetchAll(PDO::FETCH_ASSOC);

    $sdgMeta     = getSdgMetaLookup();
    $distBySdg = array_map(fn ($r) => [
        'sdg'              => (int) $r['sdg_number'],
        'name'             => $sdgMeta[(int) $r['sdg_number']]['name'] ?? "SDG {$r['sdg_number']}",
        'color'            => $sdgMeta[(int) $r['sdg_number']]['color'] ?? '#6b7280',
        'researcher_count' => (int) $r['researcher_count'],
    ], $sdgRows);

    // Build researcher entries dengan impact_score
    $maxPub = 1;
    foreach ($rows as $r) $maxPub = max($maxPub, (int) $r['pub_count']);
    $logMaxPub = log($maxPub + 1);

    $researchers = array_map(function ($r) use ($pubsMap, $maxH, $logMaxCit, $logMaxPub) {
        $hIdx   = (int) $r['h_index'];
        $cit    = (int) $r['citation_count'];
        $pubs   = (int) $r['pub_count'];
        $domC   = (int) $r['domestic_collabs'];
        $intlC  = (int) $r['intl_collabs'];

        $hScore    = ($hIdx / $maxH) * 40;
        $citScore  = $logMaxCit > 0 ? (log($cit + 1) / $logMaxCit) * 30 : 0;
        $pubScore  = $logMaxPub > 0 ? (log($pubs + 1) / $logMaxPub) * 20 : 0;
        $collabScore = min(10, ($domC + $intlC) / 8);

        return [
            'orcid'                 => $r['orcid'],
            'name'                  => $r['name'],
            'affiliation'           => $r['institution_name'] ?? '',
            'country'               => $r['institution_country'] ?: $r['researcher_country'] ?: '—',
            'h_index'               => $hIdx,
            'citations'             => $cit,
            'publications'          => $pubs,
            'domestic_collabs'      => $domC,
            'international_collabs' => $intlC,
            'total_collabs'         => $domC + $intlC,
            'impact_score'          => round($hScore + $citScore + $pubScore + $collabScore, 1),
            'top_publications'      => $pubsMap[$r['orcid']] ?? [],
        ];
    }, $rows);

    // Sort by impact_score in PHP if sort=impact (since DB ordered by citation_count proxy)
    if ($sort === 'impact') {
        usort($researchers, fn ($a, $b) => $b['impact_score'] <=> $a['impact_score']);
    }

    // Daftar negara unik untuk filter dropdown
    $countryRows = $pdo->query(
        "SELECT DISTINCT COALESCE(i.country, r.country) AS country
         FROM researchers r
         LEFT JOIN institutions i ON i.id = r.institution_id
         WHERE COALESCE(i.country, r.country) IS NOT NULL
         ORDER BY country ASC
         LIMIT 30"
    )->fetchAll(PDO::FETCH_COLUMN);

    return [
        'researchers'       => $researchers,
        'total'             => $total,
        'total_all'         => $totalResearchers,
        'page'              => $page,
        'limit'             => $limit,
        'total_pages'       => max(1, (int) ceil($total / $limit)),
        'distribution_by_sdg' => $distBySdg,
        'available_countries' => array_values(array_filter($countryRows)),
    ];
}

function buildWhereClause(int $sdg, string $country, string $search): array
{
    $clauses = [];
    $params  = [];
    if ($search !== '') {
        $clauses[] = '(r.name LIKE ? OR i.name LIKE ?)';
        $params[]  = "%{$search}%";
        $params[]  = "%{$search}%";
    }
    if ($country !== '') {
        $clauses[] = '(i.country = ? OR (i.country IS NULL AND r.country = ?))';
        $params[]  = $country;
        $params[]  = $country;
    }
    if ($sdg >= 1 && $sdg <= 17) {
        $clauses[] = 'EXISTS (
            SELECT 1 FROM work_sdgs ws
            JOIN publication_authors pa2 ON pa2.doi = ws.doi
            WHERE pa2.orcid = r.orcid AND ws.sdg_number = ?
        )';
        $params[] = $sdg;
    }
    $where = $clauses ? 'WHERE ' . implode(' AND ', $clauses) : '';
    return [$where, $params];
}

// ─── Sample / fallback data ─────────────────────────────────────────────────

function getSampleData(int $page, int $limit, string $sort, int $sdg, string $country): array
{
    $sample = [
        ['orcid' => '0000-0002-5152-9727', 'name' => 'Prof. Andi Rahman',    'affiliation' => 'Universitas Indonesia',         'country' => 'Indonesia',  'h_index' => 34, 'citations' => 4532, 'publications' => 128, 'domestic_collabs' => 42, 'international_collabs' => 18, 'sdgs' => [7, 13]],
        ['orcid' => '0000-0001-6742-5861', 'name' => 'Dr. Siti Nurhaliza',    'affiliation' => 'Institut Teknologi Bandung',    'country' => 'Indonesia',  'h_index' => 29, 'citations' => 3891, 'publications' =>  97, 'domestic_collabs' => 38, 'international_collabs' => 14, 'sdgs' => [6, 11]],
        ['orcid' => '0000-0002-8025-4072', 'name' => 'Prof. Budi Santoso',    'affiliation' => 'Universitas Gadjah Mada',       'country' => 'Indonesia',  'h_index' => 27, 'citations' => 3245, 'publications' =>  84, 'domestic_collabs' => 35, 'international_collabs' => 12, 'sdgs' => [3, 9]],
        ['orcid' => '0000-0003-1234-5678', 'name' => 'Dr. Dewi Kusuma',       'affiliation' => 'IPB University',                'country' => 'Indonesia',  'h_index' => 24, 'citations' => 2987, 'publications' =>  73, 'domestic_collabs' => 28, 'international_collabs' =>  9, 'sdgs' => [2, 15]],
        ['orcid' => '0000-0001-7890-1234', 'name' => 'Dr. Rudi Hartono',      'affiliation' => 'Universitas Airlangga',         'country' => 'Indonesia',  'h_index' => 22, 'citations' => 2654, 'publications' =>  68, 'domestic_collabs' => 24, 'international_collabs' =>  8, 'sdgs' => [3]],
        ['orcid' => '0000-0002-3456-7890', 'name' => 'Dr. Eko Pratama',       'affiliation' => 'Universitas Brawijaya',          'country' => 'Indonesia',  'h_index' => 20, 'citations' => 2143, 'publications' =>  56, 'domestic_collabs' => 22, 'international_collabs' =>  7, 'sdgs' => [4, 10]],
        ['orcid' => '0000-0001-2345-6789', 'name' => 'Prof. Maria Santos',    'affiliation' => 'University of the Philippines', 'country' => 'Philippines','h_index' => 31, 'citations' => 3876, 'publications' => 102, 'domestic_collabs' => 26, 'international_collabs' => 21, 'sdgs' => [3, 13]],
        ['orcid' => '0000-0003-4567-8901', 'name' => 'Dr. Joko Widodo',       'affiliation' => 'BRIN',                          'country' => 'Indonesia',  'h_index' => 18, 'citations' => 1876, 'publications' =>  48, 'domestic_collabs' => 19, 'international_collabs' =>  6, 'sdgs' => [9, 11]],
    ];

    if ($sdg >= 1 && $sdg <= 17) {
        $sample = array_values(array_filter($sample, fn ($r) => in_array($sdg, $r['sdgs'], true)));
    }
    if ($country !== '') {
        $sample = array_values(array_filter($sample, fn ($r) => $r['country'] === $country));
    }

    // Compute impact score and top_publications stubs
    $maxH = max(1, ...array_map(fn($r) => $r['h_index'], $sample) ?: [1]);
    $maxCit = max(1, ...array_map(fn($r) => $r['citations'], $sample) ?: [1]);
    $maxPub = max(1, ...array_map(fn($r) => $r['publications'], $sample) ?: [1]);

    $researchers = array_map(function ($r, $idx) use ($maxH, $maxCit, $maxPub) {
        $h    = ($r['h_index'] / $maxH) * 40;
        $cit  = (log($r['citations']  + 1) / log($maxCit + 1)) * 30;
        $pub  = (log($r['publications']+ 1) / log($maxPub + 1)) * 20;
        $cbs  = min(10, ($r['domestic_collabs'] + $r['international_collabs']) / 8);
        return [
            'orcid'                 => $r['orcid'],
            'name'                  => $r['name'],
            'affiliation'           => $r['affiliation'],
            'country'               => $r['country'],
            'h_index'               => $r['h_index'],
            'citations'             => $r['citations'],
            'publications'          => $r['publications'],
            'domestic_collabs'      => $r['domestic_collabs'],
            'international_collabs' => $r['international_collabs'],
            'total_collabs'         => $r['domestic_collabs'] + $r['international_collabs'],
            'impact_score'          => round($h + $cit + $pub + $cbs, 1),
            'top_publications'      => [
                ['doi' => '10.1000/sample.' . ($idx + 1) . '.1', 'title' => 'Sample top publication 1', 'journal' => 'Sample Journal', 'year' => 2023, 'citations' => 124],
                ['doi' => '10.1000/sample.' . ($idx + 1) . '.2', 'title' => 'Sample top publication 2', 'journal' => 'Sample Journal', 'year' => 2022, 'citations' =>  87],
                ['doi' => '10.1000/sample.' . ($idx + 1) . '.3', 'title' => 'Sample top publication 3', 'journal' => 'Sample Journal', 'year' => 2021, 'citations' =>  54],
            ],
        ];
    }, $sample, array_keys($sample));

    if ($sort === 'impact') {
        usort($researchers, fn ($a, $b) => $b['impact_score'] <=> $a['impact_score']);
    } elseif ($sort === 'citations') {
        usort($researchers, fn ($a, $b) => $b['citations'] <=> $a['citations']);
    } elseif ($sort === 'hindex') {
        usort($researchers, fn ($a, $b) => $b['h_index'] <=> $a['h_index']);
    } elseif ($sort === 'publications') {
        usort($researchers, fn ($a, $b) => $b['publications'] <=> $a['publications']);
    }

    $sdgMeta = getSdgMetaLookup();
    $distBySdg = [
        ['sdg' => 3,  'researcher_count' => 432],
        ['sdg' => 4,  'researcher_count' => 387],
        ['sdg' => 13, 'researcher_count' => 354],
        ['sdg' => 9,  'researcher_count' => 312],
        ['sdg' => 11, 'researcher_count' => 287],
        ['sdg' => 7,  'researcher_count' => 234],
        ['sdg' => 6,  'researcher_count' => 198],
        ['sdg' => 17, 'researcher_count' => 176],
    ];
    $distBySdg = array_map(fn ($d) => array_merge($d, [
        'name'  => $sdgMeta[$d['sdg']]['name'],
        'color' => $sdgMeta[$d['sdg']]['color'],
    ]), $distBySdg);

    return [
        'researchers'       => array_slice($researchers, ($page - 1) * $limit, $limit),
        'total'             => count($researchers),
        'total_all'         => 12843,
        'page'              => $page,
        'limit'             => $limit,
        'total_pages'       => max(1, (int) ceil(count($researchers) / $limit)),
        'distribution_by_sdg' => $distBySdg,
        'available_countries' => ['Indonesia', 'Philippines', 'Malaysia', 'Singapore', 'Thailand'],
    ];
}

function getSdgMetaLookup(): array
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
