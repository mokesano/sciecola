<?php
/**
 * Admin API: Projects Management
 * POST /api/admin/projects.php (create)
 * PUT /api/admin/projects.php (update)
 * DELETE /api/admin/projects.php?id=... (delete)
 */

declare(strict_types=1);
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
            echo json_encode(createProject($pdo));
            break;
        case 'PUT':
            echo json_encode(updateProject($pdo));
            break;
        case 'DELETE':
            echo json_encode(deleteProject($pdo));
            break;
        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Admin Projects API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}

function createProject(PDO $pdo): array {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($input['title']) || empty(trim($input['title']))) {
        return ['status' => 'error', 'message' => 'Project title is required'];
    }

    if (!isset($input['lead_orcid']) || empty(trim($input['lead_orcid']))) {
        return ['status' => 'error', 'message' => 'Lead researcher ORCID is required'];
    }

    // Validate ORCID format
    if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/', $input['lead_orcid'])) {
        return ['status' => 'error', 'message' => 'Invalid ORCID format'];
    }

    try {
        // Verify lead researcher exists
        $checkStmt = $pdo->prepare("SELECT orcid FROM researchers WHERE orcid = ?");
        $checkStmt->execute([$input['lead_orcid']]);
        if (!$checkStmt->fetch()) {
            return ['status' => 'error', 'message' => 'Lead researcher not found in database'];
        }

        // Parse SDG focus
        $sdgFocus = [];
        if (isset($input['sdg_focus'])) {
            if (is_string($input['sdg_focus'])) {
                $sdgFocus = array_filter(array_map('intval', explode(',', $input['sdg_focus'])));
            } elseif (is_array($input['sdg_focus'])) {
                $sdgFocus = array_filter(array_map('intval', $input['sdg_focus']));
            }

            // Validate SDG numbers
            foreach ($sdgFocus as $sdg) {
                if ($sdg < 1 || $sdg > 17) {
                    return ['status' => 'error', 'message' => 'SDG numbers must be between 1 and 17'];
                }
            }
        }

        // Validate budget
        $budget = null;
        if (isset($input['budget'])) {
            $budget = floatval($input['budget']);
            if ($budget < 0) {
                return ['status' => 'error', 'message' => 'Budget cannot be negative'];
            }
        }

        // Validate dates
        if (isset($input['start_date']) && isset($input['end_date'])) {
            if (strtotime($input['start_date']) > strtotime($input['end_date'])) {
                return ['status' => 'error', 'message' => 'Start date cannot be after end date'];
            }
        }

        // Validate progress
        $progress = 0;
        if (isset($input['progress'])) {
            $progress = intval($input['progress']);
            if ($progress < 0 || $progress > 100) {
                return ['status' => 'error', 'message' => 'Progress must be between 0 and 100'];
            }
        }

        // Create project
        $stmt = $pdo->prepare(
            "INSERT INTO research_projects
             (title, description, status, lead_orcid, institution_id, sdg_focus, budget,
              progress, start_date, end_date, visibility)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            trim($input['title']),
            isset($input['description']) ? trim($input['description']) : null,
            isset($input['status']) ? $input['status'] : 'planning',
            $input['lead_orcid'],
            isset($input['institution_id']) ? intval($input['institution_id']) : null,
            json_encode($sdgFocus),
            $budget,
            $progress,
            isset($input['start_date']) ? $input['start_date'] : null,
            isset($input['end_date']) ? $input['end_date'] : null,
            isset($input['visibility']) ? $input['visibility'] : 'public'
        ]);

        $projectId = intval($pdo->lastInsertId());

        // Log action
        logAdminAction($pdo, 'CREATE', 'research_projects', (string)$projectId, null, $input);

        return [
            'status' => 'success',
            'message' => 'Project created successfully',
            'project_id' => $projectId,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log('Create project error: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create project: ' . $e->getMessage()];
    }
}

function updateProject(PDO $pdo): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id']) || empty($input['id'])) {
        return ['status' => 'error', 'message' => 'Project ID is required'];
    }

    $projectId = intval($input['id']);

    try {
        // Verify project exists
        $checkStmt = $pdo->prepare("SELECT * FROM research_projects WHERE id = ?");
        $checkStmt->execute([$projectId]);
        $project = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$project) {
            return ['status' => 'error', 'message' => 'Project not found'];
        }

        $updates = [];
        $params = [];

        // Title
        if (isset($input['title']) && !empty(trim($input['title']))) {
            $updates[] = "title = ?";
            $params[] = trim($input['title']);
        }

        // Description
        if (isset($input['description'])) {
            $updates[] = "description = ?";
            $params[] = trim($input['description']) ?: null;
        }

        // Status
        if (isset($input['status'])) {
            $validStatuses = ['planning', 'active', 'completed', 'paused'];
            if (!in_array($input['status'], $validStatuses)) {
                return ['status' => 'error', 'message' => 'Invalid project status'];
            }
            $updates[] = "status = ?";
            $params[] = $input['status'];
        }

        // Progress
        if (isset($input['progress'])) {
            $progress = intval($input['progress']);
            if ($progress < 0 || $progress > 100) {
                return ['status' => 'error', 'message' => 'Progress must be between 0 and 100'];
            }
            $updates[] = "progress = ?";
            $params[] = $progress;
        }

        // Budget
        if (isset($input['budget'])) {
            $budget = floatval($input['budget']);
            if ($budget < 0) {
                return ['status' => 'error', 'message' => 'Budget cannot be negative'];
            }
            $updates[] = "budget = ?";
            $params[] = $budget;
        }

        // Spent
        if (isset($input['spent'])) {
            $spent = floatval($input['spent']);
            if ($spent < 0) {
                return ['status' => 'error', 'message' => 'Spent amount cannot be negative'];
            }
            $updates[] = "spent = ?";
            $params[] = $spent;
        }

        // SDG Focus
        if (isset($input['sdg_focus'])) {
            $sdgFocus = [];
            if (is_string($input['sdg_focus'])) {
                $sdgFocus = array_filter(array_map('intval', explode(',', $input['sdg_focus'])));
            } elseif (is_array($input['sdg_focus'])) {
                $sdgFocus = array_filter(array_map('intval', $input['sdg_focus']));
            }

            foreach ($sdgFocus as $sdg) {
                if ($sdg < 1 || $sdg > 17) {
                    return ['status' => 'error', 'message' => 'SDG numbers must be between 1 and 17'];
                }
            }

            $updates[] = "sdg_focus = ?";
            $params[] = json_encode($sdgFocus);
        }

        if (empty($updates)) {
            return ['status' => 'error', 'message' => 'No fields to update'];
        }

        $params[] = $projectId;
        $sql = "UPDATE research_projects SET " . implode(', ', $updates) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Log action
        logAdminAction($pdo, 'UPDATE', 'research_projects', (string)$projectId, $project, $input);

        return [
            'status' => 'success',
            'message' => 'Project updated successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log('Update project error: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update project'];
    }
}

function deleteProject(PDO $pdo): array {
    $projectId = isset($_GET['id']) ? intval($_GET['id']) : null;

    if (!$projectId) {
        return ['status' => 'error', 'message' => 'Project ID is required'];
    }

    try {
        // Verify project exists
        $checkStmt = $pdo->prepare("SELECT * FROM research_projects WHERE id = ?");
        $checkStmt->execute([$projectId]);
        $project = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$project) {
            return ['status' => 'error', 'message' => 'Project not found'];
        }

        // Delete project (cascade will handle related records)
        $stmt = $pdo->prepare("DELETE FROM research_projects WHERE id = ?");
        $stmt->execute([$projectId]);

        // Log action
        logAdminAction($pdo, 'DELETE', 'research_projects', (string)$projectId);

        return [
            'status' => 'success',
            'message' => 'Project deleted successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log('Delete project error: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to delete project'];
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
