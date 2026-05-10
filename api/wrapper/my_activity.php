<?php
/**
 * My Activity API
 * Stores and retrieves user activity events (file-based per ORCID).
 *
 * GET  /api/my_activity.php?orcid=...&range=7days&type=all&page=1
 * POST /api/my_activity.php { orcid, type, category, title, target, detail, metadata:{} }
 */

declare(strict_types=1);
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

$orcid = trim($body['orcid'] ?? $_GET['orcid'] ?? '');
if (empty($orcid)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Parameter orcid diperlukan']);
    exit;
}

$activityDir  = ROOT_PATH . '/cache/user_activity';
if (!is_dir($activityDir)) @mkdir($activityDir, 0750, true);
$activityFile = $activityDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $orcid) . '.json';

// ── POST: record a new activity ──────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $allowed_types = ['viewed','saved','downloaded','searched','analyzed','shared','commented','exported','updated','collaborated'];
    $type = $body['type'] ?? 'viewed';
    if (!in_array($type, $allowed_types, true)) $type = 'viewed';

    $event = [
        'id'        => uniqid('act_'),
        'type'      => $type,
        'category'  => $body['category'] ?? 'article',
        'title'     => substr(htmlspecialchars($body['title'] ?? '', ENT_QUOTES), 0, 200),
        'target'    => substr(htmlspecialchars($body['target'] ?? '', ENT_QUOTES), 0, 300),
        'detail'    => substr(htmlspecialchars($body['detail'] ?? '', ENT_QUOTES), 0, 300),
        'metadata'  => $body['metadata'] ?? [],
        'timestamp' => date('c'),
        'date_key'  => date('Y-m-d'),
    ];

    $activities = file_exists($activityFile)
        ? (json_decode(file_get_contents($activityFile), true) ?? [])
        : [];

    array_unshift($activities, $event); // newest first
    $activities = array_slice($activities, 0, 1000); // keep max 1000
    file_put_contents($activityFile, json_encode($activities, JSON_UNESCAPED_UNICODE));

    echo json_encode(['status' => 'success', 'event_id' => $event['id']]);
    exit;
}

// ── GET: list activities ─────────────────────────────────────────────────────

$range  = $_GET['range'] ?? '30days';
$type   = $_GET['type'] ?? 'all';
$page   = max(1, (int)($_GET['page'] ?? 1));
$limit  = min(100, max(1, (int)($_GET['limit'] ?? 20)));

$activities = file_exists($activityFile)
    ? (json_decode(file_get_contents($activityFile), true) ?? [])
    : [];

// Also append crawl_queue events as system activities
$queueFile = ROOT_PATH . '/cache/crawl_queue.json';
if (file_exists($queueFile)) {
    $queue = json_decode(file_get_contents($queueFile), true) ?? [];
    foreach ($queue as $job) {
        if (($job['type'] ?? '') === 'orcid' && ($job['identifier'] ?? '') === $orcid) {
            $activities[] = [
                'id'        => $job['id'] ?? uniqid('sys_'),
                'type'      => 'analyzed',
                'category'  => 'system',
                'title'     => 'Sistem mengantri analisis ORCID',
                'target'    => $orcid,
                'detail'    => 'Status: ' . ($job['status'] ?? 'pending') . ' | Attempts: ' . ($job['attempts'] ?? 0),
                'metadata'  => ['source' => 'crawl_queue', 'job_id' => $job['id'] ?? null],
                'timestamp' => $job['created_at'] ?? date('c'),
                'date_key'  => substr($job['created_at'] ?? date('c'), 0, 10),
            ];
        }
    }
    // Sort by timestamp desc
    usort($activities, fn($a, $b) => strcmp($b['timestamp'] ?? '', $a['timestamp'] ?? ''));
}

// Date filter
$cutoff = null;
if ($range === 'today') $cutoff = date('Y-m-d');
elseif ($range === '7days') $cutoff = date('Y-m-d', strtotime('-7 days'));
elseif ($range === '30days') $cutoff = date('Y-m-d', strtotime('-30 days'));

if ($cutoff) {
    $activities = array_filter($activities, fn($a) => ($a['date_key'] ?? '0000') >= $cutoff);
}

// Type filter
if ($type !== 'all') {
    $map = [
        'viewed'   => ['viewed'],
        'saved'    => ['saved', 'downloaded'],
        'shared'   => ['shared', 'commented'],
        'analysis' => ['analyzed', 'exported'],
    ];
    $allowed = $map[$type] ?? [$type];
    $activities = array_filter($activities, fn($a) => in_array($a['type'] ?? '', $allowed));
}

$activities = array_values($activities);
$total      = count($activities);
$totalPages = max(1, (int)ceil($total / $limit));
$paginated  = array_slice($activities, ($page - 1) * $limit, $limit);

// Build summary stats
$typeCounts = [];
foreach ($activities as $a) {
    $t = $a['type'] ?? 'other';
    $typeCounts[$t] = ($typeCounts[$t] ?? 0) + 1;
}

echo json_encode([
    'status'     => 'success',
    'orcid'      => $orcid,
    'total'      => $total,
    'page'       => $page,
    'limit'      => $limit,
    'totalPages' => $totalPages,
    'summary'    => $typeCounts,
    'activities' => $paginated,
], JSON_UNESCAPED_UNICODE);
