<?php
declare(strict_types=1);

/**
 * @file api/wrapper/log_history.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Log History API.
 * Aggregates all backend events: crawl_queue, cache operations, API fetches.
 * Optionally filtered per ORCID (to show events related to logged-in user).
 * 
 * Endpoints:
 * GET /api/log_history.php?orcid=...&type=all&range=7days&page=1&limit=20
 * POST /api/log_history.php { action:"append", level, type, message, context:{} }
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

$appLogFile = ROOT_PATH . '/cache/app_events.json';

// ── POST: append a manual event ──────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($body['action'] ?? '') === 'append') {
    $allowedLevels = ['info', 'success', 'warning', 'error', 'debug'];
    $allowedTypes  = ['api_fetch', 'cache_hit', 'cache_miss', 'cache_save', 'db_write', 'queue_enqueue', 'queue_process', 'auth', 'system'];

    $event = [
        'id'        => uniqid('evt_'),
        'level'     => in_array($body['level'] ?? 'info', $allowedLevels) ? $body['level'] : 'info',
        'type'      => in_array($body['type'] ?? 'system', $allowedTypes) ? $body['type'] : 'system',
        'message'   => substr(htmlspecialchars($body['message'] ?? '', ENT_QUOTES), 0, 500),
        'context'   => $body['context'] ?? [],
        'timestamp' => date('c'),
        'date_key'  => date('Y-m-d'),
    ];

    $events = file_exists($appLogFile)
        ? (json_decode(file_get_contents($appLogFile), true) ?? [])
        : [];

    array_unshift($events, $event);
    $events = array_slice($events, 0, 5000);
    file_put_contents($appLogFile, json_encode($events, JSON_UNESCAPED_UNICODE));

    echo json_encode(['status' => 'success', 'event_id' => $event['id']]);
    exit;
}

// ── GET: aggregate events from all sources ───────────────────────────────────

$orcid   = trim($_GET['orcid'] ?? '');
$type    = $_GET['type'] ?? 'all';
$range   = $_GET['range'] ?? '7days';
$page    = max(1, (int)($_GET['page'] ?? 1));
$limit   = min(200, max(1, (int)($_GET['limit'] ?? 30)));
$search  = strtolower(trim($_GET['search'] ?? ''));

$events = [];

// ── Source 1: app_events.json (manual + system events) ──────────────────────

if (file_exists($appLogFile)) {
    $appEvents = json_decode(file_get_contents($appLogFile), true) ?? [];
    $events = array_merge($events, $appEvents);
}

// ── Source 2: crawl_queue.json ───────────────────────────────────────────────

$queueFile = ROOT_PATH . '/cache/crawl_queue.json';
if (file_exists($queueFile)) {
    $queue = json_decode(file_get_contents($queueFile), true) ?? [];
    foreach ($queue as $job) {
        $jobType  = $job['type'] ?? 'unknown';
        $jobId    = $job['identifier'] ?? '';
        $jobStat  = $job['status'] ?? 'pending';
        $jobTime  = $job['created_at'] ?? date('c');

        // Filter by ORCID if requested
        if ($orcid && $jobType === 'orcid' && $jobId !== $orcid) continue;

        $level = match($jobStat) {
            'done'    => 'success',
            'failed'  => 'error',
            'pending' => 'info',
            default   => 'info',
        };

        $events[] = [
            'id'        => $job['id'] ?? uniqid('qjob_'),
            'level'     => $level,
            'type'      => 'queue_enqueue',
            'message'   => "Crawl queue [$jobType]: $jobId — status: $jobStat",
            'context'   => [
                'source'     => 'crawl_queue',
                'job_id'     => $job['id'] ?? null,
                'identifier' => $jobId,
                'data_type'  => $jobType,
                'attempts'   => $job['attempts'] ?? 0,
                'max_attempts' => $job['max_attempts'] ?? 3,
            ],
            'timestamp' => $jobTime,
            'date_key'  => substr($jobTime, 0, 10),
        ];

        if (isset($job['processed_at'])) {
            $events[] = [
                'id'        => ($job['id'] ?? '') . '_proc',
                'level'     => 'success',
                'type'      => 'queue_process',
                'message'   => "Queue job processed [$jobType]: $jobId",
                'context'   => ['source' => 'crawl_queue', 'job_id' => $job['id'] ?? null],
                'timestamp' => $job['processed_at'],
                'date_key'  => substr($job['processed_at'], 0, 10),
            ];
        }
    }
}

// ── Source 3: Cache folder scan for recent files ─────────────────────────────

$cacheDir = ROOT_PATH . '/cache';
if (is_dir($cacheDir)) {
    $files = glob("$cacheDir/*.json") ?: [];
    foreach ($files as $f) {
        $base = basename($f);
        if (in_array($base, ['crawl_queue.json', 'app_events.json'])) continue;
        if (str_starts_with($base, 'sessions/')) continue;

        $mtime = filemtime($f);
        $ts    = date('c', $mtime);
        $dk    = date('Y-m-d', $mtime);

        // Filter by ORCID
        if ($orcid) {
            $orcidSlug = preg_replace('/[^a-z0-9_-]/i', '_', $orcid);
            if (!str_contains($base, $orcidSlug)) continue;
        }

        preg_match('/^(orcid|doi)_/', $base, $m);
        $dataType = $m[1] ?? 'unknown';

        $events[] = [
            'id'        => 'cache_' . md5($f),
            'level'     => 'info',
            'type'      => 'cache_save',
            'message'   => "Cache file saved: $base (" . round(filesize($f) / 1024, 1) . " KB)",
            'context'   => [
                'source'    => 'cache_folder',
                'file'      => $base,
                'size_kb'   => round(filesize($f) / 1024, 2),
                'data_type' => $dataType,
            ],
            'timestamp' => $ts,
            'date_key'  => $dk,
        ];
    }
}

// ── Source 4: User activity file (if orcid given) ────────────────────────────

if ($orcid) {
    $actFile = ROOT_PATH . '/cache/user_activity/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $orcid) . '.json';
    if (file_exists($actFile)) {
        $acts = json_decode(file_get_contents($actFile), true) ?? [];
        foreach (array_slice($acts, 0, 50) as $act) {
            $events[] = [
                'id'        => $act['id'] ?? uniqid('uact_'),
                'level'     => 'info',
                'type'      => 'api_fetch',
                'message'   => "User action [{$act['type']}]: {$act['title']} → {$act['target']}",
                'context'   => ['source' => 'user_activity', 'category' => $act['category'] ?? 'general'],
                'timestamp' => $act['timestamp'] ?? date('c'),
                'date_key'  => $act['date_key'] ?? date('Y-m-d'),
            ];
        }
    }
}

// ── Sort all events newest-first ─────────────────────────────────────────────

usort($events, fn($a, $b) => strcmp($b['timestamp'] ?? '', $a['timestamp'] ?? ''));

// ── Date range filter ─────────────────────────────────────────────────────────

$cutoff = null;
if ($range === 'today')   $cutoff = date('Y-m-d');
if ($range === '7days')   $cutoff = date('Y-m-d', strtotime('-7 days'));
if ($range === '30days')  $cutoff = date('Y-m-d', strtotime('-30 days'));
if ($cutoff) {
    $events = array_filter($events, fn($e) => ($e['date_key'] ?? '0000') >= $cutoff);
}

// ── Type filter ───────────────────────────────────────────────────────────────

$typeGroups = [
    'api'    => ['api_fetch', 'cache_hit', 'cache_miss'],
    'cache'  => ['cache_save', 'cache_hit', 'cache_miss'],
    'queue'  => ['queue_enqueue', 'queue_process'],
    'db'     => ['db_write'],
    'system' => ['system', 'auth'],
];
if ($type !== 'all' && isset($typeGroups[$type])) {
    $allowed = $typeGroups[$type];
    $events  = array_filter($events, fn($e) => in_array($e['type'] ?? '', $allowed));
}

// ── Search filter ─────────────────────────────────────────────────────────────

if ($search) {
    $events = array_filter($events, fn($e) =>
        str_contains(strtolower($e['message'] ?? ''), $search) ||
        str_contains(strtolower(json_encode($e['context'] ?? [])), $search)
    );
}

$events     = array_values($events);
$total      = count($events);
$totalPages = max(1, (int)ceil($total / $limit));
$paginated  = array_slice($events, ($page - 1) * $limit, $limit);

// ── Summary counts ────────────────────────────────────────────────────────────

$levelCounts = ['info' => 0, 'success' => 0, 'warning' => 0, 'error' => 0, 'debug' => 0];
$typeCounts  = [];
foreach ($events as $e) {
    $l = $e['level'] ?? 'info';
    $t = $e['type'] ?? 'system';
    if (isset($levelCounts[$l])) $levelCounts[$l]++;
    $typeCounts[$t] = ($typeCounts[$t] ?? 0) + 1;
}

echo json_encode([
    'status'      => 'success',
    'total'       => $total,
    'page'        => $page,
    'limit'       => $limit,
    'totalPages'  => $totalPages,
    'levelCounts' => $levelCounts,
    'typeCounts'  => $typeCounts,
    'events'      => $paginated,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
