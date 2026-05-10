<?php
/**
 * Entry point – https://sciecola.sangia.org
 * Letak file: /home/user/public_html/sciecola/public/index.php
 *
 * Tugasnya SATU: teruskan SEMUA request ke wizdam-sikola.php
 * yang berada satu level di atasnya (di luar public/).
 *
 * wizdam-sikola.php sudah cerdas:
 *   - Jika ada ?proxy_action= → balas JSON (mode proxy)
 *   - Jika tidak → tampilkan halaman HTML
 *
 * Tidak perlu kondisi REQUEST_URI apapun di sini.
 */

// Aktifkan saat debugging, nonaktifkan di production:
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

// Arahkan error_log ke luar folder public/
ini_set('error_log', dirname(__DIR__) . '/error_log');

// Definisikan ROOT_PATH sebelum digunakan
if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__));
}

$bootstrapFile = ROOT_PATH . '/includes/bootstrap.php';

if (file_exists($bootstrapFile)) {
    require $bootstrapFile;
} else {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>503 – Service Unavailable</h1>';
    echo '<p>File aplikasi tidak ditemukan.</p>';
    echo '<small style="color:#999">Path: ' . htmlspecialchars($bootstrapFile) . '</small>';
}