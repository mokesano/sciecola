<?php
declare(strict_types=1);

/**
 * SDG Frontend - Configuration File
 * Konfigurasi utama untuk aplikasi SDG Classification Analysis
 *
 * @version 1.0.0
 * @author Rochmady and Sciecola Team
 * @license MIT
 */

// Load .env file (simple parser, no Composer required)
// IMPORTANT: Only load from .env if the variable is NOT already set in the process environment.
// This prevents a stale .env from overriding production DB credentials or API keys.
(static function (): void {
    $envFile = __DIR__ . '/../.env';
    if (!file_exists($envFile)) {
        return;
    }
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        // Only load from .env if NOT already set in the process environment
        if ($key !== '' && getenv($key) === false) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
        }
    }
})();

// ==============================================
// PENGATURAN DASAR APLIKASI
// ==============================================

// Informasi situs
define('SITE_NAME', 'SDGs Classification Analysis');
define('SITE_URL', getenv('SITE_URL') ?: 'https://sciecola.sangia.org');
define('VERSION', '1.0.0');
define('API_VERSION', 'v1_0_0');

// Pengaturan environment
define('ENVIRONMENT', getenv('APP_ENV') ?: 'production');
define('DEBUG_MODE', ENVIRONMENT === 'development');

// Timezone
date_default_timezone_set('Asia/Jakarta');

// ==============================================
// KONFIGURASI API
// ==============================================

// URL API utama - sesuai dengan kode original
$CONFIG = [
    // API endpoint untuk analisis SDG
    'API_BASE_URL' => 'https://sciecola.sangia.org/API/v1_0_0_SDGs_Classification.php',
    
    // API eksternal
    'ORCID_API_URL' => 'https://pub.orcid.org/v3.0',
    'CROSSREF_API_URL' => 'https://api.crossref.org/works',
    'OPENALEX_API_URL' => 'https://api.openalex.org/works',
    
    // Timeout settings
    'TIMEOUT_CONNECT' => 10,
    'TIMEOUT_EXECUTE' => 120,
    'MAX_EXECUTION_TIME' => 300,
    
    // Cache settings
    'CACHE_TTL' => 3600, // 1 jam
    'CACHE_DIR' => __DIR__ . '/../cache',
    'ENABLE_CACHE' => true,
    
    // Limits
    'MAX_WORKS_LIMIT' => 100,
    'MAX_ORCID_WORKS' => 50,
    'API_RATE_LIMIT' => 60, // requests per minute
    
    // Performance
    'ENABLE_COMPRESSION' => true,
    'MEMORY_LIMIT' => '512M',
];

// ==============================================
// KONFIGURASI DATABASE (OPSIONAL)
// ==============================================

// Jika Anda menggunakan database untuk logging atau caching
$DB_CONFIG = [
    'host'     => getenv('DB_HOST')     ?: 'localhost',
    'port'     => getenv('DB_PORT')     ?: '3306',
    'database' => getenv('DB_NAME')     ?: 'sdg_analysis',
    'username' => getenv('DB_USER')     ?: '',
    'password' => getenv('DB_PASS')     ?: '',
    'driver'   => getenv('DB_DRIVER')   ?: 'mysql',
    'charset'  => 'utf8mb4',
    'enabled'  => (getenv('DB_USER') !== '' && getenv('DB_USER') !== false),
];

// ==============================================
// KONFIGURASI KEAMANAN
// ==============================================

// CSRF Protection
define('CSRF_TOKEN_NAME', '_token');
define('SESSION_TIMEOUT', 3600); // 1 jam

// Content Security Policy
$CSP_POLICY = [
    'default-src' => "'self'",
    'script-src' => "'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    'style-src' => "'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    'font-src' => "'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    'img-src' => "'self' data: https: blob:",
    'connect-src' => "'self' https://sciecola.sangia.org https://api.orcid.org https://api.crossref.org",
];

// ==============================================
// KONFIGURASI LOGGING
// ==============================================

$LOG_CONFIG = [
    'enabled' => true,
    'level' => 'INFO', // DEBUG, INFO, WARNING, ERROR
    'file' => __DIR__ . '/../logs/app.log',
    'max_size' => 10485760, // 10MB
    'max_files' => 5
];

// ==============================================
// KONFIGURASI EMAIL (UNTUK NOTIFIKASI)
// ==============================================

$EMAIL_CONFIG = [
    'enabled'    => (getenv('SMTP_USER') !== '' && getenv('SMTP_USER') !== false),
    'driver'     => getenv('MAIL_DRIVER')    ?: 'log',
    'host'       => getenv('SMTP_HOST')      ?: 'smtp.mailtrap.io',
    'port'       => (int)(getenv('SMTP_PORT') ?: 2525),
    'username'   => getenv('SMTP_USER')      ?: '',
    'password'   => getenv('SMTP_PASS')      ?: '',
    'secure'     => getenv('SMTP_SECURE')    ?: 'tls',
    'from_email' => getenv('MAIL_FROM')      ?: 'noreply@sciecola.sangia.org',
    'from_name'  => getenv('MAIL_FROM_NAME') ?: 'SDG Analysis Platform',
];

// ==============================================
// KONFIGURASI ANALYTICS
// ==============================================

// Google Analytics (opsional)
define('GOOGLE_ANALYTICS_ID', ''); // Isi dengan GA ID jika ada

// Internal analytics
$ANALYTICS_CONFIG = [
    'enabled' => true,
    'track_searches' => true,
    'track_errors' => true,
    'retention_days' => 90
];

// ==============================================
// KONFIGURASI EKSTERNAL SERVICES
// ==============================================

// Social Media Links
$SOCIAL_LINKS = [
    'twitter' => 'https://twitter.com/sciecola',
    'linkedin' => 'https://linkedin.com/company/sciecola',
    'github' => 'https://github.com/sciecola',
    'youtube' => 'https://youtube.com/@sciecola'
];

// Contact Information
$CONTACT_INFO = [
    'email' => 'contact.sciecola@sangia.org',
    'support' => 'support.sciecola@sangia.org',
    'business' => 'business.sciecola@sangia.org',
    'phone' => '+1-555-0123',
    'address' => '123 Innovation Street, Tech City, TC 12345'
];

// ==============================================
// INISIALISASI SISTEM
// ==============================================

// Set memory limit dan timeout
ini_set('memory_limit', $CONFIG['MEMORY_LIMIT']);
set_time_limit($CONFIG['MAX_EXECUTION_TIME']);

// Buat direktori cache jika belum ada
if ($CONFIG['ENABLE_CACHE'] && !file_exists($CONFIG['CACHE_DIR'])) {
    mkdir($CONFIG['CACHE_DIR'], 0755, true);
}

// Buat direktori logs jika belum ada
if ($LOG_CONFIG['enabled'] && !file_exists(dirname($LOG_CONFIG['file']))) {
    mkdir(dirname($LOG_CONFIG['file']), 0755, true);
}

// Set Content Security Policy headers
if (ENVIRONMENT === 'production') {
    $csp_string = '';
    foreach ($CSP_POLICY as $directive => $value) {
        $csp_string .= $directive . ' ' . $value . '; ';
    }
    header('Content-Security-Policy: ' . trim($csp_string));
    
    // Other security headers
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
}

// Compression untuk performance
if ($CONFIG['ENABLE_COMPRESSION'] && !ob_get_level()) {
    ob_start('ob_gzhandler');
}

// ==============================================
// FUNGSI HELPER KONFIGURASI
// ==============================================

/**
 * Get configuration value
 */
function getConfig($key, $default = null) {
    global $CONFIG;
    return isset($CONFIG[$key]) ? $CONFIG[$key] : $default;
}

/**
 * Check if feature is enabled
 */
function isFeatureEnabled($feature) {
    global $CONFIG;
    return isset($CONFIG[$feature]) && $CONFIG[$feature] === true;
}

/**
 * Get cache directory path
 */
function getCacheDir() {
    global $CONFIG;
    return $CONFIG['CACHE_DIR'];
}

/**
 * Get API base URL
 */
function getApiBaseUrl() {
    global $CONFIG;
    return $CONFIG['API_BASE_URL'];
}

// ==============================================
// ERROR HANDLING
// ==============================================

// Custom error handler untuk production
if (ENVIRONMENT === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
}

// Exception handler
set_exception_handler(function($exception) {
    error_log('Uncaught exception: ' . $exception->getMessage());
    if (ENVIRONMENT === 'development') {
        echo '<pre>' . $exception . '</pre>';
    } else {
        http_response_code(500);
        include __DIR__ . '/../pages/error.php';
    }
});

// ==============================================
// CONSTANTS TAMBAHAN
// ==============================================

// Status codes
define('SUCCESS_CODE', 200);
define('ERROR_CODE', 500);
define('NOT_FOUND_CODE', 404);
define('UNAUTHORIZED_CODE', 401);

// File extensions yang diizinkan
define('ALLOWED_UPLOAD_EXTENSIONS', ['pdf', 'doc', 'docx', 'txt']);
define('MAX_UPLOAD_SIZE', 5242880); // 5MB

// Default values
define('DEFAULT_CACHE_TTL', 3600);
define('DEFAULT_TIMEOUT', 30);
define('DEFAULT_LIMIT', 20);

?>