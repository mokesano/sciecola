<?php
declare(strict_types=1);

/**
 * @file api/proxy.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Reverse proxy for handling API requests to wizdam-apis.
 * 
 * Reverse proxy to wizdam-apis (https://api.sangia.org).
 * Adds API key server-side so the key is never exposed to the browser.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Load API key from config
$configFile = __DIR__ . '/../config/config.php';
if (file_exists($configFile)) require_once $configFile;

$apiKey   = defined('WIZDAM_API_KEY') ? WIZDAM_API_KEY : getenv('WIZDAM_API_KEY');
$baseUrl  = defined('WIZDAM_API_BASE') ? WIZDAM_API_BASE : 'https://api.sangia.org';

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
    echo json_encode(['status' => 'error', 'message' => 'Upstream request failed: ' . $curlErr]);
    exit;
}

http_response_code($httpCode);
echo $response;
