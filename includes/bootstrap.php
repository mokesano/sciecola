<?php
declare(strict_types=1);

/**
 * @file includes/bootstrap.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup includes
 * @brief Pusat inisialisasi dan Routing utama (Front Controller) Sciecola.
 * 
 * File ini di-include oleh public/index.php sebagai titik masuk utama aplikasi.
 * 
 * @author Rochmady and Sangia Publishing House
 * @license MIT
 * @version 1.0.0
 */

// 1. Pastikan ROOT_PATH sudah ada (dari public/index.php)
if (!defined('ROOT_PATH')) {
    die('System Error: ROOT_PATH is missing.');
}

// 2. Pengaturan Error (Set ke 0 saat Production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 3. PSR-4 Autoloader (Sciecola\ → src/)
require_once __DIR__ . '/autoload.php';

// 4. Muat Konfigurasi dan Fungsi Global
$configFile = __DIR__ . '/config.php';

if (file_exists($configFile)) {
    require_once $configFile;
}

$functionsFile = __DIR__ . '/functions.php';
if (file_exists($functionsFile)) {
    require_once $functionsFile;
} else {
    die('System Error: file functions.php tidak ditemukan di folder includes.');
}

// 5–6. Kunjungan halaman TIDAK lagi dicatat di sini. Aplikasi memakai HashRouter
// (/#/halaman), jadi server hanya melihat "/" untuk setiap halaman dan tidak tahu lama
// kunjungan. Pencatatan dilakukan frontend lewat /api/track.php
// (src/Analytics/VisitTracker.php). Sesi PHP (PHPSESSID) juga tidak lagi dibuka untuk
// setiap pengunjung; login memakai cookie sciecola_session sendiri.

// =========================================================================
// 7. SISTEM ROUTER UTAMA (API vs FRONTEND)
// =========================================================================

if (is_api_request()) {
    /*
     * JALUR A: SDG CLASSIFICATION PROXY
     * Request dengan ?_sdg= atau ?proxy_action= → SDG Classification API
     */
    $apiFile = ROOT_PATH . '/api/sdgs/SDG_Classification_API.php';

    if (file_exists($apiFile)) {
        handle_api_proxy_request($apiFile);
    } else {
        send_json_response(['status' => 'error', 'message' => 'Endpoint API Sciecola tidak ditemukan.'], 404);
    }

} elseif (is_wrapper_api_request()) {
    /*
     * JALUR B: API WRAPPER ENDPOINTS
     * Request /api/*.php → /api/wrapper/*.php (private, di luar public/)
     */
    route_api_wrapper();

} elseif (is_sitemap_xml_request()) {
    /*
     * JALUR C: SEO XML SITEMAP
     * Request /sitemap.xml → XML sitemap dinamis
     */
    route_sitemap_xml();

} else {
    /*
     * JALUR C: FRONTEND (HTML)
     */
    // Catatan keamanan: alamat selain "/" (404) dan kunjungan bot → security_events.
    \Sciecola\Middleware\AccessLogger::inspectRequest();

    $uiFile = __DIR__ . '/sciecolaUI.php';

    if (file_exists($uiFile)) {
        require_once $uiFile;
    } else {
        http_response_code(404);
        echo '<h1>404 - Antarmuka Tidak Ditemukan</h1><p>File sciecolaUI.php hilang dari direktori includes.</p>';
    }
}