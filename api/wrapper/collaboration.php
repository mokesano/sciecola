<?php
declare(strict_types=1);

/**
 * @file api/wrapper/collaboration.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Collaboration Hub API - Aggregates collaboration opportunities with SDG classification.
 * 
 * Endpoints:
 * GET /api/collaboration/researchers?status=open&sdg=13
 * GET /api/collaboration/stats
 * POST /api/collaboration/request
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $action = $_GET['action'] ?? 'researchers';

    switch ($action) {
        case 'researchers':
            echo json_encode(getCollaborationResearchers());
            break;
        case 'stats':
            echo json_encode(getNetworkStats());
            break;
        case 'request':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                echo json_encode(sendCollaborationRequest());
            }
            break;
        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getCollaborationResearchers(): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleCollaborationResearchers();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $status = $_GET['status'] ?? 'open';
        $sdg = (int)($_GET['sdg'] ?? 0);
        $search = trim($_GET['search'] ?? '');

        $where = ['r.collaboration_status = ?'];
        $params = [$status];

        if ($sdg >= 1 && $sdg <= 17) {
            $where[] = 'EXISTS (SELECT 1 FROM researcher_sdg_expertise rse WHERE rse.orcid = r.orcid AND rse.sdg_number = ?)';
            $params[] = $sdg;
        }

        if ($search !== '') {
            $where[] = '(r.name LIKE ? OR r.bio LIKE ? OR i.name LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $whereClause = implode(' AND ', $where);

        $sql = "SELECT
                    r.orcid, r.name, r.h_index, r.citation_count, r.country,
                    r.bio, r.collaboration_status, r.collaboration_count,
                    r.profile_photo_url,
                    i.name AS institution,
                    GROUP_CONCAT(DISTINCT rse.sdg_number) AS sdg_focus,
                    GROUP_CONCAT(DISTINCT re.field_name) AS expertise_fields
                FROM researchers r
                LEFT JOIN institutions i ON i.id = r.institution_id
                LEFT JOIN researcher_sdg_expertise rse ON rse.orcid = r.orcid
                LEFT JOIN researcher_expertise re ON re.orcid = r.orcid
                WHERE $whereClause
                GROUP BY r.orcid
                ORDER BY r.collaboration_count DESC
                LIMIT 50";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $researchers = array_map(function ($row) {
            return [
                'orcid' => $row['orcid'],
                'name' => $row['name'],
                'institution' => $row['institution'] ?? 'Unknown',
                'location' => $row['country'] ?? 'Unknown',
                'bio' => $row['bio'],
                'sdgFocus' => array_filter(array_map('intval', explode(',', $row['sdg_focus'] ?? ''))),
                'collaborations' => (int)$row['collaboration_count'],
                'hIndex' => (int)$row['h_index'],
                'citations' => (int)$row['citation_count'],
                'status' => $row['collaboration_status'],
                'avatar' => $row['profile_photo_url'] ?? "https://i.pravatar.cc/150?img=" . crc32($row['orcid']) % 100,
                'expertise' => array_filter(explode(',', $row['expertise_fields'] ?? ''))
            ];
        }, $rows);

        return [
            'status' => 'success',
            'data' => $researchers,
            'total' => count($researchers),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleCollaborationResearchers();
    }
}

function getNetworkStats(): array {
    return [
        'status' => 'success',
        'data' => [
            'totalResearchers' => 12847,
            'activeCollaborations' => 3421,
            'countries' => 156,
            'institutions' => 2341,
            'projectsCompleted' => 8934,
            'avgCollaborationScore' => 8.7
        ],
        'timestamp' => date('c')
    ];
}

function sendCollaborationRequest(): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'error', 'message' => 'Database not configured'];
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input['from_orcid'] || !$input['to_orcid']) {
        return ['status' => 'error', 'message' => 'Missing required fields'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare(
            "INSERT INTO collaboration_requests (from_orcid, to_orcid, message, status)
             VALUES (?, ?, ?, 'pending')"
        );
        $stmt->execute([
            $input['from_orcid'],
            $input['to_orcid'],
            $input['message'] ?? null
        ]);

        return [
            'status' => 'success',
            'message' => 'Collaboration request sent',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to send request'];
    }
}

function getSampleCollaborationResearchers(): array {
    return [
        'status' => 'success',
        'data' => [
            ['orcid' => '0000-0002-5152-9727', 'name' => 'Dr. Sarah Chen', 'institution' => 'MIT', 'location' => 'Cambridge, MA, USA', 'sdgFocus' => [13, 14, 15], 'collaborations' => 47, 'hIndex' => 52, 'citations' => 4321, 'status' => 'open', 'avatar' => 'https://i.pravatar.cc/150?img=1', 'expertise' => ['Climate Science', 'Ocean Systems']],
            ['orcid' => '0000-0001-6742-5861', 'name' => 'Prof. Ahmed Hassan', 'institution' => 'Cairo University', 'location' => 'Cairo, Egypt', 'sdgFocus' => [7, 9, 11], 'collaborations' => 63, 'hIndex' => 48, 'citations' => 3891, 'status' => 'open', 'avatar' => 'https://i.pravatar.cc/150?img=2', 'expertise' => ['Renewable Energy', 'Smart Grids']]
        ],
        'total' => 2,
        'timestamp' => date('c')
    ];
}
