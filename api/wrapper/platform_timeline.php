<?php
/**
 * Platform Timeline API
 * GET /api/platform_timeline.php?limit=50&sort=date
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $limit = (int)($_GET['limit'] ?? 50);
        $sort = trim($_GET['sort'] ?? 'date');

        if ($limit > 500) $limit = 500;
        if ($limit < 1) $limit = 1;

        echo json_encode(getPlatformTimeline($limit, $sort));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getPlatformTimeline(int $limit, string $sort): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSamplePlatformTimeline();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $orderBy = 'pt.timeline_date DESC';
        if ($sort === 'featured') {
            $orderBy = 'pt.is_featured DESC, pt.display_order ASC, pt.timeline_date DESC';
        } elseif ($sort === 'oldest') {
            $orderBy = 'pt.timeline_date ASC';
        }

        $stmt = $pdo->prepare("
            SELECT id, timeline_date, event_type, event_title, event_description,
                   event_image_url, event_link, impact_area, is_featured, display_order
            FROM platform_timeline
            ORDER BY $orderBy
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM platform_timeline");
        $countStmt->execute();
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        $eventsByYear = [];
        foreach ($events as $event) {
            $year = (new DateTime($event['timeline_date']))->format('Y');
            if (!isset($eventsByYear[$year])) {
                $eventsByYear[$year] = [];
            }
            $eventsByYear[$year][] = [
                'id' => (int)$event['id'],
                'date' => $event['timeline_date'],
                'type' => $event['event_type'],
                'title' => $event['event_title'],
                'description' => $event['event_description'],
                'image_url' => $event['event_image_url'],
                'link' => $event['event_link'],
                'impact_area' => $event['impact_area'],
                'is_featured' => (bool)$event['is_featured']
            ];
        }

        return [
            'status' => 'success',
            'timeline' => $eventsByYear,
            'total' => $total,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSamplePlatformTimeline();
    }
}

function getSamplePlatformTimeline(): array {
    return [
        'status' => 'success',
        'timeline' => [
            '2026' => [
                [
                    'id' => 1,
                    'date' => '2026-05-16',
                    'type' => 'milestone',
                    'title' => 'Platform Memasuki Beta Phase',
                    'description' => 'Sciecola/SDGs Mapper resmi memasuki fase beta dengan fitur core lengkap.',
                    'image_url' => null,
                    'link' => null,
                    'impact_area' => 'Infrastructure',
                    'is_featured' => true
                ],
                [
                    'id' => 2,
                    'date' => '2026-04-01',
                    'type' => 'partnership',
                    'title' => 'Kemitraan dengan University of Melbourne',
                    'description' => 'Dimulai kolaborasi riset untuk validasi metodologi SDG classification.',
                    'image_url' => null,
                    'link' => null,
                    'impact_area' => 'Research',
                    'is_featured' => true
                ]
            ],
            '2025' => [
                [
                    'id' => 3,
                    'date' => '2025-12-15',
                    'type' => 'feature',
                    'title' => 'Peluncuran Insights AI',
                    'description' => 'Fitur analisis berbasis AI untuk mengidentifikasi tren riset dan dampak SDG.',
                    'image_url' => null,
                    'link' => null,
                    'impact_area' => 'AI/ML',
                    'is_featured' => false
                ]
            ]
        ],
        'total' => 3,
        'timestamp' => date('c')
    ];
}
