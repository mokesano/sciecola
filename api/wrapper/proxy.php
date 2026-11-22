<?php
declare(strict_types=1);

/**
 * @file api/wrapper/proxy.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Reverse proxy for handling API requests to sangia-apis.
 * 
 * Reverse proxy to sangia-apis (https://api.sangia.org).
 * Adds API key server-side so the key is never exposed to the browser.
 *
 * Keamanan: proxy ini memakai kunci API server, jadi tanpa pembatasan siapa pun bisa
 * memakai kuota kunci itu. Sekarang wajib token admin (X-Admin-Token) dan endpoint
 * dibatasi ke jalur /api/v1/... milik wizdam-apis. Halaman publik memanggil
 * wizdam-apis lewat wrapper khusus (SangiaApiClient), bukan lewat proxy ini.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: private, no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';
\Sciecola\Auth\AdminGuard::require();

if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'POST'], true)) {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}

$apiKey   = defined('SANGIA_API_KEY') ? SANGIA_API_KEY : getenv('SANGIA_API_KEY');
$baseUrl  = defined('SANGIA_API_BASE') ? SANGIA_API_BASE : 'https://api.sangia.org';

if (empty($apiKey)) {
    http_response_code(503);
    echo json_encode(['status' => 'error', 'message' => 'API key not configured.']);
    exit;
}

$endpoint = isset($_GET['endpoint']) ? '/' . ltrim($_GET['endpoint'], '/') : '';
if (empty($endpoint)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing endpoint parameter.']);
    exit;
}
// Hanya jalur API wizdam-apis; tolak traversal, skema, host, atau karakter lain.
if (!preg_match('#^/api/v1/[A-Za-z0-9_\-/]+$#', $endpoint) || str_contains($endpoint, '..') || str_contains($endpoint, '//')) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Endpoint not allowed.']);
    exit;
}

// Build query string (exclude 'endpoint' itself)
$params = $_GET;
unset($params['endpoint']);
$targetUrl = $baseUrl . $endpoint;
if (!empty($params)) $targetUrl .= '?' . http_build_query($params);

$method      = $_SERVER['REQUEST_METHOD'];
$requestBody = $method === 'POST' ? file_get_contents('php://input') : null;

$ch = curl_init($targetUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 90,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-API-Key: ' . $apiKey,
    ],
    CURLOPT_SSL_VERIFYPEER => true,
]);

if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody ?: '{}');
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    http_response_code(502);
    error_log('[proxy] ' . $curlErr);
    echo json_encode(['status' => 'error', 'message' => 'Upstream request failed.']);
    exit;
}

http_response_code($httpCode);
echo $response;
