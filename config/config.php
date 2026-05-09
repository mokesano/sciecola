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
// Contoh Live: https://sciecola.sangia.org
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
// 6. DATABASE CONFIGURATION
// ================================================================

define('DB_HOST',    getenv('DB_HOST')    ?: 'localhost');
define('DB_PORT',    getenv('DB_PORT')    ?: '3306');
define('DB_USER',    getenv('DB_USER')    ?: 'sicola');
define('DB_PASS',    getenv('DB_PASS')    ?: '');
define('DB_NAME',    getenv('DB_NAME')    ?: 'sicola_db');
define('DB_CHARSET', 'utf8mb4');
define('DB_DRIVER',  getenv('DB_DRIVER')  ?: 'mysql'); // 'mysql' for MariaDB, 'pgsql' for PostgreSQL

// ================================================================
// 7. WIZDAM-APIS CONFIGURATION
// ================================================================

define('WIZDAM_API_BASE', getenv('WIZDAM_API_BASE') ?: 'https://api.sangia.org');
define('WIZDAM_API_KEY',  getenv('WIZDAM_API_KEY')  ?: '');

// ================================================================
// MAIL / SMTP CONFIGURATION
// MAIL_DRIVER: 'log' (write to /tmp), 'smtp', 'mail' (PHP native)
// ================================================================
define('MAIL_DRIVER',    getenv('MAIL_DRIVER')    ?: 'log');
define('MAIL_FROM',      getenv('MAIL_FROM')      ?: 'noreply@sciecola.id');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Sciecola');
define('SMTP_HOST',      getenv('SMTP_HOST')      ?: 'smtp.mailtrap.io');
define('SMTP_PORT',      getenv('SMTP_PORT')      ?: '2525');
define('SMTP_USER',      getenv('SMTP_USER')      ?: '');
define('SMTP_PASS',      getenv('SMTP_PASS')      ?: '');
define('SMTP_SECURE',    getenv('SMTP_SECURE')    ?: 'tls');

// Application URL (used in email links)
define('APP_URL',        getenv('APP_URL')        ?: 'http://localhost:5173');

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