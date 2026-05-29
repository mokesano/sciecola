<?php
declare(strict_types=1);

/**
 * @file api/wrapper/my_profile.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief My Profile API – thin wrapper around researcher_profile.php
 * Uses the ORCID stored in the request (from frontend AuthContext).
 * 
 * Endpoints:
 * GET  /api/my_profile.php?orcid=0000-0002-1234-5678
 * POST /api/my_profile.php { orcid, action:"update", fields:{...} }
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;

$body   = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? $_POST;
}

$action = $body['action'] ?? $_GET['action'] ?? 'get';
$orcid  = trim($body['orcid'] ?? $_GET['orcid'] ?? '');

if (empty($orcid)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Parameter orcid diperlukan']);
    exit;
}
if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $orcid)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Format ORCID tidak valid']);
    exit;
}

switch ($action) {

    case 'get':
        // Delegate to researcher_profile.php (cache-aware, full aggregation)
        $apiFile = __DIR__ . '/researcher_profile.php';
        if (!file_exists($apiFile)) {
            http_response_code(503);
            echo json_encode(['status' => 'error', 'message' => 'researcher_profile.php tidak ditemukan']);
            exit;
        }

        // Capture researcher_profile.php output with GET orcid param
        $origGet    = $_GET;
        $origMethod = $_SERVER['REQUEST_METHOD'];
        $_GET       = ['orcid' => $orcid];
        $_SERVER['REQUEST_METHOD'] = 'GET';

        ob_start();
        try { require $apiFile; } catch (Throwable $t) { ob_end_clean(); }
        $raw = ob_get_clean();

        $_GET = $origGet;
        $_SERVER['REQUEST_METHOD'] = $origMethod;

        // Extract first JSON from output
        for ($i = 0, $l = strlen($raw ?? ''); $i < $l; $i++) {
            if ($raw[$i] === '{' || $raw[$i] === '[') {
                $data = json_decode(substr($raw, $i), true);
                if (is_array($data)) { echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
            }
        }
        http_response_code(502);
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil profil dari ORCID API']);
        break;

    case 'update':
        // Persist user-editable fields to a local JSON overlay file
        $overlayDir  = ROOT_PATH . '/cache/user_overlays';
        if (!is_dir($overlayDir)) @mkdir($overlayDir, 0750, true);
        $overlayFile = $overlayDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $orcid) . '.json';

        $existing = file_exists($overlayFile)
            ? (json_decode(file_get_contents($overlayFile), true) ?? [])
            : [];

        $allowed = ['bio', 'avatar', 'socialLinks', 'researchInterests', 'title', 'department'];
        $fields  = $body['fields'] ?? [];
        foreach ($allowed as $key) {
            if (isset($fields[$key])) $existing[$key] = $fields[$key];
        }
        $existing['updated_at'] = date('c');
        file_put_contents($overlayFile, json_encode($existing, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        echo json_encode(['status' => 'success', 'updated' => array_keys($fields)]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Action tidak dikenali: $action"]);
}
