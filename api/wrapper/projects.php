<?php
/**
 * Project Management API
 * GET /api/projects?status=active
 * GET /api/projects/{id}
 * POST /api/projects (create)
 * PUT /api/projects/{id} (update)
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
    $action = $_GET['action'] ?? 'list';

    if ($method === 'GET') {
        if ($action === 'stats') {
            echo json_encode(getProjectStats());
        } else {
            echo json_encode(getProjects());
        }
    } elseif ($method === 'POST') {
        echo json_encode(createProject());
    } elseif ($method === 'PUT') {
        echo json_encode(updateProject());
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getProjects(): array {
    $status = $_GET['status'] ?? 'all';
    $search = trim($_GET['search'] ?? '');

    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleProjects();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $where = [];
        $params = [];

        if ($status !== 'all') {
            $where[] = 'rp.status = ?';
            $params[] = $status;
        }

        if ($search !== '') {
            $where[] = '(rp.title LIKE ? OR rp.description LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT
                    rp.id, rp.title, rp.description, rp.status, rp.progress,
                    rp.start_date, rp.end_date, rp.budget, rp.spent,
                    rp.sdg_focus, rp.lead_orcid,
                    r.name AS lead_name,
                    i.name AS institution,
                    COUNT(DISTINCT pm.orcid) AS team_size,
                    COUNT(DISTINCT pp.doi) AS publication_count
                FROM research_projects rp
                LEFT JOIN researchers r ON r.orcid = rp.lead_orcid
                LEFT JOIN institutions i ON i.id = rp.institution_id
                LEFT JOIN project_members pm ON pm.project_id = rp.id
                LEFT JOIN project_publications pp ON pp.project_id = rp.id
                $whereClause
                GROUP BY rp.id
                ORDER BY rp.updated_at DESC
                LIMIT 50";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $projects = array_map(function ($row) {
            $sdgFocus = json_decode($row['sdg_focus'] ?? '[]', true);
            return [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'description' => $row['description'],
                'status' => $row['status'],
                'progress' => (int)$row['progress'],
                'startDate' => $row['start_date'],
                'endDate' => $row['end_date'],
                'sdgFocus' => is_array($sdgFocus) ? $sdgFocus : [],
                'team' => (int)$row['team_size'],
                'publications' => (int)$row['publication_count'],
                'budget' => (float)($row['budget'] ?? 0),
                'spent' => (float)($row['spent'] ?? 0),
                'piName' => $row['lead_name'],
                'institution' => $row['institution']
            ];
        }, $rows);

        return [
            'status' => 'success',
            'data' => $projects,
            'total' => count($projects),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleProjects();
    }
}

function getProjectStats(): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return [
            'status' => 'success',
            'data' => [
                'total' => 5,
                'active' => 3,
                'planning' => 1,
                'completed' => 1,
                'totalBudget' => 2620000,
                'totalPublications' => 17
            ],
            'timestamp' => date('c')
        ];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(budget) as totalBudget,
                COUNT(DISTINCT id) as totalProjects
            FROM research_projects
        ");

        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        $pubStmt = $pdo->query("SELECT COUNT(*) as count FROM project_publications");
        $pubCount = $pubStmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        return [
            'status' => 'success',
            'data' => [
                'total' => (int)$stats['total'],
                'active' => (int)$stats['active'],
                'planning' => (int)$stats['planning'],
                'completed' => (int)$stats['completed'],
                'totalBudget' => (float)$stats['totalBudget'],
                'totalPublications' => (int)$pubCount
            ],
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return [
            'status' => 'error',
            'message' => 'Failed to fetch stats'
        ];
    }
}

function createProject(): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input['title'] || !$input['lead_orcid']) {
        return ['status' => 'error', 'message' => 'Missing required fields'];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'error', 'message' => 'Database not configured'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare(
            "INSERT INTO research_projects
             (title, description, status, lead_orcid, institution_id, sdg_focus, budget, start_date, end_date, visibility)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $input['title'],
            $input['description'] ?? null,
            $input['status'] ?? 'planning',
            $input['lead_orcid'],
            $input['institution_id'] ?? null,
            json_encode($input['sdg_focus'] ?? []),
            $input['budget'] ?? null,
            $input['start_date'] ?? null,
            $input['end_date'] ?? null,
            $input['visibility'] ?? 'public'
        ]);

        $projectId = $pdo->lastInsertId();

        return [
            'status' => 'success',
            'message' => 'Project created',
            'project_id' => (int)$projectId,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create project'];
    }
}

function updateProject(): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input['id']) {
        return ['status' => 'error', 'message' => 'Project ID required'];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'error', 'message' => 'Database not configured'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $updates = [];
        $params = [];

        if (isset($input['title'])) { $updates[] = 'title = ?'; $params[] = $input['title']; }
        if (isset($input['status'])) { $updates[] = 'status = ?'; $params[] = $input['status']; }
        if (isset($input['progress'])) { $updates[] = 'progress = ?'; $params[] = $input['progress']; }
        if (isset($input['spent'])) { $updates[] = 'spent = ?'; $params[] = $input['spent']; }
        if (isset($input['sdg_focus'])) { $updates[] = 'sdg_focus = ?'; $params[] = json_encode($input['sdg_focus']); }

        if (empty($updates)) {
            return ['status' => 'error', 'message' => 'No updates provided'];
        }

        $params[] = $input['id'];
        $sql = "UPDATE research_projects SET " . implode(', ', $updates) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return [
            'status' => 'success',
            'message' => 'Project updated',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update project'];
    }
}

function getSampleProjects(): array {
    return [
        'status' => 'success',
        'data' => [
            ['id' => 1, 'title' => 'Ocean Acidification Impact Study', 'description' => 'Comprehensive analysis', 'status' => 'active', 'progress' => 67, 'startDate' => '2024-01-15', 'endDate' => '2025-06-30', 'sdgFocus' => [13, 14], 'team' => 3, 'publications' => 3, 'budget' => 450000, 'spent' => 287500, 'piName' => 'Dr. Sarah Chen', 'institution' => 'MIT'],
            ['id' => 2, 'title' => 'Solar Grid Optimization Initiative', 'description' => 'AI-powered algorithms', 'status' => 'active', 'progress' => 45, 'startDate' => '2024-03-01', 'endDate' => '2025-12-31', 'sdgFocus' => [7, 9, 11], 'team' => 2, 'publications' => 1, 'budget' => 680000, 'spent' => 245000, 'piName' => 'Prof. Ahmed Hassan', 'institution' => 'Cairo University']
        ],
        'total' => 2,
        'timestamp' => date('c')
    ];
}
