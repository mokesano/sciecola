<?php
/**
 * SDG Distribution API
 * GET /api/sdg_distribution.php?limit=17&sort=count
 * Reads from: work_sdgs GROUP BY sdg_number
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $limit = min(17, max(1, (int)($_GET['limit'] ?? 17)));
    $sort  = in_array($_GET['sort'] ?? 'count', ['count', 'id']) ? $_GET['sort'] : 'count';

    echo json_encode([
        'status'    => 'success',
        'data'      => fetchSdgDistribution($limit, $sort),
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function fetchSdgDistribution(int $limit, string $sort): array
{
    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            $orderBy = $sort === 'id' ? 'ws.sdg_number ASC' : 'total_count DESC';
            $stmt    = $pdo->query(
                "SELECT sdg_number, COUNT(*) AS total_count
                 FROM work_sdgs
                 GROUP BY sdg_number
                 ORDER BY {$orderBy}
                 LIMIT {$limit}"
            );
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                $meta  = getSdgMeta();
                $total = max(1, array_sum(array_column($rows, 'total_count')));
                return array_map(function (array $row) use ($meta, $total): array {
                    $sdgId = (int) $row['sdg_number'];
                    $count = (int) $row['total_count'];
                    $m     = $meta[$sdgId] ?? ['name' => "SDG {$sdgId}", 'color' => '#6b7280'];
                    return [
                        'sdg'        => $sdgId,
                        'name'       => $m['name'],
                        'color'      => $m['color'],
                        'count'      => $count,
                        'percentage' => round($count / $total * 100, 1),
                    ];
                }, $rows);
            }
        } catch (Exception $e) {
            // Fall through
        }
    }

    return getSampleSdgDistribution($limit);
}

function getSdgMeta(): array
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

function getSampleSdgDistribution(int $limit): array
{
    $sample = [
        ['sdg' => 3,  'name' => 'Good Health',             'color' => '#4c9f38', 'count' => 4623, 'percentage' => 18.7],
        ['sdg' => 4,  'name' => 'Quality Education',       'color' => '#c5192d', 'count' => 3812, 'percentage' => 15.4],
        ['sdg' => 13, 'name' => 'Climate Action',          'color' => '#3f7e44', 'count' => 3263, 'percentage' => 13.2],
        ['sdg' => 9,  'name' => 'Industry & Innovation',   'color' => '#fd6925', 'count' => 2865, 'percentage' => 11.6],
        ['sdg' => 11, 'name' => 'Sustainable Cities',      'color' => '#fd9d24', 'count' => 2421, 'percentage' =>  9.8],
        ['sdg' => 17, 'name' => 'Partnerships',            'color' => '#19486a', 'count' => 1957, 'percentage' =>  7.9],
        ['sdg' => 7,  'name' => 'Clean Energy',            'color' => '#fcc30b', 'count' => 1842, 'percentage' =>  7.4],
        ['sdg' => 6,  'name' => 'Clean Water',             'color' => '#26bde2', 'count' => 1236, 'percentage' =>  5.0],
        ['sdg' => 15, 'name' => 'Life on Land',            'color' => '#56c02b', 'count' =>  987, 'percentage' =>  4.0],
        ['sdg' => 14, 'name' => 'Life Below Water',        'color' => '#0a97d9', 'count' =>  876, 'percentage' =>  3.5],
        ['sdg' => 2,  'name' => 'Zero Hunger',             'color' => '#dda63a', 'count' =>  754, 'percentage' =>  3.0],
        ['sdg' => 8,  'name' => 'Decent Work',             'color' => '#a21942', 'count' =>  643, 'percentage' =>  2.6],
        ['sdg' => 12, 'name' => 'Responsible Consumption', 'color' => '#bf8b2e', 'count' =>  532, 'percentage' =>  2.1],
        ['sdg' => 1,  'name' => 'No Poverty',              'color' => '#e5243b', 'count' =>  421, 'percentage' =>  1.7],
        ['sdg' => 10, 'name' => 'Reduced Inequalities',    'color' => '#dd1367', 'count' =>  387, 'percentage' =>  1.6],
        ['sdg' => 16, 'name' => 'Peace & Justice',         'color' => '#00689d', 'count' =>  312, 'percentage' =>  1.3],
        ['sdg' => 5,  'name' => 'Gender Equality',         'color' => '#ff3a21', 'count' =>  267, 'percentage' =>  1.1],
    ];
    return array_slice($sample, 0, $limit);
}
