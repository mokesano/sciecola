<?php
declare(strict_types=1);

/**
 * @file api/admin/users.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api_admin
 * @brief Manajemen akun pengguna untuk admin (menggantikan daftar contoh di Admin.jsx).
 *
 * GET  /api/admin/users.php?search=&page=1&limit=25
 * POST /api/admin/users.php { action: "set_role",   id, role: "user"|"admin" }
 * POST /api/admin/users.php { action: "set_active", id, active: true|false }
 * POST /api/admin/users.php { action: "revoke_sessions", id }
 * POST /api/admin/users.php { action: "delete", id }
 *
 * Admin tidak bisa menurunkan, menonaktifkan, atau menghapus akunnya sendiri.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Auth\AdminGuard;
use Sciecola\Auth\AuthStore;
use Sciecola\Auth\UserAuth;
use Sciecola\Support\AppSettings;

AdminGuard::require();

function users_respond(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $store = AuthStore::get();
    $pdo   = $store->pdo();
    $me    = UserAuth::current();

    if (AdminGuard::method() === 'GET') {
        $search = trim((string) ($_GET['search'] ?? ''));
        $page   = max(1, (int) ($_GET['page'] ?? 1));
        $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 25)));
        $where  = '1=1';
        $params = [];
        if ($search !== '') {
            $where = '(LOWER(u.email) LIKE ? OR LOWER(u.name) LIKE ? OR u.orcid LIKE ?)';
            $like  = '%' . strtolower($search) . '%';
            $params = [$like, $like, '%' . $search . '%'];
        }
        $count = $pdo->prepare("SELECT COUNT(*) FROM user_accounts u WHERE {$where}");
        $count->execute($params);
        $stmt = $pdo->prepare(
            "SELECT u.id, u.email, u.name, u.orcid, u.role, u.is_active, u.email_verified, u.created_at, u.last_login_at,
                    s.totp_enabled, s.orcid_verified
               FROM user_accounts u LEFT JOIN user_security s ON s.user_id = u.id
              WHERE {$where} ORDER BY u.id DESC LIMIT {$limit} OFFSET " . (($page - 1) * $limit)
        );
        $stmt->execute($params);
        $rows = array_map(static fn ($r) => [
            'id'             => (int) $r['id'],
            'email'          => $r['email'],
            'name'           => $r['name'],
            'orcid'          => $r['orcid'],
            'orcid_verified' => (bool) $r['orcid_verified'],
            'role'           => UserAuth::roleOf($r),
            'role_source'    => ($r['role'] === 'admin') ? 'database' : (UserAuth::roleOf($r) === 'admin' ? 'env' : 'database'),
            'active'         => (bool) $r['is_active'],
            'email_verified' => (bool) $r['email_verified'],
            'two_factor'     => (bool) $r['totp_enabled'],
            'created_at'     => $r['created_at'],
            'last_login_at'  => $r['last_login_at'],
            'is_me'          => $me !== null && (int) $me['id'] === (int) $r['id'],
        ], $stmt->fetchAll(PDO::FETCH_ASSOC));
        users_respond(['status' => 'success', 'users' => $rows, 'total' => (int) $count->fetchColumn(), 'page' => $page, 'limit' => $limit]);
    }

    if (AdminGuard::method() !== 'POST') {
        users_respond(['status' => 'error', 'message' => 'Method not allowed'], 405);
    }

    $body   = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $action = (string) ($body['action'] ?? '');
    $id     = (int) ($body['id'] ?? 0);
    $target = $id > 0 ? $store->findUserById($id) : null;
    if (!$target) {
        users_respond(['status' => 'error', 'message' => 'Pengguna tidak ditemukan'], 404);
    }
    $isSelf = $me !== null && (int) $me['id'] === $id;

    switch ($action) {
        case 'set_role':
            $role = ($body['role'] ?? '') === 'admin' ? 'admin' : 'user';
            if ($isSelf && $role !== 'admin') {
                users_respond(['status' => 'error', 'message' => 'Anda tidak bisa menurunkan peran akun sendiri.'], 400);
            }
            $store->updateUser($id, ['role' => $role]);
            AppSettings::audit($me, 'user.set_role', (string) $target['email'], ['role' => $target['role']], ['role' => $role]);
            break;

        case 'set_active':
            $active = !empty($body['active']);
            if ($isSelf && !$active) {
                users_respond(['status' => 'error', 'message' => 'Anda tidak bisa menonaktifkan akun sendiri.'], 400);
            }
            $store->updateUser($id, ['is_active' => $active ? 1 : 0]);
            if (!$active) {
                $store->deleteSessionsForUser($id);
            }
            AppSettings::audit($me, $active ? 'user.activate' : 'user.deactivate', (string) $target['email']);
            break;

        case 'revoke_sessions':
            $store->deleteSessionsForUser($id, $isSelf ? UserAuth::currentSessionId() : null);
            AppSettings::audit($me, 'user.revoke_sessions', (string) $target['email']);
            break;

        case 'delete':
            if ($isSelf) {
                users_respond(['status' => 'error', 'message' => 'Hapus akun sendiri lewat Pengaturan → Akun.'], 400);
            }
            $store->deleteUser($id);
            AppSettings::audit($me, 'user.delete', (string) $target['email']);
            users_respond(['status' => 'success', 'deleted' => $id]);

        default:
            users_respond(['status' => 'error', 'message' => 'Aksi tidak dikenali'], 400);
    }

    users_respond(['status' => 'success']);
} catch (Throwable $e) {
    error_log('[admin/users] ' . $e->getMessage());
    users_respond(['status' => 'error', 'message' => 'Data pengguna belum tersedia.'], 503);
}
