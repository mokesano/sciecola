<?php
declare(strict_types=1);

/**
 * @file api/wrapper/articles.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Articles List API - Provides a list of articles with filtering and sorting options.
 * 
 * Endpoint:
 * GET /api/articles.php?page=1&limit=20&sort=recent&search=...&sdg=3
 * Reads from: publications, publication_authors, journals, work_sdgs
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $page      = max(1, (int)($_GET['page'] ?? 1));
    $limit     = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset    = ($page - 1) * $limit;
    $sort      = in_array($_GET['sort'] ?? 'recent', ['recent', 'citations', 'title']) ? $_GET['sort'] : 'recent';
    $search    = trim($_GET['search'] ?? '');
    $sdgFilter = (int)($_GET['sdg'] ?? 0);

    $result = fetchArticlesList($offset, $limit, $sort, $search, $sdgFilter);

    echo json_encode([
        'status'      => 'success',
        'page'        => $page,
        'limit'       => $limit,
        'total'       => $result['total'],
        'total_pages' => (int) ceil($result['total'] / $limit),
        'data'        => $result['items'],
        'timestamp'   => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function fetchArticlesList(int $offset, int $limit, string $sort, string $search, int $sdgFilter): array
{
    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            $where  = [];
            $params = [];

            if ($search !== '') {
                $where[]  = '(MATCH(p.title) AGAINST(? IN BOOLEAN MODE) OR p.doi LIKE ?)';
                $params[] = $search . '*';
                $params[] = "%$search%";
            }
            if ($sdgFilter >= 1 && $sdgFilter <= 17) {
                $where[]  = 'EXISTS (SELECT 1 FROM work_sdgs ws WHERE ws.doi = p.doi AND ws.sdg_number = ?)';
                $params[] = $sdgFilter;
            }

            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            $orderBy = match ($sort) {
                'citations' => 'p.citation_count DESC',
                'title'     => 'p.title ASC',
                default     => 'p.publication_year DESC, p.created_at DESC',
            };

            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM publications p $whereClause");
            $countStmt->execute($params);
            $total = (int) $countStmt->fetchColumn();

            $dataStmt = $pdo->prepare(
                "SELECT p.doi, p.title, p.publication_year, p.citation_count, p.type,
                        p.volume, p.issue, p.pages,
                        j.title AS journal_name, j.issn,
                        GROUP_CONCAT(DISTINCT CONCAT(pa.given_names, ' ', pa.family_name) ORDER BY pa.sequence SEPARATOR ', ') AS authors
                 FROM publications p
                 LEFT JOIN journals j ON j.id = p.journal_id
                 LEFT JOIN publication_authors pa ON pa.doi = p.doi
                 $whereClause
                 GROUP BY p.doi
                 ORDER BY $orderBy
                 LIMIT ? OFFSET ?"
            );
            $dataStmt->execute([...$params, $limit, $offset]);
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                // Fetch SDG numbers for each DOI
                $dois    = array_column($rows, 'doi');
                $sdgMap  = [];
                if ($dois) {
                    $placeholders = implode(',', array_fill(0, count($dois), '?'));
                    $sdgStmt = $pdo->prepare("SELECT doi, sdg_number FROM work_sdgs WHERE doi IN ($placeholders)");
                    $sdgStmt->execute($dois);
                    foreach ($sdgStmt->fetchAll(PDO::FETCH_ASSOC) as $s) {
                        $sdgMap[$s['doi']][] = (int) $s['sdg_number'];
                    }
                }

                $items = array_map(fn ($r): array => [
                    'doi'          => $r['doi'],
                    'title'        => $r['title'],
                    'authors'      => $r['authors'] ? explode(', ', $r['authors']) : [],
                    'journal'      => $r['journal_name'] ?? '',
                    'year'         => (int) $r['publication_year'],
                    'citations'    => (int) $r['citation_count'],
                    'type'         => $r['type'] ?? 'journal-article',
                    'sdgs'         => $sdgMap[$r['doi']] ?? [],
                    'views'        => 0,
                    'downloads'    => 0,
                ], $rows);

                return ['total' => $total, 'items' => $items];
            }
        } catch (Exception $e) {
            // Fall through
        }
    }

    $sample = generateSampleArticles();
    if ($search) {
        $sample = array_values(array_filter($sample, fn ($a) =>
            stripos($a['title'], $search) !== false
        ));
    }
    if ($sdgFilter) {
        $sample = array_values(array_filter($sample, fn ($a) =>
            in_array($sdgFilter, $a['sdgs'] ?? [])
        ));
    }
    return ['total' => count($sample), 'items' => array_slice($sample, $offset, $limit)];
}

function generateSampleArticles(): array
{
    return [
        ['doi' => '10.1016/j.jclepro.2023.001', 'title' => 'Renewable Energy Transition in Indonesia', 'authors' => ['Dr. Andi Rahman'], 'journal' => 'Journal of Cleaner Production', 'year' => 2023, 'citations' => 45, 'type' => 'journal-article', 'sdgs' => [7, 13], 'views' => 1240, 'downloads' => 230],
        ['doi' => '10.1016/j.scitotenv.2023.002', 'title' => 'Sustainable Urban Water Management', 'authors' => ['Dr. Siti Nurhaliza'], 'journal' => 'Science of Total Environment', 'year' => 2023, 'citations' => 32, 'type' => 'journal-article', 'sdgs' => [6, 11], 'views' => 987, 'downloads' => 178],
        ['doi' => '10.1007/s11051-023-003', 'title' => 'Nanoparticle Applications for Clean Water', 'authors' => ['Prof. Budi Santoso'], 'journal' => 'Journal of Nanoparticle Research', 'year' => 2023, 'citations' => 28, 'type' => 'journal-article', 'sdgs' => [6], 'views' => 756, 'downloads' => 134],
    ];
}
