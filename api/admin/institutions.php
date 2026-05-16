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

    $method     = $_SERVER['REQUEST_METHOD'];
    $adminOrcid = $_SERVER['HTTP_X_ADMIN_ORCID'] ?? $_GET['admin_orcid'] ?? '';
    $ipAddress  = $_SERVER['REMOTE_ADDR'] ?? '';

    if (!$adminOrcid) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Admin ORCID required']);
        exit;
    }

    if ($method === 'POST') {
        echo json_encode(createInstitution($adminOrcid, $ipAddress));
    } elseif ($method === 'PUT') {
        echo json_encode(updateInstitution($adminOrcid, $ipAddress));
    } elseif ($method === 'DELETE') {
        echo json_encode(deleteInstitution($adminOrcid, $ipAddress));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/**
 * Validates numeric fields shared by create and update.
 * Returns an error message string on failure, or null on success.
 */
function validateInstitutionNumericFields(array $input): ?string {
    $rules = [
        'established_year' => ['min' => 1000, 'max' => 2100],
        'faculties_count' => ['min' => 0],
        'students_count' => ['min' => 0],
        'lecturers_count' => ['min' => 0]
    ];

    foreach ($rules as $field => $constraints) {
        if (!isset($input[$field])) continue;
        if (!is_numeric($input[$field])) {
            return "Invalid $field (must be numeric)";
        }
        $value = (int)$input[$field];
        if (isset($constraints['min']) && $value < $constraints['min']) {
            return "Invalid $field (minimum: {$constraints['min']})";
        }
        if (isset($constraints['max']) && $value > $constraints['max']) {
            return "Invalid $field (maximum: {$constraints['max']})";
        }
    }
    return null;
}

function createInstitution(string $adminOrcid, string $ipAddress): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['name'])) {
        return ['status' => 'error', 'message' => 'Institution name required'];
    }

    $validationError = validateInstitutionNumericFields($input);
    if ($validationError !== null) {
        return ['status' => 'error', 'message' => $validationError];
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

        $statsStmt = $pdo->prepare("INSERT INTO institution_stats (institution_id) VALUES (?)");
        $statsStmt->execute([$institutionId]);

        logActivity($adminOrcid, 'CREATE', 'institutions', (string)$institutionId, null, $input, $ipAddress);

        return [
            'status'         => 'success',
            'message'        => 'Institution created successfully',
            'institution_id' => (int)$institutionId,
            'timestamp'      => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create institution'];
    }
}

function updateInstitution(string $adminOrcid, string $ipAddress): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        return ['status' => 'error', 'message' => 'Institution ID required'];
    }

    $validationError = validateInstitutionNumericFields($input);
    if ($validationError !== null) {
        return ['status' => 'error', 'message' => $validationError];
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

        $oldStmt = $pdo->prepare("SELECT * FROM institutions WHERE id = ?");
        $oldStmt->execute([$input['id']]);
        $oldValues = $oldStmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValues) {
            return ['status' => 'error', 'message' => 'Institution not found'];
        }

        $updates = [];
        $params  = [];

        $fields = ['name', 'acronym', 'country', 'city', 'website_url', 'logo_url',
                   'type', 'established_year', 'rector_name', 'faculties_count',
                   'students_count', 'lecturers_count', 'motto'];

        foreach ($fields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[]  = $input[$field];
            }
        }

        if (empty($updates)) {
            return ['status' => 'error', 'message' => 'No fields to update'];
        }

        $params[] = $input['id'];
        $sql      = "UPDATE institutions SET " . implode(', ', $updates) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        logActivity($adminOrcid, 'UPDATE', 'institutions', (string)$input['id'], $oldValues, $input, $ipAddress);

        return [
            'status'    => 'success',
            'message'   => 'Institution updated successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update institution'];
    }
}

function deleteInstitution(string $adminOrcid, string $ipAddress): array {
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

        $getStmt = $pdo->prepare("SELECT * FROM institutions WHERE id = ?");
        $getStmt->execute([$input['id']]);
        $institution = $getStmt->fetch(PDO::FETCH_ASSOC);

        if (!$institution) {
            return ['status' => 'error', 'message' => 'Institution not found'];
        }

        $stmt = $pdo->prepare("DELETE FROM institutions WHERE id = ?");
        $stmt->execute([$input['id']]);

        logActivity($adminOrcid, 'DELETE', 'institutions', (string)$input['id'], $institution, null, $ipAddress);

        return [
            'status'    => 'success',
            'message'   => 'Institution deleted successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to delete institution'];
    }
}

function logActivity(string $adminOrcid, string $action, string $tableName, string $entityId, ?array $oldValues, ?array $newValues, string $ipAddress): void {
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
            $ipAddress ?: null
        ]);
    } catch (Exception $e) {
        error_log('Failed to log activity: ' . $e->getMessage());
    }
}
