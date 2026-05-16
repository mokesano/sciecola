<?php
/**
 * Messages API
 * GET /api/messages.php?action=list|get|send
 * POST /api/messages.php
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
        $action = trim($_GET['action'] ?? 'list');
        $conversationId = (int)($_GET['conversation_id'] ?? 0);
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);

        if ($limit > 500) $limit = 500;
        if ($limit < 1) $limit = 1;
        if ($offset < 0) $offset = 0;

        if ($action === 'list' && $conversationId > 0) {
            echo json_encode(getMessages($conversationId, $limit, $offset));
        } elseif ($action === 'conversations') {
            echo json_encode(getConversations($limit, $offset));
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid action or missing parameters']);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = trim($input['action'] ?? '');

        if ($action === 'send') {
            echo json_encode(sendMessage($input));
        } elseif ($action === 'create_conversation') {
            echo json_encode(createConversation($input));
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

function getConversations(int $limit, int $offset): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleConversations();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            SELECT c.id, c.conversation_type, c.name, c.created_by, c.created_at,
                   COUNT(DISTINCT m.id) as message_count,
                   MAX(m.created_at) as last_message_at
            FROM conversations c
            LEFT JOIN messages m ON m.conversation_id = c.id
            WHERE c.is_archived = FALSE
            GROUP BY c.id
            ORDER BY last_message_at DESC NULLS LAST
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM conversations WHERE is_archived = FALSE");
        $countStmt->execute();
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        return [
            'status' => 'success',
            'conversations' => array_map(function ($row) {
                return [
                    'id' => (int)$row['id'],
                    'type' => $row['conversation_type'],
                    'name' => $row['name'],
                    'created_by' => (int)$row['created_by'],
                    'created_at' => $row['created_at'],
                    'message_count' => (int)$row['message_count'],
                    'last_message_at' => $row['last_message_at']
                ];
            }, $conversations),
            'total' => $total,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleConversations();
    }
}

function getMessages(int $conversationId, int $limit, int $offset): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleMessages();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            SELECT m.id, m.conversation_id, m.sender_id, m.message_text, m.message_type,
                   m.file_url, m.status, m.created_at, m.edited_at,
                   u.name as sender_name, u.avatar_url as sender_avatar
            FROM messages m
            LEFT JOIN user_accounts u ON u.id = m.sender_id
            WHERE m.conversation_id = ? AND m.deleted_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$conversationId, $limit, $offset]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND deleted_at IS NULL");
        $countStmt->execute([$conversationId]);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        return [
            'status' => 'success',
            'conversation_id' => $conversationId,
            'messages' => array_map(function ($row) {
                return [
                    'id' => (int)$row['id'],
                    'sender_id' => (int)$row['sender_id'],
                    'sender_name' => $row['sender_name'],
                    'sender_avatar' => $row['sender_avatar'],
                    'message_text' => $row['message_text'],
                    'message_type' => $row['message_type'],
                    'file_url' => $row['file_url'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at'],
                    'edited_at' => $row['edited_at']
                ];
            }, $messages),
            'total' => $total,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleMessages();
    }
}

function sendMessage(array $input): array {
    if (!isset($input['conversation_id'], $input['sender_id'], $input['message_text'])) {
        return ['status' => 'error', 'message' => 'Missing required fields'];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'success', 'message_id' => 1, 'message' => 'Message sent (demo mode)'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            INSERT INTO messages (conversation_id, sender_id, message_text, message_type, status)
            VALUES (?, ?, ?, ?, 'sent')
        ");
        $stmt->execute([
            (int)$input['conversation_id'],
            (int)$input['sender_id'],
            $input['message_text'],
            $input['message_type'] ?? 'text'
        ]);

        return [
            'status' => 'success',
            'message_id' => (int)$pdo->lastInsertId(),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to send message'];
    }
}

function createConversation(array $input): array {
    if (!isset($input['created_by']) || empty($input['participant_ids'])) {
        return ['status' => 'error', 'message' => 'Missing required fields'];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'success', 'conversation_id' => 1];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $pdo->beginTransaction();

        $convType = count($input['participant_ids']) === 1 ? 'direct' : 'group';
        $stmt = $pdo->prepare("
            INSERT INTO conversations (conversation_type, name, created_by)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$convType, $input['name'] ?? null, (int)$input['created_by']]);
        $conversationId = (int)$pdo->lastInsertId();

        $partStmt = $pdo->prepare("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)");
        foreach ($input['participant_ids'] as $userId) {
            $partStmt->execute([$conversationId, (int)$userId]);
        }

        $pdo->commit();

        return [
            'status' => 'success',
            'conversation_id' => $conversationId,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create conversation'];
    }
}

function getSampleConversations(): array {
    return [
        'status' => 'success',
        'conversations' => [
            [
                'id' => 1,
                'type' => 'direct',
                'name' => 'Dr. Budi Santoso',
                'created_by' => 1,
                'created_at' => '2026-05-10T10:30:00Z',
                'message_count' => 5,
                'last_message_at' => '2026-05-16T08:15:00Z'
            ],
            [
                'id' => 2,
                'type' => 'group',
                'name' => 'Tim Riset SDG',
                'created_by' => 1,
                'created_at' => '2026-05-01T14:20:00Z',
                'message_count' => 23,
                'last_message_at' => '2026-05-16T07:45:00Z'
            ]
        ],
        'total' => 2,
        'timestamp' => date('c')
    ];
}

function getSampleMessages(): array {
    return [
        'status' => 'success',
        'conversation_id' => 1,
        'messages' => [
            [
                'id' => 1,
                'sender_id' => 2,
                'sender_name' => 'Dr. Budi Santoso',
                'sender_avatar' => 'https://via.placeholder.com/40/6366f1/ffffff?text=BS',
                'message_text' => 'Bagaimana progress report hari ini?',
                'message_type' => 'text',
                'file_url' => null,
                'status' => 'read',
                'created_at' => '2026-05-16T08:15:00Z',
                'edited_at' => null
            ]
        ],
        'total' => 1,
        'timestamp' => date('c')
    ];
}
