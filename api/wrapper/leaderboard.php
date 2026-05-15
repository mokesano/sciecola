<?php
/**
 * Leaderboard API
 * GET /api/leaderboard.php?type=researchers|journals|institutions&limit=10
 * Reads from: researchers, publications, publication_authors, journals, institutions
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $type  = in_array($_GET['type'] ?? 'researchers', ['researchers', 'journals', 'institutions']) ? $_GET['type'] : 'researchers';
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));

    $data = fetchLeaderboardData($type, $limit);

    echo json_encode([
        'status'    => 'success',
        'type'      => $type,
        'data'      => $data,
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function fetchLeaderboardData(string $type, int $limit): array
{
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleLeaderboard($type, $limit);
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        if ($type === 'researchers') {
            $stmt = $pdo->prepare(
                'SELECT r.orcid, r.name, r.h_index, r.citation_count, r.country,
                        r.profile_cache_json,
                        i.name AS institution_name,
                        COUNT(DISTINCT pa.doi) AS pub_count
                 FROM researchers r
                 LEFT JOIN institutions i    ON i.id = r.institution_id
                 LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
                 WHERE r.cache_expires_at > NOW()
                 GROUP BY r.orcid
                 ORDER BY r.citation_count DESC
                 LIMIT ?'
            );
            $stmt->execute([$limit]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                return array_map(function (array $row, int $i): array {
                    $profile = json_decode($row['profile_cache_json'] ?? '{}', true) ?? [];
                    return [
                        'rank'        => $i + 1,
                        'name'        => $row['name'],
                        'institution' => $row['institution_name'] ?? ($profile['affiliation'] ?? ''),
                        'country'     => $row['country'] ?? 'Indonesia',
                        'publikasi'   => (int) $row['pub_count'],
                        'sitasi'      => (int) $row['citation_count'],
                        'hIndex'      => (int) $row['h_index'],
                        'impact'      => round((float)($profile['impact_score'] ?? 0), 1),
                        'orcid'       => $row['orcid'],
                        'avatar'      => $profile['avatar'] ?? null,
                    ];
                }, $rows, array_keys($rows));
            }
        }

        if ($type === 'journals') {
            $stmt = $pdo->prepare(
                'SELECT j.id, j.title, j.issn, j.cite_score, j.quartile, j.sjr_score,
                        COUNT(p.doi) AS article_count
                 FROM journals j
                 LEFT JOIN publications p ON p.journal_id = j.id
                 GROUP BY j.id
                 ORDER BY j.cite_score DESC
                 LIMIT ?'
            );
            $stmt->execute([$limit]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                return array_map(fn (array $r, int $i): array => [
                    'rank'      => $i + 1,
                    'name'      => $r['title'],
                    'issn'      => $r['issn'],
                    'citescore' => (float) $r['cite_score'],
                    'quartile'  => $r['quartile'] ? 'Q' . $r['quartile'] : 'N/A',
                    'sjr'       => (float) $r['sjr_score'],
                    'articles'  => (int) $r['article_count'],
                ], $rows, array_keys($rows));
            }
        }

        if ($type === 'institutions') {
            $stmt = $pdo->prepare(
                'SELECT i.id, i.name, i.country,
                        COUNT(DISTINCT r.orcid) AS researcher_count,
                        COUNT(DISTINCT pa.doi)   AS pub_count,
                        COALESCE(SUM(r.citation_count), 0) AS total_citations
                 FROM institutions i
                 LEFT JOIN researchers r  ON r.institution_id = i.id
                 LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
                 GROUP BY i.id
                 ORDER BY total_citations DESC
                 LIMIT ?'
            );
            $stmt->execute([$limit]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                return array_map(fn (array $r, int $i): array => [
                    'rank'         => $i + 1,
                    'name'         => $r['name'],
                    'country'      => $r['country'] ?? 'Indonesia',
                    'researchers'  => (int) $r['researcher_count'],
                    'publications' => (int) $r['pub_count'],
                    'citations'    => (int) $r['total_citations'],
                ], $rows, array_keys($rows));
            }
        }

    } catch (Exception $e) {
        // Fall through to sample data
    }

    return getSampleLeaderboard($type, $limit);
}

function getSampleLeaderboard(string $type, int $limit): array
{
    $data = [
        'researchers' => [
            ['rank' => 1, 'name' => 'Dr. Andi Rahman',      'institution' => 'Universitas Indonesia',        'country' => 'Indonesia',    'publikasi' => 42, 'sitasi' => 1248, 'hIndex' => 17, 'impact' => 92.4, 'orcid' => '0000-0002-5152-9727', 'avatar' => null],
            ['rank' => 2, 'name' => 'Dr. Siti Nurhaliza',   'institution' => 'BRIN',                         'country' => 'Indonesia',    'publikasi' => 38, 'sitasi' => 1102, 'hIndex' => 15, 'impact' => 88.7, 'orcid' => '0000-0001-6742-5861', 'avatar' => null],
            ['rank' => 3, 'name' => 'Prof. Budi Santoso',   'institution' => 'Institut Teknologi Bandung',   'country' => 'Indonesia',    'publikasi' => 35, 'sitasi' =>  982, 'hIndex' => 14, 'impact' => 85.1, 'orcid' => '0000-0002-8025-4072', 'avatar' => null],
            ['rank' => 4, 'name' => 'Dr. Dewi Lestari',     'institution' => 'Universitas Airlangga',        'country' => 'Indonesia',    'publikasi' => 31, 'sitasi' =>  876, 'hIndex' => 13, 'impact' => 78.6, 'orcid' => '0000-0003-1234-5678', 'avatar' => null],
            ['rank' => 5, 'name' => 'Prof. Maria Santos',   'institution' => 'University of the Philippines','country' => 'Philippines',  'publikasi' => 28, 'sitasi' =>  764, 'hIndex' => 12, 'impact' => 72.3, 'orcid' => '0000-0001-7890-1234', 'avatar' => null],
        ],
        'journals' => [
            ['rank' => 1, 'name' => 'Nature Climate Change',          'issn' => '1758-678X', 'citescore' => 4.56, 'quartile' => 'Q1', 'sjr' => 2.34, 'articles' => 87],
            ['rank' => 2, 'name' => 'Global Environmental Change',    'issn' => '0959-3780', 'citescore' => 3.12, 'quartile' => 'Q1', 'sjr' => 1.32, 'articles' => 62],
            ['rank' => 3, 'name' => 'Journal of Cleaner Production',  'issn' => '0959-6526', 'citescore' => 3.21, 'quartile' => 'Q1', 'sjr' => 1.45, 'articles' => 124],
            ['rank' => 4, 'name' => 'Marine Pollution Bulletin',      'issn' => '0025-326X', 'citescore' => 2.89, 'quartile' => 'Q2', 'sjr' => 0.92, 'articles' => 45],
            ['rank' => 5, 'name' => 'Journal of Environmental Sci.',  'issn' => '1001-0742', 'citescore' => 2.48, 'quartile' => 'Q2', 'sjr' => 0.85, 'articles' => 68],
        ],
        'institutions' => [
            ['rank' => 1, 'name' => 'Universitas Indonesia',      'country' => 'Indonesia', 'researchers' => 342, 'publications' => 1245, 'citations' => 18432],
            ['rank' => 2, 'name' => 'Institut Teknologi Bandung', 'country' => 'Indonesia', 'researchers' => 289, 'publications' => 1087, 'citations' => 15678],
            ['rank' => 3, 'name' => 'Universitas Gadjah Mada',   'country' => 'Indonesia', 'researchers' => 276, 'publications' =>  987, 'citations' => 14321],
            ['rank' => 4, 'name' => 'BRIN',                      'country' => 'Indonesia', 'researchers' => 198, 'publications' =>  876, 'citations' => 12456],
            ['rank' => 5, 'name' => 'IPB University',             'country' => 'Indonesia', 'researchers' => 187, 'publications' =>  765, 'citations' => 11234],
        ],
    ];
    return array_slice($data[$type] ?? [], 0, $limit);
}
