<?php
/**
 * File: /includes/bootstrap.php
 * Pusat inisialisasi dan Routing utama (Front Controller) Sicola.
 */

// 1. Pastikan ROOT_PATH sudah ada (dari public/index.php)
if (!defined('ROOT_PATH')) {
    die('System Error: ROOT_PATH is missing.');
}

// 2. Pengaturan Error (Set ke 0 saat Production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 3. Muat Konfigurasi dan Fungsi Global
// Karena file-file ini sekarang berada di folder yang sama dengan bootstrap.php,
// kita cukup menggunakan __DIR__
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

// =========================================================================
// 4. SISTEM ROUTER UTAMA (API vs FRONTEND)
// =========================================================================

if (is_api_request()) {
    /* 
     * JALUR A: REQUEST API / PROXY
     * Masuk ke mode Anti-Timeout dan batching.
     */
    
    // File API tetap berada di luar folder includes
    $apiFile = ROOT_PATH . '/api/SDG_Classification_API.php';
    
    if (file_exists($apiFile)) {
        // Eksekusi fungsi proxy yang ada di functions.php
        handle_api_proxy_request($apiFile);
    } else {
        send_json_response(['status' => 'error', 'message' => 'Endpoint API Sicola tidak ditemukan.'], 404);
    }

} else {
    /* 
     * JALUR B: REQUEST TAMPILAN / FRONTEND (HTML)
     */
     
    // Memanggil sicola.php yang SEKARANG ada di folder yang sama (__DIR__)
    $uiFile = __DIR__ . '/sicola.php';
    
    if (file_exists($uiFile)) {
        // Panggil cangkang HTML yang memuat file hasil kompilasi React
        require_once $uiFile;
    } else {
        http_response_code(404);
        echo '<h1>404 - Antarmuka Tidak Ditemukan</h1><p>File sicola.php hilang dari direktori includes.</p>';
    }
}