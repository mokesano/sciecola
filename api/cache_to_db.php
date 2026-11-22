<?php
declare(strict_types=1);

/**
 * @file api/cache_to_db.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Cadangan baris perintah untuk migrasi cache (jalur utama: Admin → Cache & DB).
 *
 * Memakai logika yang sama dengan halaman admin (src/Cache/CacheMigrator.php).
 * Hanya bisa dijalankan dari terminal / cron cPanel, tidak dari browser:
 *
 *   php api/cache_to_db.php status
 *   php api/cache_to_db.php migrate [--retry-failed]
 *   php api/cache_to_db.php archive
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Gunakan halaman Admin → Cache & DB, atau jalankan dari CLI.']);
    exit;
}

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__));
}
require_once ROOT_PATH . '/config/config.php';
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Cache\CacheMigrator;

$action = $argv[1] ?? 'status';
$retry  = in_array('--retry-failed', $argv, true);

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
            echo json_encode($migrator->status(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
            break;

        case 'migrate':
            do {
                $r = $migrator->migrateBatch(50, $retry, 60.0);
                printf(
                    "%d diproses (migrated %d, skipped %d, failed %d) — sisa %d\n",
                    $r['processed'], $r['totals']['migrated'], $r['totals']['skipped'], $r['totals']['failed'], $r['remaining']
                );
                foreach ($r['results'] as $item) {
                    if ($item['status'] === 'failed') {
                        echo "  GAGAL {$item['file']}: {$item['message']}\n";
                    }
                }
                $retry = false; // file gagal hanya dicoba ulang sekali per perintah
            } while (!$r['done'] && $r['processed'] > 0);
            break;

        case 'archive':
            echo json_encode($migrator->archiveMigrated(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
            break;

        default:
            fwrite(STDERR, "Aksi tidak dikenal: {$action}. Gunakan status | migrate | archive\n");
            exit(1);
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
