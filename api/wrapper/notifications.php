<?php
declare(strict_types=1);

/**
 * @file api/wrapper/notifications.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Notifikasi milik akun yang login (tabel user_notifications).
 *
 * GET  /api/notifications.php?filter=all|unread|message|comment|like|collaboration&limit=50
 *      -> { status, notifications:[...], unread_count, total }
 * GET  /api/notifications.php?count=1            -> { status, unread_count }
 * POST /api/notifications.php { action: read|unread|delete, id }
 * POST /api/notifications.php { action: read_all | clear_all }
 * (PUT dengan body yang sama tetap diterima untuk kompatibilitas.)
 *
 * Tidak ada data contoh: bila belum ada notifikasi, daftarnya kosong.
 */

use Sciecola\Auth\UserAuth;
use Sciecola\Community\Notifications;
use Sciecola\Database\Db;

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

function nt_respond(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function nt_iso(?string $utc): ?string
{
    return $utc ? str_replace(' ', 'T', substr($utc, 0, 19)) . 'Z' : null;
}

const NT_FILTER_TYPES = ['message', 'comment', 'like', 'collaboration', 'system'];

try {
    $user = UserAuth::requireUser();
    $uid  = (int) $user['id'];
    try {
        $pdo = Db::pdo();
    } catch (\Throwable $e) {
        $pdo = null;
    }
    if (!$pdo) {
        nt_respond(['status' => 'error', 'message' => 'Database tidak dapat dihubungi', 'notifications' => [], 'unread_count' => 0], 503);
    }
    Notifications::ensure($pdo);

    $unread = function () use ($pdo, $uid): int {
        $st = $pdo->prepare('SELECT COUNT(*) FROM user_notifications WHERE user_id = ? AND is_read = 0');
        $st->execute([$uid]);
        return (int) $st->fetchColumn();
    };

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (!empty($_GET['count'])) {
            nt_respond(['status' => 'success', 'unread_count' => $unread()]);
        }
        $filter = (string) ($_GET['filter'] ?? ((($_GET['unread_only'] ?? '') === '1') ? 'unread' : 'all'));
        $limit  = max(1, min(200, (int) ($_GET['limit'] ?? 50)));

        $where  = ['n.user_id = ?'];
        $params = [$uid];
        if ($filter === 'unread') {
            $where[] = 'n.is_read = 0';
        } elseif (in_array($filter, NT_FILTER_TYPES, true)) {
            $where[] = 'n.type = ?';
            $params[] = $filter;
        }
        $st = $pdo->prepare(
            'SELECT n.id, n.type, n.title, n.message, n.link, n.is_read, n.created_at, u.name AS actor_name
               FROM user_notifications n
               LEFT JOIN user_accounts u ON u.id = n.actor_user_id
              WHERE ' . implode(' AND ', $where) . '
              ORDER BY n.created_at DESC, n.id DESC
              LIMIT ' . $limit
        );
        $st->execute($params);
        $items = array_map(static fn (array $r) => [
            'id'         => (int) $r['id'],
            'type'       => $r['type'],
            'title'      => $r['title'],
            'message'    => $r['message'],
            'link'       => $r['link'],
            'is_read'    => (bool) $r['is_read'],
            'actor_name' => $r['actor_name'],
            'created_at' => nt_iso($r['created_at']),
        ], $st->fetchAll(PDO::FETCH_ASSOC));

        nt_respond([
            'status'        => 'success',
            'notifications' => $items,
            'unread_count'  => $unread(),
            'total'         => count($items),
        ]);
    }

    if ($method !== 'POST' && $method !== 'PUT') {
        nt_respond(['status' => 'error', 'message' => 'Method not allowed'], 405);
    }

    $input  = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $action = (string) ($input['action'] ?? '');
    $id     = (int) ($input['id'] ?? 0);
    $now    = gmdate('Y-m-d H:i:s');

    switch ($action) {
        case 'clear_all':
            $pdo->prepare('DELETE FROM user_notifications WHERE user_id = ?')->execute([$uid]);
            nt_respond(['status' => 'success', 'unread_count' => 0]);

        case 'read_all':
            $pdo->prepare('UPDATE user_notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0')->execute([$now, $uid]);
            nt_respond(['status' => 'success', 'unread_count' => 0]);

        case 'read':
        case 'unread':
        case 'delete':
            if ($id <= 0) nt_respond(['status' => 'error', 'message' => 'ID notifikasi diperlukan'], 400);
            $own = $pdo->prepare('SELECT 1 FROM user_notifications WHERE id = ? AND user_id = ?');
            $own->execute([$id, $uid]);
            if (!$own->fetchColumn()) nt_respond(['status' => 'error', 'message' => 'Notifikasi tidak ditemukan'], 404);
            if ($action === 'delete') {
                $pdo->prepare('DELETE FROM user_notifications WHERE id = ? AND user_id = ?')->execute([$id, $uid]);
            } else {
                $pdo->prepare('UPDATE user_notifications SET is_read = ?, read_at = ? WHERE id = ? AND user_id = ?')
                    ->execute([$action === 'read' ? 1 : 0, $action === 'read' ? $now : null, $id, $uid]);
            }
            nt_respond(['status' => 'success', 'unread_count' => $unread()]);

        default:
            nt_respond(['status' => 'error', 'message' => 'Aksi tidak dikenal'], 400);
    }
} catch (\Throwable $e) {
    error_log('[notifications] ' . $e->getMessage());
    nt_respond(['status' => 'error', 'message' => 'Gagal memproses notifikasi'], 500);
}
