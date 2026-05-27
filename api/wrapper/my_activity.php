<?php
declare(strict_types=1);

/**
 * @file api/wrapper/my_activity.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief My Activity API — records and retrieves user activities (views, saves, downloads, searches, etc).
 * DB-first, file-based fallback.
 * 
 * Endpoints:
 * GET  /api/my_activity.php?orcid=...&range=7days&type=all&page=1
 * POST /api/my_activity.php { orcid, type, category, title, target_id, detail, metadata:{} }
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

$body  = [];
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

function dbPdo(): ?PDO
{
    if (!defined('DB_HOST') || !DB_HOST) return null;
    try {
        return new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    } catch (Exception $e) { return null; }
}

function activityFile(string $orcid): string
{
    $dir = ROOT_PATH . '/cache/user_activity';
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    return $dir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $orcid) . '.json';
}

// ─── POST: record activity ────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $allowed_types = ['viewed','saved','downloaded','searched','analyzed','shared','commented','exported','updated','collaborated'];
    $type          = in_array($body['type'] ?? '', $allowed_types) ? $body['type'] : 'viewed';
    $category      = $body['category'] ?? 'article';
    $title         = substr(htmlspecialchars($body['title'] ?? '', ENT_QUOTES), 0, 300);
    $targetId      = substr($body['target_id'] ?? $body['target'] ?? '', 0, 512);
    $metadata      = $body['metadata'] ?? [];

    $pdo = dbPdo();
    if ($pdo) {
        try {
            $pdo->prepare(
                'INSERT INTO user_activity_log (orcid, activity_type, category, target_id, title, metadata_json)
                 VALUES (?, ?, ?, ?, ?, ?)'
            )->execute([$orcid, $type, $category, $targetId ?: null, $title ?: null, $metadata ? json_encode($metadata) : null]);
            echo json_encode(['status' => 'success']);
            exit;
        } catch (Exception $e) { /* fall through to file */ }
    }

    // File-based fallback
    $event = [
        'id'        => uniqid('act_'),
        'type'      => $type,
        'category'  => $category,
        'title'     => $title,
        'target_id' => $targetId,
        'metadata'  => $metadata,
        'timestamp' => date('c'),
        'date_key'  => date('Y-m-d'),
    ];
    $file       = activityFile($orcid);
    $activities = file_exists($file) ? (json_decode(file_get_contents($file), true) ?? []) : [];
    array_unshift($activities, $event);
    $activities = array_slice($activities, 0, 1000);
    @file_put_contents($file, json_encode($activities, JSON_UNESCAPED_UNICODE));
    echo json_encode(['status' => 'success']);
    exit;
}

// ─── GET: retrieve activity ───────────────────────────────────────────────────

$page       = max(1, (int)($_GET['page'] ?? 1));
$pageSize   = min(100, max(1, (int)($_GET['limit'] ?? 20)));
$offset     = ($page - 1) * $pageSize;
$typeFilter = trim($_GET['type'] ?? 'all');
$rangeStr   = trim($_GET['range'] ?? '7days');

$cutoff = match ($rangeStr) {
    '30days' => date('Y-m-d H:i:s', strtotime('-30 days')),
    '90days' => date('Y-m-d H:i:s', strtotime('-90 days')),
    'all'    => '2000-01-01 00:00:00',
    default  => date('Y-m-d H:i:s', strtotime('-7 days')),
};

$pdo = dbPdo();
if ($pdo) {
    try {
        $where  = ['orcid = ?', 'created_at >= ?'];
        $params = [$orcid, $cutoff];
        if ($typeFilter !== 'all') { $where[] = 'activity_type = ?'; $params[] = $typeFilter; }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $total       = (int) $pdo->prepare("SELECT COUNT(*) FROM user_activity_log $whereClause")->execute($params) ? (int) $pdo->prepare("SELECT COUNT(*) FROM user_activity_log $whereClause")->execute($params) : 0;

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM user_activity_log $whereClause");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $dataStmt = $pdo->prepare(
            "SELECT id, activity_type AS type, category, target_id, title, metadata_json, created_at AS timestamp
             FROM user_activity_log $whereClause
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?"
        );
        $dataStmt->execute([...$params, $pageSize, $offset]);
        $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        $items = array_map(fn ($r) => [
            'id'        => $r['id'],
            'type'      => $r['type'],
            'category'  => $r['category'],
            'target_id' => $r['target_id'],
            'title'     => $r['title'],
            'metadata'  => $r['metadata_json'] ? json_decode($r['metadata_json'], true) : [],
            'timestamp' => $r['timestamp'],
        ], $rows);

        echo json_encode([
            'status'      => 'success',
            'total'       => $total,
            'page'        => $page,
            'total_pages' => (int) ceil($total / $pageSize),
            'data'        => $items,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    } catch (Exception $e) { /* fall through */ }
}

// File-based fallback
$file       = activityFile($orcid);
$activities = file_exists($file) ? (json_decode(file_get_contents($file), true) ?? []) : [];
$cutoffTs   = strtotime($cutoff);
$activities = array_values(array_filter($activities, function ($a) use ($cutoffTs, $typeFilter) {
    $ts = isset($a['timestamp']) ? strtotime($a['timestamp']) : 0;
    return $ts >= $cutoffTs && ($typeFilter === 'all' || ($a['type'] ?? '') === $typeFilter);
}));

echo json_encode([
    'status'      => 'success',
    'total'       => count($activities),
    'page'        => $page,
    'total_pages' => (int) ceil(count($activities) / $pageSize),
    'data'        => array_slice($activities, $offset, $pageSize),
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
