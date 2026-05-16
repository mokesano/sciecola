<?php
/**
 * Admin API: Innovation Opportunities Management
 * POST /api/admin/opportunities.php (create)
 * PUT /api/admin/opportunities.php (update)
 * DELETE /api/admin/opportunities.php?id=... (delete)
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
            echo json_encode(createOpportunity($pdo));
            break;
        case 'PUT':
            echo json_encode(updateOpportunity($pdo));
            break;
        case 'DELETE':
            echo json_encode(deleteOpportunity($pdo));
            break;
        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Admin Opportunities API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error']);
}

function createOpportunity(PDO $pdo): array {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($input['title']) || empty(trim($input['title']))) {
        return ['status' => 'error', 'message' => 'Opportunity title is required'];
    }

    if (!isset($input['description']) || empty(trim($input['description']))) {
        return ['status' => 'error', 'message' => 'Description is required'];
    }

    if (!isset($input['category_id']) || empty($input['category_id'])) {
        return ['status' => 'error', 'message' => 'Category ID is required'];
    }

    if (!isset($input['organization_id']) || empty($input['organization_id'])) {
        return ['status' => 'error', 'message' => 'Organization ID is required'];
    }

    try {
        // Verify category exists
        $catStmt = $pdo->prepare("SELECT id FROM innovation_categories WHERE id = ?");
        $catStmt->execute([intval($input['category_id'])]);
        if (!$catStmt->fetch()) {
            return ['status' => 'error', 'message' => 'Category not found'];
        }

        // Verify organization exists
        $orgStmt = $pdo->prepare("SELECT id FROM organizations WHERE id = ?");
        $orgStmt->execute([intval($input['organization_id'])]);
        if (!$orgStmt->fetch()) {
            return ['status' => 'error', 'message' => 'Organization not found'];
        }

        // Parse and validate SDG alignment
        $sdgAlignment = [];
        if (isset($input['sdg_alignment'])) {
            if (is_string($input['sdg_alignment'])) {
                $sdgAlignment = array_filter(array_map('intval', explode(',', $input['sdg_alignment'])));
            } elseif (is_array($input['sdg_alignment'])) {
                $sdgAlignment = array_filter(array_map('intval', $input['sdg_alignment']));
            }

            foreach ($sdgAlignment as $sdg) {
                if ($sdg < 1 || $sdg > 17) {
                    return ['status' => 'error', 'message' => 'SDG numbers must be between 1 and 17'];
                }
            }
        }

        // Validate deadline if provided
        if (isset($input['deadline']) && !empty($input['deadline'])) {
            if (strtotime($input['deadline']) === false) {
                return ['status' => 'error', 'message' => 'Invalid deadline date format'];
            }
        }

        // Create opportunity
        $stmt = $pdo->prepare(
            "INSERT INTO innovation_opportunities
             (title, description, category_id, organization_id, status, deadline,
              sdg_alignment, budget_range, required_skills, posted_by_orcid)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            trim($input['title']),
            trim($input['description']),
            intval($input['category_id']),
            intval($input['organization_id']),
            isset($input['status']) ? $input['status'] : 'open',
            isset($input['deadline']) ? $input['deadline'] : null,
            json_encode($sdgAlignment),
            isset($input['budget_range']) ? trim($input['budget_range']) : null,
            isset($input['required_skills']) ? json_encode($input['required_skills']) : null,
            isset($input['posted_by_orcid']) ? $input['posted_by_orcid'] : null
        ]);

        $opportunityId = intval($pdo->lastInsertId());

        // Log action
        logAdminAction($pdo, 'CREATE', 'innovation_opportunities', (string)$opportunityId, null, $input);

        return [
            'status' => 'success',
            'message' => 'Opportunity created successfully',
            'opportunity_id' => $opportunityId,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log('Create opportunity error: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create opportunity'];
    }
}

function updateOpportunity(PDO $pdo): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id']) || empty($input['id'])) {
        return ['status' => 'error', 'message' => 'Opportunity ID is required'];
    }

    $opportunityId = intval($input['id']);

    try {
        // Verify opportunity exists
        $checkStmt = $pdo->prepare("SELECT * FROM innovation_opportunities WHERE id = ?");
        $checkStmt->execute([$opportunityId]);
        $opportunity = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$opportunity) {
            return ['status' => 'error', 'message' => 'Opportunity not found'];
        }

        $updates = [];
        $params = [];

        // Title
        if (isset($input['title']) && !empty(trim($input['title']))) {
            $updates[] = "title = ?";
            $params[] = trim($input['title']);
        }

        // Description
        if (isset($input['description']) && !empty(trim($input['description']))) {
            $updates[] = "description = ?";
            $params[] = trim($input['description']);
        }

        // Status
        if (isset($input['status'])) {
            $validStatuses = ['open', 'in-progress', 'completed', 'closed'];
            if (!in_array($input['status'], $validStatuses)) {
                return ['status' => 'error', 'message' => 'Invalid opportunity status'];
            }
            $updates[] = "status = ?";
            $params[] = $input['status'];
        }

        // Deadline
        if (isset($input['deadline'])) {
            if (!empty($input['deadline']) && strtotime($input['deadline']) === false) {
                return ['status' => 'error', 'message' => 'Invalid deadline date format'];
            }
            $updates[] = "deadline = ?";
            $params[] = !empty($input['deadline']) ? $input['deadline'] : null;
        }

        // Budget Range
        if (isset($input['budget_range'])) {
            $updates[] = "budget_range = ?";
            $params[] = trim($input['budget_range']) ?: null;
        }

        // SDG Alignment
        if (isset($input['sdg_alignment'])) {
            $sdgAlignment = [];
            if (is_string($input['sdg_alignment'])) {
                $sdgAlignment = array_filter(array_map('intval', explode(',', $input['sdg_alignment'])));
            } elseif (is_array($input['sdg_alignment'])) {
                $sdgAlignment = array_filter(array_map('intval', $input['sdg_alignment']));
            }

            foreach ($sdgAlignment as $sdg) {
                if ($sdg < 1 || $sdg > 17) {
                    return ['status' => 'error', 'message' => 'SDG numbers must be between 1 and 17'];
                }
            }

            $updates[] = "sdg_alignment = ?";
            $params[] = json_encode($sdgAlignment);
        }

        if (empty($updates)) {
            return ['status' => 'error', 'message' => 'No fields to update'];
        }

        $params[] = $opportunityId;
        $sql = "UPDATE innovation_opportunities SET " . implode(', ', $updates) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Log action
        logAdminAction($pdo, 'UPDATE', 'innovation_opportunities', (string)$opportunityId, $opportunity, $input);

        return [
            'status' => 'success',
            'message' => 'Opportunity updated successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log('Update opportunity error: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update opportunity'];
    }
}

function deleteOpportunity(PDO $pdo): array {
    $opportunityId = isset($_GET['id']) ? intval($_GET['id']) : null;

    if (!$opportunityId) {
        return ['status' => 'error', 'message' => 'Opportunity ID is required'];
    }

    try {
        // Verify opportunity exists
        $checkStmt = $pdo->prepare("SELECT * FROM innovation_opportunities WHERE id = ?");
        $checkStmt->execute([$opportunityId]);
        $opportunity = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$opportunity) {
            return ['status' => 'error', 'message' => 'Opportunity not found'];
        }

        // Delete opportunity
        $stmt = $pdo->prepare("DELETE FROM innovation_opportunities WHERE id = ?");
        $stmt->execute([$opportunityId]);

        // Log action
        logAdminAction($pdo, 'DELETE', 'innovation_opportunities', (string)$opportunityId);

        return [
            'status' => 'success',
            'message' => 'Opportunity deleted successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log('Delete opportunity error: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to delete opportunity'];
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
