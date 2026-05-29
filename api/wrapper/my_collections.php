<?php
declare(strict_types=1);

/**
 * @file api/wrapper/my_collections.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief My Collections API
 * CRUD untuk user collections. DB-first, file-based fallback.
 * 
 * Endpoints:
 * GET    /api/my_collections.php?orcid=...&search=&privacy=all&sort=updated
 * POST   /api/my_collections.php { orcid, action:"create", name, description, privacy, tags }
 * POST   /api/my_collections.php { orcid, action:"update", id, name, description, privacy, tags }
 * POST   /api/my_collections.php { orcid, action:"delete", id }
 * POST   /api/my_collections.php { orcid, action:"add_item", collection_id, doi, title }
 * POST   /api/my_collections.php { orcid, action:"remove_item", collection_id, doi }
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

// ─── File-based fallback helpers ─────────────────────────────────────────────

function collFile(string $orcid): string
{
    $dir = ROOT_PATH . '/cache/user_collections';
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    return $dir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $orcid) . '.json';
}
function loadCollections(string $orcid): array
{
    $pdo = dbPdo();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare(
                'SELECT c.id, c.name, c.description, c.privacy, c.tags, c.item_count,
                        c.created_at, c.updated_at,
                        GROUP_CONCAT(ci.doi ORDER BY ci.added_at DESC) AS item_dois
                 FROM user_collections c
                 LEFT JOIN collection_items ci ON ci.collection_id = c.id
                 WHERE c.orcid = ?
                 GROUP BY c.id ORDER BY c.updated_at DESC'
            );
            $stmt->execute([$orcid]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map(fn ($r) => [
                'id'          => $r['id'],
                'name'        => $r['name'],
                'description' => $r['description'],
                'privacy'     => $r['privacy'],
                'tags'        => json_decode($r['tags'] ?? '[]', true) ?? [],
                'items'       => $r['item_dois'] ? explode(',', $r['item_dois']) : [],
                'itemCount'   => (int) $r['item_count'],
                'created_at'  => $r['created_at'],
                'updated_at'  => $r['updated_at'],
            ], $rows);
        } catch (Exception $e) { /* fall through */ }
    }

    $file = collFile($orcid);
    return file_exists($file) ? (json_decode(file_get_contents($file), true) ?? []) : [];
}
function saveCollections(string $orcid, array $colls): void
{
    @file_put_contents(collFile($orcid), json_encode(array_values($colls), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

// ─── Request routing ─────────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $body['action'] ?? 'create';
    $pdo    = dbPdo();

    switch ($action) {
        case 'create':
            $name     = substr(htmlspecialchars($body['name'] ?? 'Koleksi Baru', ENT_QUOTES), 0, 100);
            $desc     = substr(htmlspecialchars($body['description'] ?? '', ENT_QUOTES), 0, 500);
            $privacy  = in_array($body['privacy'] ?? 'private', ['public','private']) ? $body['privacy'] : 'private';
            $tags     = is_array($body['tags'] ?? null) ? $body['tags'] : explode(',', $body['tags'] ?? '');

            if ($pdo) {
                try {
                    $stmt = $pdo->prepare(
                        'INSERT INTO user_collections (orcid, name, description, privacy, tags) VALUES (?, ?, ?, ?, ?)'
                    );
                    $stmt->execute([$orcid, $name, $desc, $privacy, json_encode($tags)]);
                    $id = $pdo->lastInsertId();
                    echo json_encode(['status' => 'success', 'id' => $id]);
                    exit;
                } catch (Exception $e) { /* fall through */ }
            }

            // File-based fallback
            $colls   = loadCollections($orcid);
            $id      = uniqid('col_');
            $colls[] = compact('name', 'desc', 'privacy', 'tags') + [
                'id' => $id, 'items' => [], 'itemCount' => 0,
                'created_at' => date('c'), 'updated_at' => date('c'),
            ];
            saveCollections($orcid, $colls);
            echo json_encode(['status' => 'success', 'id' => $id]);
            break;

        case 'add_item':
            $collId = $body['collection_id'] ?? '';
            $doi    = strtolower(trim($body['doi'] ?? ''));
            if (!$collId || !$doi) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'collection_id dan doi diperlukan']);
                exit;
            }
            if ($pdo) {
                try {
                    $pdo->prepare(
                        'INSERT IGNORE INTO collection_items (collection_id, doi, item_type) VALUES (?, ?, ?)'
                    )->execute([(int)$collId, $doi, $body['item_type'] ?? 'article']);
                    $pdo->prepare(
                        'UPDATE user_collections SET item_count = (SELECT COUNT(*) FROM collection_items WHERE collection_id = ?), updated_at = NOW() WHERE id = ?'
                    )->execute([(int)$collId, (int)$collId]);
                    echo json_encode(['status' => 'success']);
                    exit;
                } catch (Exception $e) { /* fall through */ }
            }
            echo json_encode(['status' => 'error', 'message' => 'DB unavailable']);
            break;

        case 'remove_item':
            $collId = $body['collection_id'] ?? '';
            $doi    = strtolower(trim($body['doi'] ?? ''));
            if ($pdo) {
                try {
                    $pdo->prepare('DELETE FROM collection_items WHERE collection_id = ? AND doi = ?')->execute([(int)$collId, $doi]);
                    $pdo->prepare(
                        'UPDATE user_collections SET item_count = (SELECT COUNT(*) FROM collection_items WHERE collection_id = ?), updated_at = NOW() WHERE id = ?'
                    )->execute([(int)$collId, (int)$collId]);
                    echo json_encode(['status' => 'success']);
                    exit;
                } catch (Exception $e) { /* fall through */ }
            }
            echo json_encode(['status' => 'error', 'message' => 'DB unavailable']);
            break;

        case 'delete':
            $id = $body['id'] ?? '';
            if ($pdo) {
                try {
                    $pdo->prepare('DELETE FROM user_collections WHERE id = ? AND orcid = ?')->execute([(int)$id, $orcid]);
                    echo json_encode(['status' => 'success']);
                    exit;
                } catch (Exception $e) { /* fall through */ }
            }
            echo json_encode(['status' => 'error', 'message' => 'DB unavailable']);
            break;

        case 'update':
            $id      = $body['id'] ?? '';
            $updates = [];
            $params  = [];
            if (isset($body['name']))        { $updates[] = 'name = ?';        $params[] = substr(htmlspecialchars($body['name'], ENT_QUOTES), 0, 100); }
            if (isset($body['description'])) { $updates[] = 'description = ?'; $params[] = substr(htmlspecialchars($body['description'], ENT_QUOTES), 0, 500); }
            if (isset($body['privacy']) && in_array($body['privacy'], ['public','private'])) { $updates[] = 'privacy = ?'; $params[] = $body['privacy']; }
            if (isset($body['tags']))        { $updates[] = 'tags = ?';        $params[] = json_encode(is_array($body['tags']) ? $body['tags'] : explode(',', $body['tags'])); }

            if ($pdo && $updates) {
                try {
                    $params[] = (int) $id;
                    $params[] = $orcid;
                    $pdo->prepare('UPDATE user_collections SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ? AND orcid = ?')->execute($params);
                    echo json_encode(['status' => 'success']);
                    exit;
                } catch (Exception $e) { /* fall through */ }
            }
            echo json_encode(['status' => 'error', 'message' => 'DB unavailable']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => "Action tidak dikenali: $action"]);
    }
    exit;
}

// ─── GET: list collections ───────────────────────────────────────────────────

$search  = trim($_GET['search'] ?? '');
$privacy = $_GET['privacy'] ?? 'all';
$sort    = in_array($_GET['sort'] ?? 'updated', ['updated', 'created', 'name']) ? ($_GET['sort'] ?? 'updated') : 'updated';

$colls = loadCollections($orcid);

if ($search) {
    $colls = array_values(array_filter($colls, fn ($c) => stripos($c['name'], $search) !== false));
}
if ($privacy !== 'all') {
    $colls = array_values(array_filter($colls, fn ($c) => ($c['privacy'] ?? '') === $privacy));
}
usort($colls, fn ($a, $b) => match ($sort) {
    'name'    => strcmp($a['name'], $b['name']),
    'created' => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''),
    default   => strcmp($b['updated_at'] ?? '', $a['updated_at'] ?? ''),
});

echo json_encode([
    'status' => 'success',
    'total'  => count($colls),
    'data'   => $colls,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
