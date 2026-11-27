<?php
declare(strict_types=1);

/**
 * @file api/wrapper/track.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Penerima kunjungan halaman dari frontend (sumber data halaman Monitoring).
 *
 * POST /api/track.php  { "t":"view",  "path":"/researchers", "sid":"…", "vid":"…",
 *                        "ref":"https://google.com/…", "utm":{"source","medium","campaign"} }
 *                      -> { "id": 123 }
 * POST /api/track.php  { "t":"leave", "id":123, "sid":"…", "s": 42 }   (lama tampil, detik)
 *
 * Hanya menerima permintaan dari situs sendiri. Bot/crawler diabaikan. Pengunjung dengan
 * "Do Not Track" tidak mengirim apa pun (diatur di frontend).
 */

use Sciecola\Analytics\VisitTracker;
use Sciecola\Database\Db;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

function tr_out(int $code, array $body = []): void
{
    http_response_code($code);
    echo $body ? json_encode($body) : '';
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    tr_out(405, ['status' => 'error']);
}

// Hanya dari situs sendiri.
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$host   = (string) ($_SERVER['HTTP_HOST'] ?? '');
if ($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== strtolower((string) preg_replace('/:\d+$/', '', $host))) {
    tr_out(403, ['status' => 'error']);
}

$raw = (string) file_get_contents('php://input', false, null, 0, 4096);
$in  = json_decode($raw, true);
if (!is_array($in)) {
    tr_out(400, ['status' => 'error']);
}

$sid = (string) ($in['sid'] ?? '');
if (!preg_match('/^[A-Za-z0-9_-]{8,64}$/', $sid)) {
    tr_out(400, ['status' => 'error']);
}

try {
    $pdo = Db::pdo();
    if (!$pdo) tr_out(503, ['status' => 'error']);

    if (($in['t'] ?? '') === 'leave') {
        VisitTracker::recordDuration($pdo, (int) ($in['id'] ?? 0), $sid, (int) ($in['s'] ?? 0));
        tr_out(204);
    }

    if (($in['t'] ?? '') !== 'view') {
        tr_out(400, ['status' => 'error']);
    }

    $path = VisitTracker::normalizePath((string) ($in['path'] ?? ''));
    if ($path === null) {
        tr_out(204);
    }
    $vid = (string) ($in['vid'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]{8,40}$/', $vid)) {
        $vid = $sid;
    }
    $utm = is_array($in['utm'] ?? null) ? $in['utm'] : [];
    $str = static fn ($v) => is_string($v) && trim($v) !== '' ? trim($v) : null;

    $user = null;
    try {
        $user = \Sciecola\Auth\UserAuth::current();
    } catch (\Throwable $e) {
        $user = null;
    }

    $id = VisitTracker::recordView($pdo, [
        'path'         => $path,
        'sid'          => $sid,
        'vid'          => $vid,
        'referrer'     => $str($in['ref'] ?? null),
        'utm_source'   => $str($utm['source'] ?? null),
        'utm_medium'   => $str($utm['medium'] ?? null),
        'utm_campaign' => $str($utm['campaign'] ?? null),
        'user_orcid'   => $user['orcid'] ?? null,
        'ua'           => (string) ($_SERVER['HTTP_USER_AGENT'] ?? ''),
    ]);
    tr_out(200, ['id' => $id]);
} catch (\Throwable $e) {
    error_log('[track] ' . $e->getMessage());
    tr_out(500, ['status' => 'error']);
}
