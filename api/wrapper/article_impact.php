<?php
/**
 * Article Impact Metrics API
 * GET /api/article_impact.php[?sdg=13&years=5&sort=impact|citations|year&page=1&limit=10]
 *
 * Dipakai oleh halaman ArticleImpactMetrics.jsx untuk:
 *   - Tabel artikel paginated dengan skor dampak per dimensi
 *   - Radar/Bar chart: rata-rata dampak per SDG dan per kuartil jurnal
 *
 * Sumber: publications, journals, publication_authors, work_sdgs.
 * Catatan: hanya dimensi "academic_impact" yang punya sumber DB (citation_count).
 *          "social_impact" dan "practical_impact" → 0 (perlu sumber eksternal: Altmetric, dsb.)
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $sdg   = max(0, min(17, (int)($_GET['sdg']   ?? 0)));
    $years = max(0, (int)($_GET['years'] ?? 0));
    $sort  = in_array($_GET['sort'] ?? 'impact', ['impact', 'citations', 'year'], true)
        ? $_GET['sort'] : 'impact';
    $page  = max(1, (int)($_GET['page']  ?? 1));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));

    echo json_encode([
        'status'    => 'success',
        'data'      => fetchArticleImpactData($sdg, $years, $sort, $page, $limit),
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────

function fetchArticleImpactData(int $sdg, int $years, string $sort, int $page, int $limit): array
{
    $offset = ($page - 1) * $limit;

    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            $articles = (int) $pdo->query('SELECT COUNT(*) FROM publications')->fetchColumn();
            if ($articles > 0) {
                return buildImpactResponseFromDb($pdo, $sdg, $years, $sort, $page, $limit, $offset);
            }
        } catch (Exception $e) {
            // Fall through to sample data
        }
    }

    return getSampleImpactData($sdg, $sort, $page, $limit);
}

function buildImpactResponseFromDb(PDO $pdo, int $sdg, int $years, string $sort, int $page, int $limit, int $offset): array
{
    [$where, $params] = buildArticleWhere($sdg, $years);
    $orderBy = match ($sort) {
        'year'      => 'p.publication_year DESC',
        'citations' => 'p.citation_count DESC',
        default     => 'p.citation_count DESC',   // 'impact' uses citation proxy
    };

    // Max citation untuk normalisasi log
    $maxCit = (int) $pdo->query('SELECT COALESCE(MAX(citation_count), 0) FROM publications')->fetchColumn();
    $logMax = $maxCit > 0 ? log($maxCit + 1) : 1;

    // Total artikel (sesuai filter)
    $countSql = "SELECT COUNT(*) FROM publications p {$where}";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int) $stmt->fetchColumn();

    // Paginated articles
    $sql = "SELECT p.doi, p.title, p.publication_year AS year, p.citation_count AS citations,
                   j.title AS journal_name, j.quartile,
                   GROUP_CONCAT(DISTINCT TRIM(CONCAT(COALESCE(pa.given_names,''), ' ', COALESCE(pa.family_name,''))) ORDER BY pa.sequence SEPARATOR ', ') AS authors
            FROM publications p
            LEFT JOIN journals j ON j.id = p.journal_id
            LEFT JOIN publication_authors pa ON pa.doi = p.doi
            {$where}
            GROUP BY p.doi
            ORDER BY {$orderBy}
            LIMIT ? OFFSET ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([...$params, $limit, $offset]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // SDGs per artikel (batch lookup)
    $sdgMap = [];
    if ($rows) {
        $dois = array_column($rows, 'doi');
        $placeholders = implode(',', array_fill(0, count($dois), '?'));
        $stmt = $pdo->prepare("SELECT doi, sdg_number FROM work_sdgs WHERE doi IN ($placeholders)");
        $stmt->execute($dois);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $sdgMap[$r['doi']][] = (int) $r['sdg_number'];
        }
    }

    $articles = array_map(function ($r) use ($sdgMap, $logMax) {
        $cit = (int) ($r['citations'] ?? 0);
        $academic = $logMax > 0 ? round(log($cit + 1) / $logMax * 100, 1) : 0.0;
        $quartile = $r['quartile'] ? 'Q' . $r['quartile'] : null;
        return [
            'doi'             => $r['doi'],
            'title'           => $r['title'],
            'authors'         => $r['authors'] ? array_values(array_filter(explode(', ', $r['authors']))) : [],
            'journal'         => $r['journal_name'] ?? '',
            'quartile'        => $quartile,
            'year'            => (int) $r['year'],
            'citations'       => $cit,
            'social_mentions' => 0,
            'practical_uses'  => 0,
            'academic_impact'  => $academic,
            'social_impact'    => 0,
            'practical_impact' => 0,
            'total_impact'     => $academic,
            'sdgs'             => $sdgMap[$r['doi']] ?? [],
        ];
    }, $rows);

    // Impact by SDG (rata-rata dampak akademik per SDG)
    $sdgRows = $pdo->query(
        "SELECT ws.sdg_number, COUNT(DISTINCT p.doi) AS article_count,
                COALESCE(AVG(p.citation_count), 0) AS avg_citations
         FROM work_sdgs ws
         JOIN publications p ON p.doi = ws.doi
         GROUP BY ws.sdg_number
         ORDER BY ws.sdg_number ASC"
    )->fetchAll(PDO::FETCH_ASSOC);

    $sdgMeta = getSdgMetaLookup();
    $impactBySdg = array_map(function ($r) use ($sdgMeta, $logMax) {
        $sdgNum   = (int) $r['sdg_number'];
        $avg      = (float) $r['avg_citations'];
        $academic = $logMax > 0 ? round(log($avg + 1) / $logMax * 100, 1) : 0.0;
        return [
            'sdg'           => $sdgNum,
            'name'          => $sdgMeta[$sdgNum]['name']  ?? "SDG {$sdgNum}",
            'color'         => $sdgMeta[$sdgNum]['color'] ?? '#6b7280',
            'article_count' => (int) $r['article_count'],
            'academic'      => $academic,
            'social'        => 0,
            'practical'     => 0,
        ];
    }, $sdgRows);

    // Quartile breakdown (avg impact per quartile jurnal)
    $qRows = $pdo->query(
        "SELECT j.quartile, COUNT(p.doi) AS article_count,
                COALESCE(AVG(p.citation_count), 0) AS avg_citations
         FROM publications p
         JOIN journals j ON j.id = p.journal_id
         WHERE j.quartile IS NOT NULL
         GROUP BY j.quartile
         ORDER BY j.quartile ASC"
    )->fetchAll(PDO::FETCH_ASSOC);

    $quartileBreakdown = array_map(function ($r) use ($logMax) {
        $avg      = (float) $r['avg_citations'];
        $academic = $logMax > 0 ? round(log($avg + 1) / $logMax * 100, 1) : 0.0;
        return [
            'quartile'      => 'Q' . (int) $r['quartile'],
            'article_count' => (int) $r['article_count'],
            'academic'      => $academic,
            'social'        => 0,
            'practical'     => 0,
        ];
    }, $qRows);

    return [
        'articles'           => $articles,
        'total'              => $total,
        'page'               => $page,
        'limit'              => $limit,
        'total_pages'        => (int) ceil($total / $limit),
        'impact_by_sdg'      => $impactBySdg,
        'quartile_breakdown' => $quartileBreakdown,
        'dimensions_available' => [
            'academic'  => $logMax > 1,
            'social'    => false,
            'practical' => false,
        ],
    ];
}

/**
 * Susun WHERE clause + params untuk filter sdg/years.
 *
 * @return array{0:string,1:array}
 */
function buildArticleWhere(int $sdg, int $years): array
{
    $clauses = [];
    $params  = [];
    if ($years > 0) {
        $clauses[] = 'p.publication_year >= ?';
        $params[]  = (int) date('Y') - $years + 1;
    }
    if ($sdg >= 1 && $sdg <= 17) {
        $clauses[] = 'EXISTS (SELECT 1 FROM work_sdgs ws WHERE ws.doi = p.doi AND ws.sdg_number = ?)';
        $params[]  = $sdg;
    }
    $where = $clauses ? 'WHERE ' . implode(' AND ', $clauses) : '';
    return [$where, $params];
}

// ─── Sample fallback ─────────────────────────────────────────────────────────

function getSampleImpactData(int $sdg, string $sort, int $page, int $limit): array
{
    $sample = [
        [
            'doi'             => '10.1016/j.jclepro.2023.001',
            'title'           => 'Renewable Energy Transition in Indonesia: A Multi-Stakeholder Approach',
            'authors'         => ['Andi Rahman', 'Siti Nurhaliza'],
            'journal'         => 'Journal of Cleaner Production',
            'quartile'        => 'Q1',
            'year'            => 2023,
            'citations'       => 187,
            'social_mentions' => 0,
            'practical_uses'  => 0,
            'academic_impact'  => 88.4,
            'social_impact'    => 0,
            'practical_impact' => 0,
            'total_impact'     => 88.4,
            'sdgs'             => [7, 13],
        ],
        [
            'doi'             => '10.1016/j.scitotenv.2023.002',
            'title'           => 'Sustainable Urban Water Management for Coastal Indonesian Cities',
            'authors'         => ['Budi Santoso', 'Dewi Kusuma'],
            'journal'         => 'Science of Total Environment',
            'quartile'        => 'Q1',
            'year'            => 2023,
            'citations'       => 142,
            'social_mentions' => 0,
            'practical_uses'  => 0,
            'academic_impact'  => 82.1,
            'social_impact'    => 0,
            'practical_impact' => 0,
            'total_impact'     => 82.1,
            'sdgs'             => [6, 11],
        ],
        [
            'doi'             => '10.1007/s11051-023-003',
            'title'           => 'Nanoparticle Applications for Clean Water Treatment',
            'authors'         => ['Rini Hartono'],
            'journal'         => 'Journal of Nanoparticle Research',
            'quartile'        => 'Q2',
            'year'            => 2022,
            'citations'       => 98,
            'social_mentions' => 0,
            'practical_uses'  => 0,
            'academic_impact'  => 74.6,
            'social_impact'    => 0,
            'practical_impact' => 0,
            'total_impact'     => 74.6,
            'sdgs'             => [6],
        ],
        [
            'doi'             => '10.1038/s41586-2024-001',
            'title'           => 'AI for Tropical Disease Diagnosis in Southeast Asia',
            'authors'         => ['Maya Sari', 'Joko Widodo'],
            'journal'         => 'Nature',
            'quartile'        => 'Q1',
            'year'            => 2024,
            'citations'       => 76,
            'social_mentions' => 0,
            'practical_uses'  => 0,
            'academic_impact'  => 71.2,
            'social_impact'    => 0,
            'practical_impact' => 0,
            'total_impact'     => 71.2,
            'sdgs'             => [3, 9],
        ],
        [
            'doi'             => '10.1016/j.energy.2023.005',
            'title'           => 'Solar PV Integration in Rural Indonesian Grids',
            'authors'         => ['Eko Pratama'],
            'journal'         => 'Energy',
            'quartile'        => 'Q1',
            'year'            => 2023,
            'citations'       => 65,
            'social_mentions' => 0,
            'practical_uses'  => 0,
            'academic_impact'  => 68.5,
            'social_impact'    => 0,
            'practical_impact' => 0,
            'total_impact'     => 68.5,
            'sdgs'             => [7],
        ],
    ];

    if ($sdg >= 1 && $sdg <= 17) {
        $sample = array_values(array_filter($sample, fn ($a) => in_array($sdg, $a['sdgs'], true)));
    }

    $sdgMeta     = getSdgMetaLookup();
    $impactBySdg = array_map(fn ($n) => [
        'sdg'           => $n,
        'name'          => $sdgMeta[$n]['name'],
        'color'         => $sdgMeta[$n]['color'],
        'article_count' => 234 + ($n * 13),
        'academic'      => 50 + ($n * 2.4),
        'social'        => 0,
        'practical'     => 0,
    ], range(1, 17));

    return [
        'articles'           => array_slice($sample, ($page - 1) * $limit, $limit),
        'total'              => count($sample),
        'page'               => $page,
        'limit'              => $limit,
        'total_pages'        => max(1, (int) ceil(count($sample) / $limit)),
        'impact_by_sdg'      => $impactBySdg,
        'quartile_breakdown' => [
            ['quartile' => 'Q1', 'article_count' => 856, 'academic' => 78.5, 'social' => 0, 'practical' => 0],
            ['quartile' => 'Q2', 'article_count' => 423, 'academic' => 62.3, 'social' => 0, 'practical' => 0],
            ['quartile' => 'Q3', 'article_count' => 187, 'academic' => 48.2, 'social' => 0, 'practical' => 0],
            ['quartile' => 'Q4', 'article_count' =>  92, 'academic' => 35.1, 'social' => 0, 'practical' => 0],
        ],
        'dimensions_available' => [
            'academic'  => true,
            'social'    => false,
            'practical' => false,
        ],
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
