<?php
/**
 * Admin Institutions API
 * POST /api/admin/institutions (create)
 * PUT /api/admin/institutions (update)
 * DELETE /api/admin/institutions (delete)
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
    $adminOrcid = $_SERVER['HTTP_X_ADMIN_ORCID'] ?? $_GET['admin_orcid'] ?? '';

    if (!$adminOrcid) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Admin ORCID required']);
        exit;
    }

    if ($method === 'POST') {
        echo json_encode(createInstitution($adminOrcid));
    } elseif ($method === 'PUT') {
        echo json_encode(updateInstitution($adminOrcid));
    } elseif ($method === 'DELETE') {
        echo json_encode(deleteInstitution($adminOrcid));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function createInstitution(string $adminOrcid): array {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (empty($input['name'])) {
        return ['status' => 'error', 'message' => 'Institution name required'];
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

        $stmt = $pdo->prepare("
            INSERT INTO institutions
            (name, acronym, country, city, website_url, logo_url, type, established_year,
             rector_name, faculties_count, students_count, lecturers_count, motto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $input['name'],
            $input['acronym'] ?? null,
            $input['country'] ?? null,
            $input['city'] ?? null,
            $input['website_url'] ?? null,
            $input['logo_url'] ?? null,
            $input['type'] ?? null,
            $input['established_year'] ?? null,
            $input['rector_name'] ?? null,
            $input['faculties_count'] ?? null,
            $input['students_count'] ?? null,
            $input['lecturers_count'] ?? null,
            $input['motto'] ?? null
        ]);

        $institutionId = $pdo->lastInsertId();

        // Create stats record
        $statsStmt = $pdo->prepare("
            INSERT INTO institution_stats (institution_id) VALUES (?)
        ");
        $statsStmt->execute([$institutionId]);

        // Log activity
        logActivity($adminOrcid, 'CREATE', 'institutions', (string)$institutionId, null, $input);

        return [
            'status' => 'success',
            'message' => 'Institution created successfully',
            'institution_id' => (int)$institutionId,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create institution'];
    }
}

function updateInstitution(string $adminOrcid): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        return ['status' => 'error', 'message' => 'Institution ID required'];
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

        // Get old values for audit
        $oldStmt = $pdo->prepare("SELECT * FROM institutions WHERE id = ?");
        $oldStmt->execute([$input['id']]);
        $oldValues = $oldStmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValues) {
            return ['status' => 'error', 'message' => 'Institution not found'];
        }

        $updates = [];
        $params = [];

        $fields = ['name', 'acronym', 'country', 'city', 'website_url', 'logo_url',
                   'type', 'established_year', 'rector_name', 'faculties_count',
                   'students_count', 'lecturers_count', 'motto'];

        foreach ($fields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (empty($updates)) {
            return ['status' => 'error', 'message' => 'No fields to update'];
        }

        $params[] = $input['id'];
        $sql = "UPDATE institutions SET " . implode(', ', $updates) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Log activity
        logActivity($adminOrcid, 'UPDATE', 'institutions', (string)$input['id'], $oldValues, $input);

        return [
            'status' => 'success',
            'message' => 'Institution updated successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update institution'];
    }
}

function deleteInstitution(string $adminOrcid): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        return ['status' => 'error', 'message' => 'Institution ID required'];
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

        // Get institution data for audit
        $getStmt = $pdo->prepare("SELECT * FROM institutions WHERE id = ?");
        $getStmt->execute([$input['id']]);
        $institution = $getStmt->fetch(PDO::FETCH_ASSOC);

        if (!$institution) {
            return ['status' => 'error', 'message' => 'Institution not found'];
        }

        $stmt = $pdo->prepare("DELETE FROM institutions WHERE id = ?");
        $stmt->execute([$input['id']]);

        // Log activity
        logActivity($adminOrcid, 'DELETE', 'institutions', (string)$input['id'], $institution, null);

        return [
            'status' => 'success',
            'message' => 'Institution deleted successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to delete institution'];
    }
}

function logActivity(string $adminOrcid, string $action, string $tableName, string $entityId, ?array $oldValues, ?array $newValues): void {
    if (!defined('DB_HOST') || !DB_HOST) {
        return;
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            INSERT INTO admin_data_logs (admin_orcid, action, table_name, entity_id, old_values, new_values, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $adminOrcid,
            $action,
            $tableName,
            $entityId,
            $oldValues ? json_encode($oldValues) : null,
            $newValues ? json_encode($newValues) : null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    } catch (Exception $e) {
        error_log('Failed to log activity: ' . $e->getMessage());
    }
}
