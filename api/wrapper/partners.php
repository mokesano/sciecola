<?php
/**
 * Partners API
 * GET /api/partners.php?category=all&limit=50
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
        $category = trim($_GET['category'] ?? 'all');
        $limit    = (int)($_GET['limit'] ?? 50);

        if ($limit > 500) $limit = 500;
        if ($limit < 1)   $limit = 1;

        echo json_encode(getPartners($category, $limit));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getPartners(string $category, int $limit): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSamplePartners();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $where  = [];
        $params = [];

        if ($category !== 'all' && $category !== '') {
            $where[] = 'pc.slug = ?';
            $params[] = $category;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT p.id, p.name, pc.slug as category, p.logo_url, p.description,
                       p.website_url, p.partnership_type, p.start_date
                FROM partners p
                LEFT JOIN partner_categories pc ON pc.id = p.category_id
                $whereClause
                ORDER BY p.name ASC
                LIMIT $limit";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $partners = array_map(function ($row) {
            return [
                'id'               => (int)$row['id'],
                'name'             => $row['name'],
                'category'         => $row['category'],
                'logo'             => $row['logo_url'],
                'description'      => $row['description'],
                'website'          => $row['website_url'],
                'partnership_type' => $row['partnership_type'],
                'start_date'       => $row['start_date']
            ];
        }, $rows);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM partners p LEFT JOIN partner_categories pc ON pc.id = p.category_id $whereClause");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        return [
            'status'    => 'success',
            'partners'  => $partners,
            'total'     => $total,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSamplePartners();
    }
}

function getSamplePartners(): array {
    return [
        'status'   => 'success',
        'partners' => [
            [
                'id'               => 1,
                'name'             => 'University of Melbourne',
                'category'         => 'academic',
                'logo'             => 'https://via.placeholder.com/150x60/ef4444/ffffff?text=UoM',
                'description'      => 'Kolaborasi riset iklim dan keberlanjutan',
                'website'          => 'https://www.unimelb.edu.au',
                'partnership_type' => 'Research',
                'start_date'       => '2022-01-15'
            ],
            [
                'id'               => 2,
                'name'             => 'UNEP - United Nations Environment Programme',
                'category'         => 'ngo',
                'logo'             => 'https://via.placeholder.com/150x60/10b981/ffffff?text=UNEP',
                'description'      => 'Program lingkungan dan SDGs',
                'website'          => 'https://www.unep.org',
                'partnership_type' => 'Policy',
                'start_date'       => '2023-06-01'
            ],
            [
                'id'               => 3,
                'name'             => 'World Bank',
                'category'         => 'organization',
                'logo'             => 'https://via.placeholder.com/150x60/0ea5e9/ffffff?text=WorldBank',
                'description'      => 'Program pembangunan berkelanjutan',
                'website'          => 'https://www.worldbank.org',
                'partnership_type' => 'Development',
                'start_date'       => '2023-03-01'
            ]
        ],
        'total'     => 3,
        'timestamp' => date('c')
    ];
}
