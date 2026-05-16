<?php
/**
 * Sponsors API
 * GET /api/sponsors.php?tier=all|platinum|gold|silver|bronze&limit=50
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
        $tier  = trim($_GET['tier'] ?? 'all');
        $limit = (int)($_GET['limit'] ?? 50);

        if ($limit > 500) $limit = 500;
        if ($limit < 1)   $limit = 1;

        echo json_encode(getSponsors($tier, $limit));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getSponsors(string $tier, int $limit): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleSponsors();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $where  = [];
        $params = [];

        if ($tier !== 'all' && $tier !== '') {
            $where[] = 'sc.slug = ?';
            $params[] = $tier;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT s.id, s.name, sc.slug as tier, sc.color_code, s.logo_url, s.description,
                       s.website_url, s.type, YEAR(s.since_year) as since
                FROM sponsors s
                LEFT JOIN sponsor_categories sc ON sc.id = s.category_id
                $whereClause
                ORDER BY sc.tier_level DESC, s.name ASC
                LIMIT $limit";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sponsors = array_map(function ($row) {
            return [
                'id'          => (int)$row['id'],
                'name'        => $row['name'],
                'tier'        => $row['tier'],
                'logo'        => $row['logo_url'],
                'description' => $row['description'],
                'since'       => (int)$row['since'],
                'website'     => $row['website_url'],
                'type'        => $row['type']
            ];
        }, $rows);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM sponsors s LEFT JOIN sponsor_categories sc ON sc.id = s.category_id $whereClause");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        return [
            'status'   => 'success',
            'sponsors' => $sponsors,
            'total'    => $total,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleSponsors();
    }
}

function getSampleSponsors(): array {
    return [
        'status'   => 'success',
        'sponsors' => [
            [
                'id'          => 1,
                'name'        => 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
                'tier'        => 'platinum',
                'logo'        => 'https://via.placeholder.com/200x80/fbbf24/ffffff?text=Kemdikbudristek',
                'description' => 'Mendukung digitalisasi riset Indonesia dan akselerasi pencapaian SDGs melalui inovasi teknologi.',
                'since'       => 2021,
                'website'     => 'https://www.kemdikbud.go.id',
                'type'        => 'Government'
            ],
            [
                'id'          => 2,
                'name'        => 'Badan Riset dan Inovasi Nasional (BRIN)',
                'tier'        => 'platinum',
                'logo'        => 'https://via.placeholder.com/200x80/6366f1/ffffff?text=BRIN',
                'description' => 'Memperkuat ekosistem riset nasional melalui platform analitik berbasis kecerdasan buatan.',
                'since'       => 2022,
                'website'     => 'https://www.brin.go.id',
                'type'        => 'Government'
            ],
            [
                'id'          => 3,
                'name'        => 'Google.org',
                'tier'        => 'platinum',
                'logo'        => 'https://via.placeholder.com/200x80/4285f4/ffffff?text=Google.org',
                'description' => 'Mendukung inisiatif teknologi untuk kebaikan sosial dan pembangunan berkelanjutan di Asia Tenggara.',
                'since'       => 2023,
                'website'     => 'https://www.google.org',
                'type'        => 'Corporate'
            ]
        ],
        'total'     => 3,
        'timestamp' => date('c')
    ];
}
