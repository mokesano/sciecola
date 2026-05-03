<?php
/**
 * Entry point – https://wizdam.sangia.org
 * Letak file: /home/user/public_html/wizdam/public/index.php
 *
 * Tugasnya SATU: teruskan SEMUA request ke wizdam-AI-sikola.php
 * yang berada satu level di atasnya (di luar public/).
 *
 * wizdam-AI-sikola.php sudah cerdas:
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

// dirname(__DIR__) = satu level di atas folder public/
// Hasilnya: /home/user/public_html/wizdam/wizdam-sikola.php
$targetFile = dirname(__DIR__) . '/wizdam-sikola.php';

if (file_exists($targetFile)) {
    require $targetFile;
} else {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>503 – Service Unavailable</h1>';
    echo '<p>File aplikasi tidak ditemukan.</p>';
    echo '<small style="color:#999">Path: ' . htmlspecialchars($targetFile) . '</small>';
}