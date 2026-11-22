<?php
declare(strict_types=1);

/**
 * @file api/wrapper/researcher_profile.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Aggregated ORCID Researcher Profile API.
 * Menggabungkan: data database / mesin SDG lokal + Sangia Impact Score (wizdam-apis).
 * Output: JSON terpadu siap digunakan ResearcherProfile.jsx
 *
 * Logika penyusunan ada di src/Sdg/ResearcherProfileService.php agar bisa dipakai
 * bersama oleh profile_lookup.php, my_articles.php, dan my_statistics.php tanpa
 * me-require file endpoint ini (yang dulu memicu fatal error "Cannot redeclare").
 * 
 * Endpoints:
 * GET /api/researcher_profile.php?orcid=0000-0000-0000-0000[&refresh=true]
 */

ob_start();

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
if (!defined('DB_DATABASE')) require_once ROOT_PATH . '/config/config.php';
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Sdg\ResearcherProfileService;

function rp_respond(array $payload, int $code = 200): void
{
    while (ob_get_level()) ob_end_clean();
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') rp_respond([], 204);

// ── Input validation ──────────────────────────────────────────────────────────
$orcid = trim($_GET['orcid'] ?? '');
if ($orcid === '') {
    rp_respond(['status' => 'error', 'message' => 'orcid is required'], 400);
}
if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $orcid)) {
    rp_respond(['status' => 'error', 'message' => 'invalid ORCID format'], 400);
}

@set_time_limit(90);

try {
    $result = ResearcherProfileService::build($orcid, [
        'refresh' => ($_GET['refresh'] ?? '') === 'true',
    ]);
    unset($result['works']); // daftar karya lengkap hanya untuk pemakaian internal
    rp_respond($result);
} catch (Throwable $e) {
    $code = in_array($e->getCode(), [400, 404, 502], true) ? (int) $e->getCode() : 500;
    rp_respond(['status' => 'error', 'message' => $e->getMessage()], $code);
}
