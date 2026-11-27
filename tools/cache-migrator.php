<?php
declare(strict_types=1);

/**
 * @file tools/cache-migrator.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup tools
 * @brief Migrasi file cache ke database dari baris perintah (cadangan halaman admin).
 *
 * Jalur utama: Admin → Cache & DB (/api/cache_migration.php).
 * Alat ini memakai logika yang sama (src/Cache/CacheMigrator.php) dan menulis ke tabel
 * unified schema: researchers, journals, publications, publication_authors, work_sdgs,
 * dengan jejak di cache_migration_log.
 *
 * Folder tools/ berada di luar public/, jadi hanya bisa dijalankan lewat terminal
 * atau Cron Job cPanel:
 *
 *   php tools/cache-migrator.php status
 *   php tools/cache-migrator.php migrate [--retry-failed] [--limit=50]
 *   php tools/cache-migrator.php archive
 *
 * Contoh Cron Job cPanel (tiap 10 menit):
 *   /usr/local/bin/php /home/USER/sdgs-mapper/tools/cache-migrator.php migrate
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Jalankan dari CLI, atau gunakan halaman Admin → Cache & DB.']);
    exit;
}

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__));
}
require_once ROOT_PATH . '/config/config.php';
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Cache\CacheMigrator;

$args   = $argv ?? [];
$action = $args[1] ?? 'status';
$retry  = in_array('--retry-failed', $args, true);
$limit  = 50;
foreach ($args as $a) {
    if (preg_match('/^--limit=(\d+)$/', $a, $m)) {
        $limit = max(1, min(500, (int) $m[1]));
    }
}

try {
    $driver = defined('DB_DRIVER') ? DB_DRIVER : 'mysql';
    $dsn = $driver === 'pgsql'
        ? sprintf('pgsql:host=%s;port=%s;dbname=%s', DB_HOST, DB_PORT, DB_DATABASE)
        : sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_DATABASE);
    $pdo = new PDO($dsn, DB_USERNAME, DB_PASSWORD, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $migrator = new CacheMigrator($pdo, ROOT_PATH . '/cache');
    $migrator->ensureLogTable();

    switch ($action) {
        case 'status':
            echo json_encode(['database' => DB_DATABASE] + $migrator->status(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
            break;

        case 'migrate':
            $failedTotal = 0;
            do {
                $r = $migrator->migrateBatch($limit, $retry, 60.0);
                printf(
                    "[%s] %d diproses (termigrasi %d, dilewati %d, gagal %d) — sisa %d\n",
                    date('H:i:s'), $r['processed'], $r['totals']['migrated'], $r['totals']['skipped'], $r['totals']['failed'], $r['remaining']
                );
                foreach ($r['results'] as $item) {
                    if ($item['status'] === 'failed') {
                        echo "  GAGAL {$item['file']}: {$item['message']}\n";
                    }
                }
                $failedTotal += $r['totals']['failed'];
                $retry = false; // file gagal hanya dicoba ulang sekali per perintah
            } while (!$r['done'] && $r['processed'] > 0);
            exit($failedTotal > 0 ? 2 : 0);

        case 'archive':
            echo json_encode($migrator->archiveMigrated(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
            break;

        default:
            fwrite(STDERR, "Aksi tidak dikenal: {$action}. Gunakan: status | migrate [--retry-failed] [--limit=N] | archive\n");
            exit(1);
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
