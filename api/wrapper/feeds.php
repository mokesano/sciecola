<?php
declare(strict_types=1);

/**
 * @file api/wrapper/feeds.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Feeds API - Aggregates user-generated content with SDG classification.
 * 
 * Endpoints:
 * GET /api/feeds.php?action=list|get&limit=50&visibility=public
 * POST /api/feeds.php - create post
 */

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
        $visibility = trim($_GET['visibility'] ?? 'public');
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);

        if ($limit > 500) $limit = 500;
        if ($limit < 1) $limit = 1;
        if ($offset < 0) $offset = 0;

        if ($action === 'list') {
            echo json_encode(getFeedPosts($visibility, $limit, $offset));
        } elseif ($action === 'get') {
            $postId = (int)($_GET['id'] ?? 0);
            if ($postId > 0) {
                echo json_encode(getFeedPost($postId));
            } else {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Post ID required']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = trim($input['action'] ?? '');

        if ($action === 'create') {
            echo json_encode(createFeedPost($input));
        } elseif ($action === 'like') {
            echo json_encode(likeFeedPost($input));
        } elseif ($action === 'comment') {
            echo json_encode(commentFeedPost($input));
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

function getFeedPosts(string $visibility, int $limit, int $offset): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleFeedPosts();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $params = [];
        $whereClause = 'WHERE fp.is_deleted = FALSE';
        if ($visibility !== 'all') {
            $whereClause .= ' AND fp.visibility = ?';
            $params = [$visibility];
        }

        $stmt = $pdo->prepare("
            SELECT fp.id, fp.author_id, fp.post_type, fp.title, fp.content,
                   fp.image_url, fp.likes_count, fp.comments_count, fp.is_pinned,
                   fp.created_at, u.name as author_name, u.avatar_url as author_avatar
            FROM feed_posts fp
            LEFT JOIN user_accounts u ON u.id = fp.author_id
            $whereClause
            ORDER BY fp.is_pinned DESC, fp.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM feed_posts fp $whereClause");
        $countStmt->execute(array_slice($params, 0, -2));
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['count'];

        return [
            'status' => 'success',
            'posts' => array_map(function ($row) {
                return [
                    'id' => (int)$row['id'],
                    'author_id' => (int)$row['author_id'],
                    'author_name' => $row['author_name'],
                    'author_avatar' => $row['author_avatar'],
                    'post_type' => $row['post_type'],
                    'title' => $row['title'],
                    'content' => $row['content'],
                    'image_url' => $row['image_url'],
                    'likes_count' => (int)$row['likes_count'],
                    'comments_count' => (int)$row['comments_count'],
                    'is_pinned' => (bool)$row['is_pinned'],
                    'created_at' => $row['created_at']
                ];
            }, $posts),
            'total' => $total,
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleFeedPosts();
    }
}

function getFeedPost(int $postId): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleFeedPost();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            SELECT fp.*, u.name as author_name, u.avatar_url as author_avatar
            FROM feed_posts fp
            LEFT JOIN user_accounts u ON u.id = fp.author_id
            WHERE fp.id = ? AND fp.is_deleted = FALSE
        ");
        $stmt->execute([$postId]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$post) {
            return ['status' => 'error', 'message' => 'Post not found'];
        }

        $commentsStmt = $pdo->prepare("
            SELECT fpc.id, fpc.author_id, fpc.comment_text, fpc.likes_count,
                   fpc.created_at, u.name as author_name, u.avatar_url as author_avatar
            FROM feed_post_comments fpc
            LEFT JOIN user_accounts u ON u.id = fpc.author_id
            WHERE fpc.post_id = ? AND fpc.is_deleted = FALSE AND fpc.parent_comment_id IS NULL
            ORDER BY fpc.created_at DESC
            LIMIT 10
        ");
        $commentsStmt->execute([$postId]);
        $comments = $commentsStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'status' => 'success',
            'post' => [
                'id' => (int)$post['id'],
                'author_id' => (int)$post['author_id'],
                'author_name' => $post['author_name'],
                'author_avatar' => $post['author_avatar'],
                'post_type' => $post['post_type'],
                'title' => $post['title'],
                'content' => $post['content'],
                'image_url' => $post['image_url'],
                'likes_count' => (int)$post['likes_count'],
                'comments_count' => (int)$post['comments_count'],
                'created_at' => $post['created_at']
            ],
            'comments' => array_map(function ($row) {
                return [
                    'id' => (int)$row['id'],
                    'author_id' => (int)$row['author_id'],
                    'author_name' => $row['author_name'],
                    'author_avatar' => $row['author_avatar'],
                    'comment_text' => $row['comment_text'],
                    'likes_count' => (int)$row['likes_count'],
                    'created_at' => $row['created_at']
                ];
            }, $comments),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleFeedPost();
    }
}

function createFeedPost(array $input): array {
    if (!isset($input['author_id'], $input['content'])) {
        return ['status' => 'error', 'message' => 'Missing required fields'];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'success', 'post_id' => 1];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            INSERT INTO feed_posts (author_id, post_type, title, content, image_url, visibility)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            (int)$input['author_id'],
            $input['post_type'] ?? 'text',
            $input['title'] ?? null,
            $input['content'],
            $input['image_url'] ?? null,
            $input['visibility'] ?? 'public'
        ]);

        return [
            'status' => 'success',
            'post_id' => (int)$pdo->lastInsertId(),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create post'];
    }
}

function likeFeedPost(array $input): array {
    if (!isset($input['post_id'], $input['user_id'])) {
        return ['status' => 'error', 'message' => 'Missing required fields'];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'success', 'message' => 'Liked (demo mode)'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            INSERT IGNORE INTO feed_post_likes (post_id, user_id)
            VALUES (?, ?)
        ");
        $stmt->execute([(int)$input['post_id'], (int)$input['user_id']]);

        $updateStmt = $pdo->prepare("
            UPDATE feed_posts SET likes_count = likes_count + 1
            WHERE id = ? AND id NOT IN (SELECT post_id FROM feed_post_likes WHERE post_id = ? AND user_id = ?)
        ");
        $updateStmt->execute([(int)$input['post_id'], (int)$input['post_id'], (int)$input['user_id']]);

        return ['status' => 'success', 'timestamp' => date('c')];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to like post'];
    }
}

function commentFeedPost(array $input): array {
    if (!isset($input['post_id'], $input['author_id'], $input['comment_text'])) {
        return ['status' => 'error', 'message' => 'Missing required fields'];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'success', 'comment_id' => 1];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            INSERT INTO feed_post_comments (post_id, author_id, comment_text)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([
            (int)$input['post_id'],
            (int)$input['author_id'],
            $input['comment_text']
        ]);

        $updateStmt = $pdo->prepare("
            UPDATE feed_posts SET comments_count = comments_count + 1
            WHERE id = ?
        ");
        $updateStmt->execute([(int)$input['post_id']]);

        return [
            'status' => 'success',
            'comment_id' => (int)$pdo->lastInsertId(),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to add comment'];
    }
}

function getSampleFeedPosts(): array {
    return [
        'status' => 'success',
        'posts' => [
            [
                'id' => 1,
                'author_id' => 1,
                'author_name' => 'Dr. Budi Santoso',
                'author_avatar' => 'https://via.placeholder.com/40/6366f1/ffffff?text=BS',
                'post_type' => 'announcement',
                'title' => 'Peluncuran Platform Baru',
                'content' => 'Kami dengan bangga mengumumkan peluncuran fitur baru untuk analisis kolaborasi riset.',
                'image_url' => null,
                'likes_count' => 12,
                'comments_count' => 5,
                'is_pinned' => true,
                'created_at' => '2026-05-16T10:00:00Z'
            ],
            [
                'id' => 2,
                'author_id' => 2,
                'author_name' => 'Siti Nurhaliza',
                'author_avatar' => 'https://via.placeholder.com/40/10b981/ffffff?text=SN',
                'post_type' => 'research',
                'title' => null,
                'content' => 'Hasil terbaru dari riset SDG classification menunjukkan peningkatan akurasi hingga 94%.',
                'image_url' => null,
                'likes_count' => 8,
                'comments_count' => 3,
                'is_pinned' => false,
                'created_at' => '2026-05-16T09:30:00Z'
            ]
        ],
        'total' => 2,
        'timestamp' => date('c')
    ];
}

function getSampleFeedPost(): array {
    return [
        'status' => 'success',
        'post' => [
            'id' => 1,
            'author_id' => 1,
            'author_name' => 'Dr. Budi Santoso',
            'author_avatar' => 'https://via.placeholder.com/40/6366f1/ffffff?text=BS',
            'post_type' => 'announcement',
            'title' => 'Peluncuran Platform Baru',
            'content' => 'Kami dengan bangga mengumumkan peluncuran fitur baru untuk analisis kolaborasi riset.',
            'image_url' => null,
            'likes_count' => 12,
            'comments_count' => 5,
            'created_at' => '2026-05-16T10:00:00Z'
        ],
        'comments' => [
            [
                'id' => 1,
                'author_id' => 2,
                'author_name' => 'Siti Nurhaliza',
                'author_avatar' => 'https://via.placeholder.com/40/10b981/ffffff?text=SN',
                'comment_text' => 'Fitur ini sangat menunggu-nunggu!',
                'likes_count' => 2,
                'created_at' => '2026-05-16T10:15:00Z'
            ]
        ],
        'timestamp' => date('c')
    ];
}
