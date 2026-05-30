<?php
declare(strict_types=1);

/**
 * @file api/wrapper/cache_handler.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Cache Handler API - Manages caching logic for API responses.
 * Prioritizes: Cache Folder → Database → External API → Queue
 * 
 * Endpoints:
 * GET  /api/cache_handler.php?type=orcid&identifier=0000-0002-5152-9727
 * GET  /api/cache_handler.php?type=doi&identifier=10.1234/...
 * POST /api/cache_handler.php { action:"sync", type:"orcid", limit:10 }
 * GET  /api/cache_handler.php?action=status&type=orcid
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

$body = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? $_POST;
}

$action     = $body['action'] ?? $_GET['action'] ?? 'fetch';
$type       = $body['type']   ?? $_GET['type']   ?? null;
$identifier = $body['identifier'] ?? $_GET['identifier'] ?? null;

if (!$type) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Parameter type diperlukan (orcid|doi)']);
    exit;
}

switch ($action) {
    case 'fetch':
        if (!$identifier) { http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Parameter identifier diperlukan']); exit; }
        echo json_encode(['status' => 'success', 'data' => fetchWithCachePriority($type, $identifier)]);
        break;

    case 'sync':
        $limit = (int)($body['limit'] ?? 10);
        echo json_encode(['status' => 'success', 'synced' => syncCacheToDatabase($type, $limit)]);
        break;

    case 'status':
        echo json_encode(['status' => 'success', 'cache' => getCacheStatus($type)]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Action tidak dikenali: $action"]);
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getCacheFilePath(string $type, string $identifier): string
{
    $cacheDir = ROOT_PATH . '/cache';
    if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);
    return $cacheDir . '/' . $type . '_' . preg_replace('/[^a-z0-9_-]/i', '_', $identifier) . '.json';
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
    } catch (Exception $e) {
        return null;
    }
}

function fetchWithCachePriority(string $type, string $identifier): array
{
    // Step 1: cache folder (fastest)
    $cacheFile = getCacheFilePath($type, $identifier);
    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && isset($cached['cached_at']) && (time() - strtotime($cached['cached_at'])) < 604800) {
            $cached['_source'] = 'cache_folder';
            return $cached;
        }
    }

    // Step 2: database
    $pdo = dbPdo();
    if ($pdo) {
        $dbData = fetchFromDatabase($pdo, $type, $identifier);
        if ($dbData) {
            $dbData['_source'] = 'database';
            return $dbData;
        }
    }

    // Step 3: external API
    $apiData = fetchFromExternalAPI($type, $identifier);
    if ($apiData) {
        $apiData['_source']   = 'api';
        $apiData['cached_at'] = date('c');
        saveToCacheFolder($type, $identifier, $apiData);
        enqueueToDatabase($type, $identifier, $apiData);
        return $apiData;
    }

    throw new Exception("Data tidak ditemukan untuk $type: $identifier");
}

function fetchFromDatabase(PDO $pdo, string $type, string $identifier): ?array
{
    try {
        if ($type === 'orcid') {
            $stmt = $pdo->prepare(
                'SELECT profile_cache_json FROM researchers WHERE orcid = ? AND cache_expires_at > NOW()'
            );
            $stmt->execute([$identifier]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ? json_decode($row['profile_cache_json'], true) : null;

        } elseif ($type === 'doi') {
            $stmt = $pdo->prepare(
                'SELECT raw_data_json FROM publications WHERE doi = ?'
            );
            $stmt->execute([strtolower(trim($identifier))]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return ($row && !empty($row['raw_data_json'])) ? json_decode($row['raw_data_json'], true) : null;
        }
    } catch (Exception $e) {
        return null;
    }
    return null;
}

function fetchFromExternalAPI(string $type, string $identifier): ?array
{
    // Placeholder — production calls ORCID/Crossref via sangia-apis
    return null;
}

function saveToCacheFolder(string $type, string $identifier, array $data): void
{
    @file_put_contents(getCacheFilePath($type, $identifier), json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function enqueueToDatabase(string $type, string $identifier, array $data): string
{
    $queueFile = ROOT_PATH . '/cache/crawl_queue.json';
    $queue     = file_exists($queueFile) ? (json_decode(file_get_contents($queueFile), true) ?? []) : [];
    $jobId     = uniqid('job_');
    $queue[$jobId] = [
        'id'           => $jobId,
        'type'         => $type,
        'identifier'   => $identifier,
        'status'       => 'pending',
        'cached_data'  => $data,
        'created_at'   => date('c'),
        'attempts'     => 0,
        'max_attempts' => 3,
    ];
    @file_put_contents($queueFile, json_encode($queue, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    return $jobId;
}

function syncCacheToDatabase(string $type, int $limit): int
{
    $pdo = dbPdo();
    if (!$pdo) return 0;

    $cacheDir = ROOT_PATH . '/cache';
    $files    = glob("$cacheDir/{$type}_*.json") ?: [];
    $synced   = 0;

    foreach (array_slice($files, 0, $limit) as $cacheFile) {
        $data = json_decode(file_get_contents($cacheFile), true);
        if (!$data) continue;

        try {
            if ($type === 'orcid' && !empty($data['orcid_id'])) {
                $stmt = $pdo->prepare(
                    'INSERT INTO researchers (orcid, name, profile_cache_json, cache_expires_at, updated_at)
                     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())
                     ON DUPLICATE KEY UPDATE profile_cache_json = VALUES(profile_cache_json),
                                             cache_expires_at   = VALUES(cache_expires_at),
                                             updated_at         = NOW()'
                );
                $stmt->execute([$data['orcid_id'], $data['name'] ?? $data['orcid_id'], json_encode($data)]);

            } elseif ($type === 'doi' && !empty($data['doi'])) {
                $doi   = strtolower(trim($data['doi']));
                $title = is_array($data['title'] ?? '') ? ($data['title'][0] ?? $doi) : ($data['title'] ?? $doi);
                $stmt  = $pdo->prepare(
                    'INSERT INTO publications (doi, title, raw_data_json, updated_at)
                     VALUES (?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE raw_data_json = VALUES(raw_data_json),
                                             updated_at    = NOW()'
                );
                $stmt->execute([$doi, $title, json_encode($data)]);
            }

            @unlink($cacheFile);
            $synced++;
        } catch (Exception $e) {
            // continue with next file
        }
    }

    return $synced;
}

function getCacheStatus(string $type): array
{
    $cacheDir = ROOT_PATH . '/cache';
    $files    = glob("$cacheDir/{$type}_*.json") ?: [];
    $total    = count($files);
    $size     = array_sum(array_map('filesize', $files));

    return [
        'type'          => $type,
        'cache_dir'     => $cacheDir,
        'total_files'   => $total,
        'total_size_kb' => round($size / 1024, 2),
    ];
}
