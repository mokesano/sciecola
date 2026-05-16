<?php
/**
 * Notifications API
 * GET /api/notifications.php?orcid=&unread_only=1&type=&limit=50
 * PUT /api/notifications.php?id=&action=read|delete
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

    if ($method === 'GET') {
        $orcid = trim($_GET['orcid'] ?? '');
        if (!$orcid) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ORCID required']);
            exit;
        }
        echo json_encode(getNotifications($orcid));
    } elseif ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = (int)($input['id'] ?? 0);
        $action = $input['action'] ?? '';

        if (!$id || !$action) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID and action required']);
            exit;
        }

        if ($action === 'read') {
            echo json_encode(markAsRead($id));
        } elseif ($action === 'delete') {
            echo json_encode(deleteNotification($id));
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getNotifications(string $orcid): array {
    $unreadOnly = $_GET['unread_only'] ?? '0';
    $type = trim($_GET['type'] ?? '');
    $limit = (int)($_GET['limit'] ?? 50);

    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleNotifications();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $where = ['recipient_orcid = ?'];
        $params = [$orcid];

        if ($unreadOnly === '1') {
            $where[] = 'is_read = 0';
        }

        if ($type !== '') {
            $where[] = 'type = ?';
            $params[] = $type;
        }

        $whereClause = implode(' AND ', $where);

        $sql = "SELECT id, type, category, title, message, link, data, is_read,
                       action_required, action_deadline, created_at, updated_at
                FROM notifications
                WHERE $whereClause
                ORDER BY created_at DESC
                LIMIT $limit";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $notifications = array_map(function ($row) {
            $data = json_decode($row['data'] ?? '{}', true);
            return [
                'id' => (int)$row['id'],
                'type' => $row['type'],
                'category' => $row['category'],
                'title' => $row['title'],
                'message' => $row['message'],
                'link' => $row['link'],
                'data' => is_array($data) ? $data : [],
                'is_read' => (bool)$row['is_read'],
                'action_required' => (bool)$row['action_required'],
                'action_deadline' => $row['action_deadline'],
                'created_at' => $row['created_at'],
                'time_ago' => getTimeAgo($row['created_at'])
            ];
        }, $rows);

        // Count unread
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) as count FROM notifications
            WHERE recipient_orcid = ? AND is_read = 0
        ");
        $countStmt->execute([$orcid]);
        $unreadCount = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        return [
            'status' => 'success',
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'total' => count($notifications),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleNotifications();
    }
}

function markAsRead(int $id): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'error', 'message' => 'Database not configured'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);

        return ['status' => 'success', 'message' => 'Notification marked as read'];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update notification'];
    }
}

function deleteNotification(int $id): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'error', 'message' => 'Database not configured'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ?");
        $stmt->execute([$id]);

        return ['status' => 'success', 'message' => 'Notification deleted'];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to delete notification'];
    }
}

function getTimeAgo(string $timestamp): string {
    $time = strtotime($timestamp);
    $now = time();
    $diff = $now - $time;

    if ($diff < 60) return 'just now';
    if ($diff < 3600) return ceil($diff / 60) . 'm ago';
    if ($diff < 86400) return ceil($diff / 3600) . 'h ago';
    if ($diff < 604800) return ceil($diff / 86400) . 'd ago';
    return ceil($diff / 604800) . 'w ago';
}

function getSampleNotifications(): array {
    return [
        'status' => 'success',
        'notifications' => [
            [
                'id' => 1,
                'type' => 'collaboration_request',
                'category' => 'Research',
                'title' => 'Collaboration Request from Dr. Sarah Chen',
                'message' => 'Dr. Sarah Chen is interested in collaborating on climate research project',
                'link' => '/#/collaboration-hub',
                'is_read' => false,
                'action_required' => true,
                'action_deadline' => '2024-06-01',
                'created_at' => date('c', time() - 3600),
                'time_ago' => '1h ago'
            ],
            [
                'id' => 2,
                'type' => 'opportunity_match',
                'category' => 'Opportunity',
                'title' => 'New Research Opportunity: Climate Tech Partnership',
                'message' => 'You matched with 96% to a carbon capture research opportunity',
                'link' => '/#/innovation-marketplace',
                'is_read' => false,
                'action_required' => true,
                'action_deadline' => '2024-05-25',
                'created_at' => date('c', time() - 86400),
                'time_ago' => '1d ago'
            ],
            [
                'id' => 3,
                'type' => 'message',
                'category' => 'Message',
                'title' => 'New message from Prof. Ahmed Hassan',
                'message' => 'New message received in your collaboration chat',
                'link' => '/#/messages',
                'is_read' => true,
                'action_required' => false,
                'action_deadline' => null,
                'created_at' => date('c', time() - 172800),
                'time_ago' => '2d ago'
            ]
        ],
        'unread_count' => 2,
        'total' => 3,
        'timestamp' => date('c')
    ];
}
