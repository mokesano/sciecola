<?php
/**
 * Admin Notifications API
 * POST /api/admin/notifications (create/send notification)
 * GET /api/admin/notifications?action=list (list all notifications)
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
        echo json_encode(createNotification($adminOrcid, $ipAddress));
    } elseif ($method === 'GET') {
        $limit  = (int)($_GET['limit'] ?? 100);
        $offset = (int)($_GET['offset'] ?? 0);
        if ($limit > 500) $limit = 500;
        if ($limit < 1)   $limit = 1;
        if ($offset < 0)  $offset = 0;
        echo json_encode(listNotifications($limit, $offset));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function createNotification(string $adminOrcid, string $ipAddress): array {
    $input = json_decode(file_get_contents('php://input'), true);

    $requiredError = validateNotificationRequiredFields($input);
    if ($requiredError !== null) {
        return $requiredError;
    }

    $typeError = validateNotificationType($input['type']);
    if ($typeError !== null) {
        return $typeError;
    }

    $recipients = is_array($input['recipient_orcid']) ? $input['recipient_orcid'] : [$input['recipient_orcid']];

    $orcidError = validateOrcidFormats($recipients);
    if ($orcidError !== null) {
        return $orcidError;
    }

    return insertNotifications($adminOrcid, $ipAddress, $input, $recipients);
}

function normalizeNotificationInput(array $input): array {
    return [
        'type'             => $input['type'],
        'category'         => $input['category'] ?? null,
        'title'            => $input['title'],
        'message'          => $input['message'],
        'link'             => $input['link'] ?? null,
        'data'             => isset($input['data']) ? json_encode($input['data']) : null,
        'action_required'  => $input['action_required'] ?? 0,
        'action_deadline'  => $input['action_deadline'] ?? null
    ];
}

function insertNotifications(string $adminOrcid, string $ipAddress, array $input, array $recipients): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'error', 'message' => 'Database not configured'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $norm = normalizeNotificationInput($input);
        $stmt = $pdo->prepare("
            INSERT INTO notifications
            (recipient_orcid, type, category, title, message, link, data, action_required, action_deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($recipients as $orcid) {
            $stmt->execute([
                $orcid,
                $norm['type'],
                $norm['category'],
                $norm['title'],
                $norm['message'],
                $norm['link'],
                $norm['data'],
                $norm['action_required'],
                $norm['action_deadline']
            ]);
        }

        logActivity($adminOrcid, 'CREATE', 'notifications', implode(',', $recipients), null, $input, $ipAddress);

        return [
            'status'     => 'success',
            'message'    => "Notification sent to " . count($recipients) . " recipient(s)",
            'recipients' => count($recipients),
            'timestamp'  => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create notification'];
    }
}

function listNotifications(int $limit, int $offset): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'error', 'message' => 'Database not configured'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $countStmt = $pdo->query("SELECT COUNT(*) as count FROM notifications");
        $total     = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        $stmt = $pdo->prepare("
            SELECT n.*, r.name as recipient_name
            FROM notifications n
            LEFT JOIN researchers r ON r.orcid = n.recipient_orcid
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $notifications = array_map(function ($row) {
            return [
                'id'               => (int)$row['id'],
                'recipient_orcid'  => $row['recipient_orcid'],
                'recipient_name'   => $row['recipient_name'],
                'type'             => $row['type'],
                'category'         => $row['category'],
                'title'            => $row['title'],
                'message'          => substr($row['message'], 0, 150),
                'is_read'          => (bool)$row['is_read'],
                'action_required'  => (bool)$row['action_required'],
                'created_at'       => $row['created_at'],
                'read_at'          => $row['read_at']
            ];
        }, $rows);

        return [
            'status'        => 'success',
            'notifications' => $notifications,
            'total'         => $total,
            'limit'         => $limit,
            'offset'        => $offset,
            'timestamp'     => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to fetch notifications'];
    }
}

function validateNotificationRequiredFields(array $input): ?array {
    $fields = [
        'recipient_orcid' => 'Recipient ORCID required',
        'type'            => 'Notification type required',
        'title'           => 'Title required',
        'message'         => 'Message required'
    ];

    foreach ($fields as $field => $message) {
        if (empty($input[$field])) {
            return ['status' => 'error', 'message' => $message];
        }
    }
    return null;
}

function validateNotificationType(string $type): ?array {
    $validTypes = ['collaboration_request', 'opportunity_match', 'message', 'system', 'achievement', 'announcement'];
    if (!in_array($type, $validTypes)) {
        return ['status' => 'error', 'message' => 'Invalid notification type'];
    }
    return null;
}

function validateOrcidFormats(array $recipients): ?array {
    foreach ($recipients as $orcid) {
        if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/', $orcid)) {
            return ['status' => 'error', 'message' => "Invalid ORCID format: $orcid"];
        }
    }
    return null;
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
