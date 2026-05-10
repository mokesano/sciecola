<?php
/**
 * File: index.php
 *
 * Copyright (c) Sangia Publishing House (SPH) / Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup index
 * @brief System Entry Point.
 *
 * Bootstrap loader for the SPH Analytics Platform.
 * It initializes the core engine and dispatches the request to the
 * appropriate Service Handler based on Modern Routing.
 * 
 * - Jika ada ?proxy_action= → balas JSON (mode proxy)
 * - Jika tidak → tampilkan halaman HTML
 * 
 * @version 3.0.0 - React + PHP Backend (Opsi A)
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