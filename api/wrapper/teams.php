<?php
/**
 * Teams API
 * GET /api/teams.php?department=all&limit=50
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
        $department = trim($_GET['department'] ?? 'all');
        $limit      = (int)($_GET['limit'] ?? 50);

        if ($limit > 500) $limit = 500;
        if ($limit < 1)   $limit = 1;

        echo json_encode(getTeamMembers($department, $limit));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getTeamMembers(string $department, int $limit): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleTeamMembers();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $where  = [];
        $params = [];

        if ($department !== 'all' && $department !== '') {
            $where[] = 'td.slug = ?';
            $params[] = $department;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT tm.id, tm.name, tm.slug, tm.code, tm.email, tm.phone,
                       tm.bio, tm.long_bio, tm.avatar_url, tm.role, tm.location,
                       tm.joined_year, td.name as department, td.slug as dept_slug,
                       tm.sdg_focus
                FROM team_members tm
                LEFT JOIN team_departments td ON td.id = tm.department_id
                $whereClause
                ORDER BY td.order ASC, tm.name ASC
                LIMIT $limit";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $members = array_map(function ($row) {
            $sdgFocus = json_decode($row['sdg_focus'] ?? '[]', true);
            return [
                'id'         => (int)$row['id'],
                'name'       => $row['name'],
                'slug'       => $row['slug'],
                'code'       => $row['code'],
                'email'      => $row['email'],
                'phone'      => $row['phone'],
                'bio'        => $row['bio'],
                'long_bio'   => $row['long_bio'],
                'avatar'     => $row['avatar_url'],
                'role'       => $row['role'],
                'location'   => $row['location'],
                'joined_year' => (int)($row['joined_year'] ?? 0),
                'department' => $row['department'],
                'sdg_focus'  => is_array($sdgFocus) ? $sdgFocus : []
            ];
        }, $rows);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM team_members tm LEFT JOIN team_departments td ON td.id = tm.department_id $whereClause");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        return [
            'status'   => 'success',
            'members'  => $members,
            'total'    => $total,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleTeamMembers();
    }
}

function getSampleTeamMembers(): array {
    return [
        'status'   => 'success',
        'members'  => [
            [
                'id'          => 1,
                'name'        => 'Dr. Budi Santoso',
                'slug'        => 'budi-santoso',
                'code'        => 'TM-L001',
                'email'       => 'budi.santoso@sdgmapper.org',
                'phone'       => '+62-812-3456-7890',
                'bio'         => 'Director, SDG Research & Analytics',
                'long_bio'    => 'PhD in Computer Science from MIT. 15+ years experience in research analytics and SDG classification.',
                'avatar'      => 'https://via.placeholder.com/200/6366f1/ffffff?text=BS',
                'role'        => 'Leadership',
                'location'    => 'Jakarta, Indonesia',
                'joined_year' => 2020,
                'department'  => 'Leadership',
                'sdg_focus'   => [4, 9, 17]
            ],
            [
                'id'          => 2,
                'name'        => 'Siti Nurhaliza',
                'slug'        => 'siti-nurhaliza',
                'code'        => 'TM-A001',
                'email'       => 'siti.nurhaliza@sdgmapper.org',
                'phone'       => '+62-812-9876-5432',
                'bio'         => 'Senior AI/ML Engineer',
                'long_bio'    => 'M.Tech in AI from IIT Delhi. Expert in machine learning and NLP for SDG classification.',
                'avatar'      => 'https://via.placeholder.com/200/10b981/ffffff?text=SN',
                'role'        => 'Engineering',
                'location'    => 'Bandung, Indonesia',
                'joined_year' => 2021,
                'department'  => 'Engineering',
                'sdg_focus'   => [4, 9]
            ],
            [
                'id'          => 3,
                'name'        => 'Eko Wijaya',
                'slug'        => 'eko-wijaya',
                'code'        => 'TM-R001',
                'email'       => 'eko.wijaya@sdgmapper.org',
                'phone'       => '+62-812-1122-3344',
                'bio'         => 'Research Analyst',
                'long_bio'    => 'MSc in Environmental Science. Focus on SDG impact assessment and research trends.',
                'avatar'      => 'https://via.placeholder.com/200/f59e0b/ffffff?text=EW',
                'role'        => 'Research',
                'location'    => 'Surabaya, Indonesia',
                'joined_year' => 2022,
                'department'  => 'Research',
                'sdg_focus'   => [13, 14, 15]
            ]
        ],
        'total'     => 3,
        'timestamp' => date('c')
    ];
}
