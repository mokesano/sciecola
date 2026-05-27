<?php
declare(strict_types=1);

/**
 * @file api/admin/expertise.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Admin Expertise Management API - Manages researcher expertise records for admin users.
 * 
 * Endpoint: Researcher Expertise Management
 * POST /api/admin/expertise.php (add expertise)
 * DELETE /api/admin/expertise.php?id=... (delete expertise)
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
            echo json_encode(addExpertise($pdo));
            break;
        case 'DELETE':
            echo json_encode(deleteExpertise($pdo));
            break;
        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Admin Expertise API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error']);
}

function addExpertise(PDO $pdo): array {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate ORCID
    if (!isset($input['orcid']) || empty(trim($input['orcid']))) {
        return ['status' => 'error', 'message' => 'Researcher ORCID is required'];
    }

    if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/', $input['orcid'])) {
        return ['status' => 'error', 'message' => 'Invalid ORCID format'];
    }

    try {
        // Verify researcher exists
        $checkStmt = $pdo->prepare("SELECT orcid FROM researchers WHERE orcid = ?");
        $checkStmt->execute([$input['orcid']]);
        if (!$checkStmt->fetch()) {
            return ['status' => 'error', 'message' => 'Researcher not found'];
        }

        $insertedIds = [];

        // Add field expertise if provided
        if (isset($input['field_name']) && !empty(trim($input['field_name']))) {
            $fieldStmt = $pdo->prepare(
                "INSERT INTO researcher_expertise (orcid, field_name, experience_years, certification_url)
                 VALUES (?, ?, ?, ?)"
            );

            $fieldStmt->execute([
                $input['orcid'],
                trim($input['field_name']),
                isset($input['experience_years']) ? intval($input['experience_years']) : null,
                isset($input['certification_url']) ? trim($input['certification_url']) : null
            ]);

            $insertedIds[] = intval($pdo->lastInsertId());
        }

        // Add SDG expertise if provided
        if (isset($input['sdg_number'])) {
            $sdgNumber = intval($input['sdg_number']);

            // Validate SDG number
            if ($sdgNumber < 1 || $sdgNumber > 17) {
                return ['status' => 'error', 'message' => 'SDG number must be between 1 and 17'];
            }

            // Validate expertise level
            $validLevels = ['beginner', 'intermediate', 'expert'];
            $expertiseLevel = isset($input['expertise_level']) && in_array($input['expertise_level'], $validLevels)
                ? $input['expertise_level']
                : 'intermediate';

            // Check if already exists
            $existStmt = $pdo->prepare(
                "SELECT id FROM researcher_sdg_expertise WHERE orcid = ? AND sdg_number = ?"
            );
            $existStmt->execute([$input['orcid'], $sdgNumber]);

            if ($existStmt->fetch()) {
                // Update existing
                $updateStmt = $pdo->prepare(
                    "UPDATE researcher_sdg_expertise SET expertise_level = ? WHERE orcid = ? AND sdg_number = ?"
                );
                $updateStmt->execute([$expertiseLevel, $input['orcid'], $sdgNumber]);
            } else {
                // Insert new
                $insertStmt = $pdo->prepare(
                    "INSERT INTO researcher_sdg_expertise (orcid, sdg_number, expertise_level)
                     VALUES (?, ?, ?)"
                );
                $insertStmt->execute([$input['orcid'], $sdgNumber, $expertiseLevel]);
                $insertedIds[] = intval($pdo->lastInsertId());
            }
        }

        if (empty($insertedIds)) {
            return ['status' => 'error', 'message' => 'No expertise data provided'];
        }

        // Log action
        logAdminAction($pdo, 'CREATE', 'researcher_expertise', $input['orcid'], null, $input);

        return [
            'status' => 'success',
            'message' => 'Expertise added successfully',
            'expertise_ids' => $insertedIds,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        // Check for duplicate entry
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            return ['status' => 'error', 'message' => 'This expertise entry already exists'];
        }
        error_log('Add expertise error: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to add expertise'];
    }
}

function deleteExpertise(PDO $pdo): array {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $type = isset($_GET['type']) ? trim($_GET['type']) : null; // 'field' or 'sdg'

    if (!$id || !$type || !in_array($type, ['field', 'sdg'])) {
        return ['status' => 'error', 'message' => 'Valid ID and type (field/sdg) are required'];
    }

    try {
        if ($type === 'field') {
            // Delete field expertise
            $checkStmt = $pdo->prepare("SELECT * FROM researcher_expertise WHERE id = ?");
            $checkStmt->execute([$id]);
            $expertise = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$expertise) {
                return ['status' => 'error', 'message' => 'Expertise not found'];
            }

            $stmt = $pdo->prepare("DELETE FROM researcher_expertise WHERE id = ?");
            $stmt->execute([$id]);

            logAdminAction($pdo, 'DELETE', 'researcher_expertise', (string)$id);
        } else {
            // Delete SDG expertise
            $checkStmt = $pdo->prepare("SELECT * FROM researcher_sdg_expertise WHERE id = ?");
            $checkStmt->execute([$id]);
            $expertise = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$expertise) {
                return ['status' => 'error', 'message' => 'SDG expertise not found'];
            }

            $stmt = $pdo->prepare("DELETE FROM researcher_sdg_expertise WHERE id = ?");
            $stmt->execute([$id]);

            logAdminAction($pdo, 'DELETE', 'researcher_sdg_expertise', (string)$id);
        }

        return [
            'status' => 'success',
            'message' => 'Expertise deleted successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log('Delete expertise error: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to delete expertise'];
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
