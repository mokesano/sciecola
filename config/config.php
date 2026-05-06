<?php
/**
 * File: /includes/config.php
 * Konfigurasi Utama Sicola
 */

if (!defined('ROOT_PATH')) {
    exit('Direct script access is not allowed.');
}

// ================================================================
// 1. ENVIRONMENT & URL SETTINGS
// ================================================================

// Ubah ke 'production' saat diupload ke server live (CPanel/Hosting)
// Mode 'development' akan menampilkan error, 'production' akan menyembunyikannya
define('ENVIRONMENT', 'development');

// Base URL Aplikasi (PENTING: Tanpa garis miring / di akhir)
// Contoh Lokal: http://localhost/workspace
// Contoh Live: https://wizdam.sangia.org
define('SITE_URL', 'http://localhost/workspace');

define('SITE_NAME', 'Lumera Sicola');

// ================================================================
// 2. PATH DEFINITIONS (Direktori)
// ================================================================

// Pastikan folder-folder ini ada dan memiliki izin tulis (writable - CHMOD 755/777)
define('CACHE_DIR', ROOT_PATH . '/cache');
define('LOG_DIR', ROOT_PATH . '/logs');

// ================================================================
// 3. CACHE CONFIGURATION
// ================================================================

// Apakah sistem cache aktif? (Sangat disarankan true agar tidak kena timeout/rate limit API)
define('ENABLE_CACHE', true);

// Waktu hidup cache dalam detik (3600 = 1 Jam, 86400 = 1 Hari)
define('CACHE_TTL', 86400); 

// Kompresi data cache (menghemat penyimpanan server)
define('ENABLE_COMPRESSION', true);

// ================================================================
// 4. API ENDPOINTS & TIMEOUTS
// ================================================================

// Timeout untuk request ke API eksternal (dalam detik)
// Atur tinggi (misal 120-300 detik) jika proses ORCID sangat banyak
define('TIMEOUT_EXECUTE', 180); 
define('TIMEOUT_CONNECT', 15);

// API Eksternal
define('ORCID_API_URL', 'https://pub.orcid.org/v3.0');
define('CROSSREF_API_URL', 'https://api.crossref.org/works');
define('OPENALEX_API_URL', 'https://api.openalex.org/works');

// ================================================================
// 5. ERROR LOGGING CONFIGURATION
// ================================================================

$LOG_CONFIG = [
    'enabled' => true,
    'file'    => LOG_DIR . '/app.log'
];

// ================================================================
// 6. DATABASE CONFIGURATION (Opsional - Jika Nanti Dibutuhkan)
// ================================================================
// Saat ini aplikasi Anda tampaknya berbasis API eksternal murni, 
// namun jika nanti Anda ingin menyimpan data secara permanen (MySQL/MariaDB):

/*
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'sicola_db');
define('DB_CHARSET', 'utf8mb4');
*/

// ================================================================
// IMPLEMENTASI ENVIRONMENT (TIDAK PERLU DIUBAH)
// ================================================================

if (ENVIRONMENT === 'development') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}

// Fungsi pembantu kecil untuk mengambil nilai konfigurasi jika dibutuhkan di file lain
// (Mencegah error jika konstanta belum didefinisikan)
function getConfig($key, $default = null) {
    if (defined($key)) {
        return constant($key);
    }
    return $default;
}