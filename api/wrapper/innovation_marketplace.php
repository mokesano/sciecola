<?php
/**
 * Innovation Marketplace API
 * GET /api/innovation_marketplace?category=all&search=
 * POST /api/innovation_marketplace/apply
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
    $action = $_GET['action'] ?? 'opportunities';

    if ($method === 'GET') {
        if ($action === 'opportunities') {
            echo json_encode(getOpportunities());
        } elseif ($action === 'stats') {
            echo json_encode(getMarketplaceStats());
        }
    } elseif ($method === 'POST') {
        if ($action === 'apply') {
            echo json_encode(applyToOpportunity());
        }
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getOpportunities(): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleOpportunities();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $category = trim($_GET['category'] ?? 'all');
        $search = trim($_GET['search'] ?? '');

        $where = ['io.status = ?'];
        $params = ['open'];

        if ($category !== 'all') {
            $where[] = 'ic.name = ?';
            $params[] = $category;
        }

        if ($search !== '') {
            $where[] = '(io.title LIKE ? OR io.description LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $whereClause = implode(' AND ', $where);

        $sql = "SELECT
                    io.id, io.title, io.description, io.status,
                    io.deadline, io.budget_range,
                    io.sdg_alignment, io.required_skills,
                    ic.name as category,
                    org.name as organization,
                    org.type as org_type,
                    org.logo_url,
                    COUNT(DISTINCT oa.id) as application_count
                FROM innovation_opportunities io
                LEFT JOIN innovation_categories ic ON ic.id = io.category_id
                LEFT JOIN organizations org ON org.id = io.organization_id
                LEFT JOIN opportunity_applications oa ON oa.opportunity_id = io.id
                WHERE $whereClause
                GROUP BY io.id
                ORDER BY io.created_at DESC
                LIMIT 50";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $opportunities = array_map(function ($row) {
            $sdgs = json_decode($row['sdg_alignment'] ?? '[]', true);
            $skills = json_decode($row['required_skills'] ?? '[]', true);

            return [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'organization' => $row['organization'],
                'type' => $row['org_type'],
                'category' => $row['category'],
                'description' => substr($row['description'], 0, 300) . '...',
                'sdgFocus' => is_array($sdgs) ? $sdgs : [],
                'budget' => $row['budget_range'],
                'deadline' => $row['deadline'],
                'applicants' => (int)$row['application_count'],
                'status' => 'open',
                'logo' => $row['logo_url']
            ];
        }, $rows);

        return [
            'status' => 'success',
            'data' => $opportunities,
            'total' => count($opportunities),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleOpportunities();
    }
}

function getMarketplaceStats(): array {
    return [
        'status' => 'success',
        'data' => [
            'totalOpportunities' => 247,
            'totalFunding' => '$127M+',
            'activePartnerships' => 89,
            'successRate' => '73%'
        ],
        'timestamp' => date('c')
    ];
}

function applyToOpportunity(): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input['opportunity_id'] || !$input['applicant_email']) {
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
            "INSERT INTO opportunity_applications
             (opportunity_id, applicant_orcid, applicant_name, applicant_email,
              applicant_institution_id, application_text, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')"
        );

        $stmt->execute([
            $input['opportunity_id'],
            $input['applicant_orcid'] ?? null,
            $input['applicant_name'] ?? 'Anonymous',
            $input['applicant_email'],
            $input['applicant_institution_id'] ?? null,
            $input['application_text'] ?? ''
        ]);

        return [
            'status' => 'success',
            'message' => 'Application submitted',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to submit application'];
    }
}

function getSampleOpportunities(): array {
    return [
        'status' => 'success',
        'data' => [
            ['id' => 1, 'title' => 'Carbon Capture Technology Partnership', 'organization' => 'Tesla Energy', 'type' => 'industry', 'category' => 'Climate Tech', 'description' => 'Seeking academic partners for next-generation carbon capture...', 'sdgFocus' => [13, 9, 7], 'budget' => '$2.5M', 'deadline' => '2025-02-28', 'applicants' => 47, 'status' => 'open', 'logo' => 'https://logo.clearbit.com/tesla.com'],
            ['id' => 2, 'title' => 'AI-Driven Drug Discovery Collaboration', 'organization' => 'Pfizer Research', 'type' => 'industry', 'category' => 'Healthcare', 'description' => 'Revolutionary AI platform for accelerating drug discovery...', 'sdgFocus' => [3, 9], 'budget' => '$4.2M', 'deadline' => '2025-01-31', 'applicants' => 89, 'status' => 'open', 'logo' => 'https://logo.clearbit.com/pfizer.com']
        ],
        'total' => 2,
        'timestamp' => date('c')
    ];
}
