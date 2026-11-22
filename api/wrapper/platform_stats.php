<?php
declare(strict_types=1);

/**
 * @file api/wrapper/platform_stats.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Platform Statistics API.
 *
 * Endpoints:
 * GET /api/platform_stats.php
 * Reads from: publications, researchers, journals, work_sdgs
 *
 * Angka selalu berasal dari database. Bila database tidak bisa dihubungi,
 * endpoint mengembalikan status error (frontend menampilkan "—"), bukan angka contoh.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    echo json_encode([
        'status'      => 'success',
        'data'        => fetchPlatformStats(),
        'data_source' => 'database',
        'timestamp'   => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Statistik platform belum tersedia: ' . $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}

function fetchPlatformStats(): array
{
    if (!defined('DB_HOST') || !DB_HOST) {
        throw new RuntimeException('database belum dikonfigurasi');
    }

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . (defined('DB_PORT') ? DB_PORT : '3306')
            . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
        DB_USERNAME, DB_PASSWORD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $articles    = (int) $pdo->query('SELECT COUNT(*) FROM publications')->fetchColumn();
    // Semua peneliti yang tercatat. cache_expires_at hanya menandai kesegaran
    // profile_cache_json (kapan profil perlu diambil ulang dari ORCID), bukan
    // keberadaan peneliti, jadi tidak dipakai sebagai filter penghitungan.
    $researchers = (int) $pdo->query('SELECT COUNT(*) FROM researchers')->fetchColumn();
    $journals    = (int) $pdo->query('SELECT COUNT(*) FROM journals')->fetchColumn();
    $sdgCount    = (int) $pdo->query('SELECT COUNT(DISTINCT sdg_number) FROM work_sdgs')->fetchColumn();
    $citations   = (int) $pdo->query('SELECT COALESCE(SUM(citation_count), 0) FROM publications')->fetchColumn();

    return [
        ['label' => 'Artikel Terklasifikasi', 'value' => number_format($articles)],
        ['label' => 'Peneliti',               'value' => number_format($researchers)],
        ['label' => 'Jurnal',                 'value' => number_format($journals)],
        ['label' => 'SDGs Terwakili',         'value' => number_format($sdgCount)],
        ['label' => 'Total Sitasi',           'value' => number_format($citations)],
    ];
}
