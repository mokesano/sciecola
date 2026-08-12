<?php
declare(strict_types=1);

/**
 * @file api/admin/researchers.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Researchers Management API for admin users.
 * 
 * Endpoint: Researchers Management
 * POST /api/admin/researchers (create)
 * PUT /api/admin/researchers (update)
 * DELETE /api/admin/researchers?orcid=... (delete)
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    if (!defined('DB_HOST') || !DB_HOST) {
        http_response_code(503);
        echo json_encode(['status' => 'error', 'message' => 'Database not configured']);
        exit;
    }

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
        DB_USERNAME, DB_PASSWORD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'POST':
            echo json_encode(createResearcher($pdo));
            break;
        case 'PUT':
            echo json_encode(updateResearcher($pdo));
            break;
        case 'DELETE':
            echo json_encode(deleteResearcher($pdo));
            break;
        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function createResearcher(PDO $pdo): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['orcid']) || !isset($input['name'])) {
        return ['status' => 'error', 'message' => 'ORCID and Name required'];
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO researchers (orcid, name, h_index, citation_count, country,
                collaboration_status, bio, profile_photo_url, research_keywords, institution_id,
                scopus_id, sinta_id, researcher_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $input['orcid'],
            $input['name'],
            0,
            0,
            $input['country'] ?? null,
            $input['collaboration_status'] ?? 'open',
            $input['bio'] ?? null,
            $input['profile_photo_url'] ?? null,
            $input['research_keywords'] ?? null,
            $input['institution_id'] ?? null,
            // Identifier peneliti selain ORCID. Kolomnya sudah lama ada di
            // skema tetapi belum pernah bisa diisi lewat admin, sehingga
            // profil hanya pernah menampilkan ORCID.
            ($input['scopus_id']     ?? '') ?: null,
            ($input['sinta_id']      ?? '') ?: null,
            ($input['researcher_id'] ?? '') ?: null,
        ]);

        logAdminAction($pdo, 'CREATE', 'researchers', $input['orcid'], null, $input);

        return [
            'status' => 'success',
            'message' => 'Researcher created',
            'orcid' => $input['orcid']
        ];
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            return ['status' => 'error', 'message' => 'Researcher already exists'];
        }
        throw $e;
    }
}

function updateResearcher(PDO $pdo): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['orcid'])) {
        return ['status' => 'error', 'message' => 'ORCID required'];
    }

    $updates = [];
    $params = [];

    foreach ([
        'name', 'collaboration_status', 'bio', 'profile_photo_url', 'research_keywords',
        'institution_id', 'scopus_id', 'sinta_id', 'researcher_id',
    ] as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updates)) {
        return ['status' => 'error', 'message' => 'No fields to update'];
    }

    $params[] = $input['orcid'];
    $sql = "UPDATE researchers SET " . implode(', ', $updates) . " WHERE orcid = ?";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        logAdminAction($pdo, 'UPDATE', 'researchers', $input['orcid'], null, $input);

        return ['status' => 'success', 'message' => 'Researcher updated'];
    } catch (Exception $e) {
        throw $e;
    }
}

function deleteResearcher(PDO $pdo): array {
    $orcid = $_GET['orcid'] ?? null;

    if (!$orcid) {
        return ['status' => 'error', 'message' => 'ORCID required'];
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM researchers WHERE orcid = ?");
        $stmt->execute([$orcid]);

        logAdminAction($pdo, 'DELETE', 'researchers', $orcid);

        return ['status' => 'success', 'message' => 'Researcher deleted'];
    } catch (Exception $e) {
        throw $e;
    }
}

function logAdminAction(PDO $pdo, string $action, string $table, string $entityId, ?array $oldValues = null, ?array $newValues = null): void {
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO admin_data_logs (admin_orcid, action, table_name, entity_id, old_values, new_values, ip_address)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $_GET['admin_orcid'] ?? 'system',
            $action,
            $table,
            $entityId,
            $oldValues ? json_encode($oldValues) : null,
            $newValues ? json_encode($newValues) : null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    } catch (Exception $e) {
        error_log('Failed to log admin action: ' . $e->getMessage());
    }
}
