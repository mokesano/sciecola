<?php
declare(strict_types=1);

/**
 * @file api/wrapper/cache_migration.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Endpoint halaman Admin → Cache & DB: migrasi cache file ke database.
 *
 * Dipanggil lewat front controller: /api/cache_migration.php → api/wrapper/cache_migration.php
 *
 *   GET  /api/cache_migration.php?action=status
 *   POST /api/cache_migration.php  { "action": "migrate", "limit": 25, "retry_failed": false }
 *   POST /api/cache_migration.php  { "action": "archive" }
 *
 * Wajib header  X-Admin-Token: <ADMIN_TOOL_TOKEN dari .env>
 * Tanpa ADMIN_TOOL_TOKEN di .env, endpoint menolak semua permintaan (fail closed).
 *
 * Format respons selalu:
 *   { "status": "success"|"error", "message": "...", ...data }
 */

// Tangkap semua output liar (warning/notice) agar respons tetap JSON murni.
ob_start();

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__, 2));
}
if (!defined('DB_DATABASE')) {
    require_once ROOT_PATH . '/config/config.php';
}
if (!class_exists(\Sciecola\Cache\CacheMigrator::class)) {
    require_once ROOT_PATH . '/includes/autoload.php';
}

use Sciecola\Cache\CacheMigrator;

function cm_respond(array $payload, int $code = 200): void
{
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ── Autentikasi admin (server-side) ──────────────────────────────────────────
$expected = (string) (getenv('ADMIN_TOOL_TOKEN') ?: ($_ENV['ADMIN_TOOL_TOKEN'] ?? ''));
if ($expected === '') {
    cm_respond([
        'status'  => 'error',
        'code'    => 'TOKEN_NOT_CONFIGURED',
        'message' => 'ADMIN_TOOL_TOKEN belum diatur di file .env server. Migrasi dinonaktifkan demi keamanan.',
    ], 503);
}
$given = (string) ($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
if ($given === '' || !hash_equals($expected, $given)) {
    cm_respond(['status' => 'error', 'code' => 'UNAUTHORIZED', 'message' => 'Token admin tidak valid.'], 401);
}

// ── Input ────────────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body   = [];
if ($method === 'POST') {
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = $_POST;
    }
}
$action = (string) ($body['action'] ?? $_GET['action'] ?? 'status');

if (in_array($action, ['migrate', 'archive'], true) && $method !== 'POST') {
    cm_respond(['status' => 'error', 'message' => "Aksi '{$action}' harus memakai POST."], 405);
}

// ── Koneksi database ─────────────────────────────────────────────────────────
try {
    $driver = defined('DB_DRIVER') ? DB_DRIVER : 'mysql';
    $dsn = $driver === 'pgsql'
        ? sprintf('pgsql:host=%s;port=%s;dbname=%s', DB_HOST, DB_PORT, DB_DATABASE)
        : sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_DATABASE);
    $pdo = new PDO($dsn, DB_USERNAME, DB_PASSWORD, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    cm_respond([
        'status'       => $action === 'status' ? 'success' : 'error',
        'db_available' => false,
        'database'     => DB_DATABASE,
        'message'      => 'Tidak bisa terhubung ke database ' . DB_DATABASE . ': ' . $e->getMessage(),
    ], $action === 'status' ? 200 : 503);
}

// ── Aksi ─────────────────────────────────────────────────────────────────────
try {
    $migrator = new CacheMigrator($pdo, ROOT_PATH . '/cache');
    $migrator->ensureLogTable();

    switch ($action) {
        case 'status':
            cm_respond(['status' => 'success', 'db_available' => true, 'database' => DB_DATABASE] + $migrator->status());

        case 'migrate':
            @set_time_limit(90);
            $limit  = max(1, min(100, (int) ($body['limit'] ?? 25)));
            $retry  = filter_var($body['retry_failed'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $result = $migrator->migrateBatch($limit, $retry, 20.0);
            cm_respond([
                'status'  => 'success',
                'message' => sprintf(
                    '%d file diproses: %d termigrasi, %d dilewati, %d gagal. Sisa %d.',
                    $result['processed'],
                    $result['totals']['migrated'],
                    $result['totals']['skipped'],
                    $result['totals']['failed'],
                    $result['remaining']
                ),
            ] + $result);

        case 'archive':
            $result = $migrator->archiveMigrated();
            $ok = empty($result['errors']);
            cm_respond([
                'status'  => $ok ? 'success' : 'error',
                'message' => $result['moved'] > 0
                    ? "{$result['moved']} file dipindahkan ke {$result['archive_path']}."
                    : 'Tidak ada file termigrasi yang perlu diarsipkan.',
            ] + $result, $ok ? 200 : 500);

        default:
            cm_respond(['status' => 'error', 'message' => "Aksi tidak dikenal: {$action}"], 400);
    }
} catch (Throwable $e) {
    cm_respond(['status' => 'error', 'message' => $e->getMessage()], 500);
}
