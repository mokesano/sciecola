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
 * Endpoints (selalu untuk akun yang login; parameter orcid diabaikan):
 * GET  /api/my_activity.php?range=7days&type=all&category=all&search=&sort=newest&page=1&limit=20
 *      range: today|7days|30days|90days|3months|year|all
 *      type : all | daftar dipisah koma (viewed,saved,searched,... ; alias view,bookmark,search,...)
 *      -> { status, total, page, total_pages, data, activities, summary, summary_prev, range }
 * POST /api/my_activity.php { type, category, title, target_id, metadata:{} }
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

$body  = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? $_POST;
}

// Data pribadi: selalu milik akun yang login (orcid dari permintaan diabaikan).
$orcid = \Sciecola\Auth\UserAuth::requireOrcid();

function dbPdo(): ?PDO
{
    try { return \Sciecola\Database\Db::pdo(); } catch (Throwable $e) { return null; }
}

const ACTIVITY_TYPES = ['viewed','saved','downloaded','searched','analyzed','shared','commented','exported','updated','collaborated'];
const ACTIVITY_ALIASES = [
    'view' => 'viewed', 'bookmark' => 'saved', 'save' => 'saved', 'download' => 'downloaded',
    'search' => 'searched', 'analysis' => 'analyzed', 'share' => 'shared', 'comment' => 'commented',
];
const ACTIVITY_CATEGORIES = ['article','journal','researcher','institution','sdg','search','collection','system','other'];

function normType(string $t): ?string
{
    $t = strtolower(trim($t));
    $t = ACTIVITY_ALIASES[$t] ?? $t;
    return in_array($t, ACTIVITY_TYPES, true) ? $t : null;
}

function activityFile(string $orcid): string
{
    $dir = ROOT_PATH . '/cache/user_activity';
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    return $dir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $orcid) . '.json';
}

// ─── POST: record activity ────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $type     = normType((string) ($body['type'] ?? '')) ?? 'viewed';
    $category = in_array($body['category'] ?? '', ACTIVITY_CATEGORIES, true) ? $body['category'] : 'other';
    // Disimpan apa adanya (tanpa HTML); React yang melakukan escaping saat ditampilkan.
    $title    = mb_substr(trim(strip_tags((string) ($body['title'] ?? ''))), 0, 300);
    $targetId = mb_substr(trim((string) ($body['target_id'] ?? $body['target'] ?? '')), 0, 512);
    $metadata = is_array($body['metadata'] ?? null) ? $body['metadata'] : [];

    $pdo = dbPdo();
    if ($pdo) {
        try {
            // Hindari duplikasi: kunjungan/pencarian yang sama dalam 30 menit dicatat sekali.
            if (in_array($type, ['viewed', 'searched'], true) && $targetId !== '') {
                $dup = $pdo->prepare('SELECT COUNT(*) FROM user_activity_log WHERE orcid = ? AND activity_type = ? AND target_id = ? AND created_at >= ?');
                $dup->execute([$orcid, $type, $targetId, date('Y-m-d H:i:s', time() - 1800)]);
                if ((int) $dup->fetchColumn() > 0) { echo json_encode(['status' => 'success', 'deduplicated' => true]); exit; }
            }
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
    if (in_array($type, ['viewed', 'searched'], true) && $targetId !== '') {
        foreach (array_slice($activities, 0, 50) as $a) {
            if (($a['type'] ?? '') === $type && ($a['target_id'] ?? '') === $targetId
                && strtotime($a['timestamp'] ?? '') >= time() - 1800) {
                echo json_encode(['status' => 'success', 'deduplicated' => true]); exit;
            }
        }
    }
    array_unshift($activities, $event);
    $activities = array_slice($activities, 0, 1000);
    @file_put_contents($file, json_encode($activities, JSON_UNESCAPED_UNICODE));
    echo json_encode(['status' => 'success']);
    exit;
}

// ─── GET: retrieve activity ───────────────────────────────────────────────────
// Catatan: baris DB (user_activity_log) dan cadangan file digabung. Cadangan file
// terpakai bila insert DB gagal (mis. ORCID belum ada di tabel researchers, FK).

$page     = max(1, (int) ($_GET['page'] ?? 1));
$pageSize = min(100, max(1, (int) ($_GET['limit'] ?? $_GET['page_size'] ?? 20)));
$rangeStr = trim((string) ($_GET['range'] ?? '7days'));
$sort     = ($_GET['sort'] ?? 'newest') === 'oldest' ? 'oldest' : 'newest';
$search   = mb_strtolower(trim((string) ($_GET['search'] ?? '')));

$types = [];
foreach (explode(',', (string) ($_GET['type'] ?? 'all')) as $t) {
    if (($n = normType($t)) !== null) $types[] = $n;
}
$cats = array_values(array_intersect(
    array_map('trim', explode(',', strtolower((string) ($_GET['category'] ?? 'all')))),
    ACTIVITY_CATEGORIES
));

$now = time();
[$from, $prevFrom] = match ($rangeStr) {
    'today'           => [strtotime('today'), strtotime('yesterday')],
    '30days'          => [$now - 30 * 86400, $now - 60 * 86400],
    '90days','3months'=> [$now - 90 * 86400, $now - 180 * 86400],
    'year'            => [strtotime(date('Y') . '-01-01'), strtotime((date('Y') - 1) . '-01-01')],
    'all'             => [0, null],
    default           => [$now - 7 * 86400, $now - 14 * 86400],
};
if ($rangeStr === 'year') {
    // Pembanding: periode yang sama tahun lalu (1 Jan s.d. tanggal ini).
    $prevTo = strtotime('-1 year', $now);
} else {
    $prevTo = $from;
}

/** Semua aktivitas akun ini sejak $since (DB + file), terbaru dahulu. */
function loadActivities(string $orcid, int $since): array
{
    $items = [];
    $pdo = dbPdo();
    if ($pdo) {
        try {
            $st = $pdo->prepare(
                'SELECT id, activity_type, category, target_id, title, metadata_json, created_at
                 FROM user_activity_log WHERE orcid = ? AND created_at >= ?
                 ORDER BY created_at DESC LIMIT 5000'
            );
            $st->execute([$orcid, date('Y-m-d H:i:s', $since)]);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $items[] = [
                    'id'        => 'db_' . $r['id'],
                    'type'      => $r['activity_type'],
                    'category'  => $r['category'],
                    'target_id' => $r['target_id'],
                    'title'     => $r['title'],
                    'metadata'  => $r['metadata_json'] ? (json_decode($r['metadata_json'], true) ?: []) : [],
                    'timestamp' => date('c', strtotime($r['created_at'])),
                ];
            }
        } catch (Throwable $e) { /* tabel belum ada: lanjut ke file */ }
    }
    $file = activityFile($orcid);
    if (file_exists($file)) {
        foreach (json_decode((string) file_get_contents($file), true) ?: [] as $a) {
            $ts = strtotime($a['timestamp'] ?? '') ?: 0;
            if ($ts < $since) continue;
            $items[] = [
                'id'        => (string) ($a['id'] ?? uniqid('act_')),
                'type'      => (string) ($a['type'] ?? 'viewed'),
                'category'  => (string) ($a['category'] ?? 'other'),
                'target_id' => $a['target_id'] ?? null,
                'title'     => $a['title'] ?? null,
                'metadata'  => is_array($a['metadata'] ?? null) ? $a['metadata'] : [],
                'timestamp' => date('c', $ts),
            ];
        }
    }
    usort($items, fn ($x, $y) => strcmp($y['timestamp'], $x['timestamp']));
    return $items;
}

$all = loadActivities($orcid, $prevFrom ?? $from);

$summary = array_fill_keys(ACTIVITY_TYPES, 0);
$prev    = $prevFrom === null ? null : array_fill_keys(ACTIVITY_TYPES, 0);
$inRange = [];
foreach ($all as $a) {
    $ts = strtotime($a['timestamp']);
    if ($ts >= $from) {
        if (isset($summary[$a['type']])) $summary[$a['type']]++;
        $inRange[] = $a;
    } elseif ($prev !== null && $ts >= $prevFrom && $ts < $prevTo && isset($prev[$a['type']])) {
        $prev[$a['type']]++;
    }
}
$summary['total'] = array_sum($summary);
if ($prev !== null) $prev['total'] = array_sum($prev);

$filtered = array_values(array_filter($inRange, function ($a) use ($types, $cats, $search) {
    if ($types && !in_array($a['type'], $types, true)) return false;
    if ($cats && !in_array($a['category'], $cats, true)) return false;
    if ($search !== '') {
        $hay = mb_strtolower(($a['title'] ?? '') . ' ' . ($a['target_id'] ?? ''));
        if (!str_contains($hay, $search)) return false;
    }
    return true;
}));
if ($sort === 'oldest') $filtered = array_reverse($filtered);

$total = count($filtered);
$items = array_slice($filtered, ($page - 1) * $pageSize, $pageSize);
foreach ($items as &$it) { $it['target'] = $it['target_id']; }
unset($it);

echo json_encode([
    'status'       => 'success',
    'total'        => $total,
    'page'         => $page,
    'total_pages'  => (int) ceil($total / $pageSize),
    'data'         => $items,
    'activities'   => $items,
    'summary'      => $summary,
    'summary_prev' => $prev,   // null untuk rentang "all"
    'range'        => $rangeStr,
], JSON_UNESCAPED_UNICODE);
