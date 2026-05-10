<?php
/**
 * My Collections API
 * CRUD for user article collections (file-based per ORCID).
 *
 * GET    /api/my_collections.php?orcid=...&search=&privacy=all&sort=updated
 * POST   /api/my_collections.php { orcid, action:"create", name, description, privacy, tags }
 * POST   /api/my_collections.php { orcid, action:"update", id, name, description, privacy, tags }
 * POST   /api/my_collections.php { orcid, action:"delete", id }
 * POST   /api/my_collections.php { orcid, action:"add_item", collection_id, doi, title }
 * POST   /api/my_collections.php { orcid, action:"remove_item", collection_id, doi }
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

$collDir  = ROOT_PATH . '/cache/user_collections';
if (!is_dir($collDir)) @mkdir($collDir, 0750, true);
$collFile = $collDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $orcid) . '.json';

function loadCollections(string $file): array {
    if (!file_exists($file)) return [];
    return json_decode(file_get_contents($file), true) ?? [];
}
function saveCollections(string $file, array $colls): void {
    file_put_contents($file, json_encode(array_values($colls), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $body['action'] ?? 'create';
    $colls  = loadCollections($collFile);

    switch ($action) {
        case 'create':
            $id = uniqid('col_');
            $colls[] = [
                'id'          => $id,
                'name'        => substr(htmlspecialchars($body['name'] ?? 'Koleksi Baru', ENT_QUOTES), 0, 100),
                'description' => substr(htmlspecialchars($body['description'] ?? '', ENT_QUOTES), 0, 500),
                'privacy'     => in_array($body['privacy'] ?? 'private', ['public','private']) ? $body['privacy'] : 'private',
                'tags'        => is_array($body['tags'] ?? null) ? $body['tags'] : explode(',', $body['tags'] ?? ''),
                'items'       => [],
                'itemCount'   => 0,
                'created_at'  => date('c'),
                'updated_at'  => date('c'),
            ];
            saveCollections($collFile, $colls);
            echo json_encode(['status' => 'success', 'id' => $id]);
            break;

        case 'update':
            $id = $body['id'] ?? '';
            $colls = array_map(function($c) use ($id, $body) {
                if ($c['id'] !== $id) return $c;
                if (isset($body['name'])) $c['name'] = substr(htmlspecialchars($body['name'], ENT_QUOTES), 0, 100);
                if (isset($body['description'])) $c['description'] = substr(htmlspecialchars($body['description'], ENT_QUOTES), 0, 500);
                if (isset($body['privacy']) && in_array($body['privacy'], ['public','private'])) $c['privacy'] = $body['privacy'];
                if (isset($body['tags'])) $c['tags'] = is_array($body['tags']) ? $body['tags'] : explode(',', $body['tags']);
                $c['updated_at'] = date('c');
                return $c;
            }, $colls);
            saveCollections($collFile, $colls);
            echo json_encode(['status' => 'success']);
            break;

        case 'delete':
            $id    = $body['id'] ?? '';
            $colls = array_filter($colls, fn($c) => $c['id'] !== $id);
            saveCollections($collFile, $colls);
            echo json_encode(['status' => 'success']);
            break;

        case 'add_item':
            $cid  = $body['collection_id'] ?? '';
            $doi  = $body['doi'] ?? '';
            $colls = array_map(function($c) use ($cid, $doi, $body) {
                if ($c['id'] !== $cid) return $c;
                $item = ['doi' => $doi, 'title' => $body['title'] ?? $doi, 'added_at' => date('c')];
                $exists = array_filter($c['items'] ?? [], fn($i) => $i['doi'] === $doi);
                if (!$exists) {
                    $c['items'][] = $item;
                    $c['itemCount'] = count($c['items']);
                    $c['updated_at'] = date('c');
                }
                return $c;
            }, $colls);
            saveCollections($collFile, $colls);
            echo json_encode(['status' => 'success']);
            break;

        case 'remove_item':
            $cid  = $body['collection_id'] ?? '';
            $doi  = $body['doi'] ?? '';
            $colls = array_map(function($c) use ($cid, $doi) {
                if ($c['id'] !== $cid) return $c;
                $c['items']     = array_values(array_filter($c['items'] ?? [], fn($i) => $i['doi'] !== $doi));
                $c['itemCount'] = count($c['items']);
                $c['updated_at'] = date('c');
                return $c;
            }, $colls);
            saveCollections($collFile, $colls);
            echo json_encode(['status' => 'success']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => "Action tidak dikenali: $action"]);
    }
    exit;
}

// ── GET: list collections ────────────────────────────────────────────────────

$search  = strtolower(trim($_GET['search'] ?? ''));
$privacy = $_GET['privacy'] ?? 'all';
$sortBy  = $_GET['sort'] ?? 'updated';

$colls = loadCollections($collFile);

if ($search) {
    $colls = array_filter($colls, fn($c) =>
        str_contains(strtolower($c['name'] ?? ''), $search) ||
        str_contains(strtolower($c['description'] ?? ''), $search)
    );
}
if ($privacy !== 'all') {
    $colls = array_filter($colls, fn($c) => ($c['privacy'] ?? 'private') === $privacy);
}

usort($colls, function($a, $b) use ($sortBy) {
    if ($sortBy === 'name') return strcmp($a['name'] ?? '', $b['name'] ?? '');
    if ($sortBy === 'items') return ($b['itemCount'] ?? 0) <=> ($a['itemCount'] ?? 0);
    return strcmp($b['updated_at'] ?? '', $a['updated_at'] ?? ''); // newest updated first
});

echo json_encode([
    'status'      => 'success',
    'orcid'       => $orcid,
    'total'       => count($colls),
    'collections' => array_values($colls),
], JSON_UNESCAPED_UNICODE);
