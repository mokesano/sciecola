<?php
declare(strict_types=1);

/**
 * @file api/wrapper/profile_lookup.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Multi-ID researcher profile dispatcher.
 *
 * Accepts one of ORCID / Scopus Author ID / SINTA ID / ResearcherID (Publons)
 * and dispatches to the appropriate underlying lookup. Only ORCID is fully
 * implemented today; the other IDs are wired through the sangia-apis
 * external service when it is configured, otherwise the endpoint returns a
 * structured `status: "unsupported"` payload so the frontend can render a
 * clear message instead of a blank error.
 *
 * Endpoints:
 *   GET /api/profile_lookup.php?type=orcid&id=0000-0000-0000-0000
 *   GET /api/profile_lookup.php?type=scopus&id=7005075676
 *   GET /api/profile_lookup.php?type=sinta&id=6009471
 *   GET /api/profile_lookup.php?type=researcherid&id=A-1234-2020
 *
 * Response envelope (all responses):
 *   { status: 'success' | 'error' | 'unsupported', profile?: {...}, message?: '...' }
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;

$type = strtolower(trim($_GET['type'] ?? 'orcid'));
$id   = trim($_GET['id']   ?? '');

if ($id === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Parameter id diperlukan']);
    exit;
}

// ── Format validators (per ID type) ──────────────────────────────────────────
$validators = [
    'orcid'        => '/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i',
    'scopus'       => '/^\d{6,12}$/',              // Scopus Author IDs are numeric 6-12 digits.
    'sinta'        => '/^\d{4,10}$/',              // SINTA IDs are numeric 4-10 digits (Kemendikbud).
    'researcherid' => '/^[A-Z]{1,3}-\d{4}-\d{4}$/i', // Legacy Publons/WoS ResearcherID: e.g. A-1234-2020.
];

if (!isset($validators[$type])) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => "type '$type' tidak dikenali. Pilihan: orcid, scopus, sinta, researcherid",
    ]);
    exit;
}
if (!preg_match($validators[$type], $id)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => "Format $type tidak valid: $id",
    ]);
    exit;
}

// ── Helper: capture in-process PHP output as JSON ────────────────────────────
function callLocalApi(string $apiFile, array $params): array
{
    $origGet    = $_GET;
    $origMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $_GET = $params;
    $_SERVER['REQUEST_METHOD'] = 'GET';
    ob_start();
    try { require $apiFile; } catch (Throwable $t) {
        ob_end_clean();
        $_GET = $origGet;
        $_SERVER['REQUEST_METHOD'] = $origMethod;
        return ['status' => 'error', 'message' => $t->getMessage()];
    }
    $raw = ob_get_clean();
    $_GET = $origGet;
    $_SERVER['REQUEST_METHOD'] = $origMethod;

    for ($i = 0, $l = strlen($raw); $i < $l; $i++) {
        if ($raw[$i] === '{' || $raw[$i] === '[') {
            $data = json_decode(substr($raw, $i), true);
            return is_array($data) ? $data : ['status' => 'error', 'message' => 'invalid json'];
        }
    }
    return ['status' => 'error', 'message' => 'empty api output'];
}

// ── Helper: call sangia-apis for cross-database lookup ───────────────────────
function callSangiaLookup(string $type, string $id): ?array
{
    $apiKey  = defined('SANGIA_API_KEY') ? SANGIA_API_KEY : (getenv('SANGIA_API_KEY') ?: '');
    $baseUrl = defined('SANGIA_API_BASE') ? SANGIA_API_BASE : 'https://api.sangia.org';
    if (empty($apiKey)) return null;

    $endpoints = [
        'scopus'       => '/api/v1/researcher/lookup/scopus',
        'sinta'        => '/api/v1/researcher/lookup/sinta',
        'researcherid' => '/api/v1/researcher/lookup/researcherid',
    ];
    if (!isset($endpoints[$type])) return null;

    $ch = curl_init($baseUrl . $endpoints[$type]);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 45,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(['id' => $id]),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-API-Key: ' . $apiKey,
        ],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode >= 400) return null;
    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : null;
}

// ── Dispatch ─────────────────────────────────────────────────────────────────
switch ($type) {

    case 'orcid':
        // Delegate to the mature ORCID aggregator that already exists.
        // Try wrapper path first (in-process); fall back to public endpoint file.
        $candidates = [
            __DIR__ . '/researcher_profile.php',
            ROOT_PATH . '/api/researcher_profile.php',
        ];
        $data = null;
        foreach ($candidates as $file) {
            if (is_file($file)) {
                $data = callLocalApi($file, ['orcid' => $id]);
                if (($data['status'] ?? '') === 'success') break;
            }
        }
        if (!$data) {
            http_response_code(503);
            echo json_encode(['status' => 'error', 'message' => 'ORCID aggregator tidak tersedia']);
            exit;
        }
        // Ensure source metadata is present on the response profile.
        if (($data['status'] ?? '') === 'success' && isset($data['profile']) && is_array($data['profile'])) {
            $data['profile']['_source_type'] = 'orcid';
            $data['profile']['_source_id']   = $id;
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        break;

    case 'scopus':
    case 'sinta':
    case 'researcherid':
        $sangia = callSangiaLookup($type, $id);
        if ($sangia && ($sangia['status'] ?? '') === 'success' && !empty($sangia['profile'])) {
            $sangia['profile']['_source_type'] = $type;
            $sangia['profile']['_source_id']   = $id;
            echo json_encode($sangia, JSON_UNESCAPED_UNICODE);
            break;
        }
        // Not configured or upstream returned no data — respond with a structured
        // "unsupported" envelope so the UI can present a helpful message.
        http_response_code(200);
        echo json_encode([
            'status'      => 'unsupported',
            'type'        => $type,
            'id'          => $id,
            'message'     => "Lookup untuk $type belum aktif di deployment ini. "
                . "Aktifkan SANGIA_API_KEY di config atau gunakan ORCID untuk sekarang.",
        ], JSON_UNESCAPED_UNICODE);
        break;

    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "type '$type' tidak dikenali"]);
}
