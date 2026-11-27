<?php
declare(strict_types=1);

/**
 * @file public/guard.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @brief Penerima permintaan yang ditolak / tidak ditemukan oleh .htaccess.
 *
 * .htaccess meneruskan ke sini (guard.php?r=alasan) alih-alih langsung menjawab 403/404,
 * agar percobaan akses mencurigakan tercatat di security_events dan tampil di
 * Admin → Monitoring. Lihat src/Middleware/AccessLogger.php.
 */

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__));
}
ini_set('display_errors', '0');
ini_set('error_log', ROOT_PATH . '/error_log');

// Hanya diproses bila datang dari aturan .htaccess / ErrorDocument (permintaan internal).
// Membuka /guard.php langsung tidak mencatat apa pun.
$internal = isset($_SERVER['REDIRECT_URL']) || isset($_SERVER['REDIRECT_STATUS']);
$path     = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
if (!$internal || $path === '/guard.php') {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not Found';
    exit;
}

require_once ROOT_PATH . '/includes/autoload.php';
foreach ([ROOT_PATH . '/includes/config.php', ROOT_PATH . '/config/config.php'] as $cfg) {
    if (is_file($cfg)) {
        require_once $cfg;
    }
}

\Sciecola\Middleware\AccessLogger::handleGuard((string) ($_GET['r'] ?? 'forbidden'));
