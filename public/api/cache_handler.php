<?php
/**
 * Cache Handler API
 * Prioritizes: Cache Folder → API Fetch → Temporary Cache → Queue
 *
 * GET /api/cache_handler.php?type=orcid&identifier=0000-0002-5152-9727
 * GET /api/cache_handler.php?type=doi&identifier=10.1234/...
 * POST /api/cache_handler.php { action: "sync", type: "orcid", limit: 10 }
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) {
        define('ROOT_PATH', dirname(__DIR__) . '/..');
    }
    if (file_exists(ROOT_PATH . '/includes/config.php')) {
        require_once ROOT_PATH . '/includes/config.php';
    }

    $action = $_GET['action'] ?? $_POST['action'] ?? 'fetch';
    $type   = $_GET['type'] ?? $_POST['type'] ?? null;
    $identifier = $_GET['identifier'] ?? $_POST['identifier'] ?? null;

    if (!$type) {
        throw new Exception('Parameter type diperlukan (orcid|doi)');
    }

    switch ($action) {
        case 'fetch':
            if (!$identifier) throw new Exception('Parameter identifier diperlukan');
            $data = fetchWithCachePriority($type, $identifier);
            http_response_code(200);
            echo json_encode(['status' => 'success', 'data' => $data]);
            break;

        case 'sync':
            $limit = (int)($_POST['limit'] ?? 10);
            $result = syncCacheToDatabase($type, $limit);
            http_response_code(200);
            echo json_encode(['status' => 'success', 'synced' => $result]);
            break;

        case 'status':
            $status = getCacheStatus($type);
            http_response_code(200);
            echo json_encode(['status' => 'success', 'cache' => $status]);
            break;

        default:
            throw new Exception("Action tidak dikenali: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ============================================================================

function fetchWithCachePriority($type, $identifier) {
    // Step 1: Cek cache folder dulu (fastest)
    $cacheFile = getCacheFilePath($type, $identifier);
    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && isset($cached['cached_at'])) {
            // Check if cache still valid (7 days default)
            if (time() - strtotime($cached['cached_at']) < 604800) {
                $cached['_source'] = 'cache_folder';
                return $cached;
            }
        }
    }

    // Step 2: Check database (if available)
    if (defined('DB_HOST') && DB_HOST) {
        $dbData = fetchFromDatabase($type, $identifier);
        if ($dbData) {
            $dbData['_source'] = 'database';
            return $dbData;
        }
    }

    // Step 3: Fetch from external API
    $apiData = fetchFromExternalAPI($type, $identifier);
    if ($apiData) {
        $apiData['_source'] = 'api';
        $apiData['cached_at'] = date('c');

        // Step 4: Save to cache folder (temporary until moved to DB)
        saveToCacheFolder($type, $identifier, $apiData);

        // Step 5: Enqueue to database via crawl queue
        enqueueToDatabase($type, $identifier, $apiData);

        return $apiData;
    }

    throw new Exception("Data tidak ditemukan untuk $type: $identifier");
}

function getCacheFilePath($type, $identifier) {
    $cacheDir = dirname(__DIR__) . '/../cache';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }

    $filename = $type . '_' . preg_replace('/[^a-z0-9_-]/i', '_', $identifier) . '.json';
    return $cacheDir . '/' . $filename;
}

function fetchFromDatabase($type, $identifier) {
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        if ($type === 'orcid') {
            $stmt = $pdo->prepare(
                "SELECT profile_json FROM orcid_profiles WHERE orcid_id = ? AND expires_at > NOW()"
            );
            $stmt->execute([$identifier]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ? json_decode($row['profile_json'], true) : null;
        } elseif ($type === 'doi') {
            $stmt = $pdo->prepare(
                "SELECT result_json FROM doi_results WHERE doi = ? AND expires_at > NOW()"
            );
            $stmt->execute([$identifier]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ? json_decode($row['result_json'], true) : null;
        }
    } catch (Exception $e) {
        return null;
    }
    return null;
}

function fetchFromExternalAPI($type, $identifier) {
    if ($type === 'orcid') {
        return fetchORCIDAPI($identifier);
    } elseif ($type === 'doi') {
        return fetchDOIAPI($identifier);
    }
    return null;
}

function fetchORCIDAPI($orcid) {
    // Placeholder untuk ORCID API fetch
    // Dalam production, panggil actual ORCID API dan Wizdam APIs
    return [
        'orcid_id' => $orcid,
        'name' => 'Researcher Name',
        'affiliation' => 'Institution',
        'works_count' => 0,
        'citations' => 0,
        'h_index' => 0,
    ];
}

function fetchDOIAPI($doi) {
    // Placeholder untuk DOI/Crossref API fetch
    // Dalam production, panggil Crossref dan SDG Classification API
    return [
        'doi' => $doi,
        'title' => 'Article Title',
        'authors' => [],
        'sdgs' => [],
        'citations' => 0,
    ];
}

function saveToCacheFolder($type, $identifier, $data) {
    $cacheFile = getCacheFilePath($type, $identifier);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    @file_put_contents($cacheFile, $json);
}

function enqueueToDatabase($type, $identifier, $data) {
    // Add to crawl_queue untuk diproses nanti
    $queueFile = dirname(__DIR__) . '/../cache/crawl_queue.json';
    $queue = [];

    if (file_exists($queueFile)) {
        $queue = json_decode(file_get_contents($queueFile), true) ?? [];
    }

    $jobId = uniqid('job_');
    $queue[$jobId] = [
        'id' => $jobId,
        'type' => $type,
        'identifier' => $identifier,
        'status' => 'pending',
        'cached_data' => $data,
        'created_at' => date('c'),
        'attempts' => 0,
        'max_attempts' => 3,
    ];

    @file_put_contents($queueFile, json_encode($queue, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    return $jobId;
}

function syncCacheToDatabase($type, $limit) {
    if (!defined('DB_HOST') || !DB_HOST) {
        return 0;
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $cacheDir = dirname(__DIR__) . '/../cache';
        $pattern = $type . '_*.json';
        $files = glob("$cacheDir/$pattern");
        $synced = 0;

        foreach (array_slice($files, 0, $limit) as $cacheFile) {
            $data = json_decode(file_get_contents($cacheFile), true);
            if (!$data) continue;

            if ($type === 'orcid') {
                $stmt = $pdo->prepare(
                    "INSERT INTO orcid_profiles (orcid_id, profile_json, expires_at, updated_at)
                     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())
                     ON DUPLICATE KEY UPDATE profile_json = VALUES(profile_json), expires_at = VALUES(expires_at)"
                );
                $stmt->execute([$data['orcid_id'] ?? '', json_encode($data)]);
            } elseif ($type === 'doi') {
                $stmt = $pdo->prepare(
                    "INSERT INTO doi_results (doi, result_json, expires_at, updated_at)
                     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())
                     ON DUPLICATE KEY UPDATE result_json = VALUES(result_json), expires_at = VALUES(expires_at)"
                );
                $stmt->execute([$data['doi'] ?? '', json_encode($data)]);
            }

            @unlink($cacheFile); // Delete cache file after syncing
            $synced++;
        }

        return $synced;
    } catch (Exception $e) {
        return 0;
    }
}

function getCacheStatus($type) {
    $cacheDir = dirname(__DIR__) . '/../cache';
    $pattern = $type ? "$type*.json" : '*.json';
    $files = glob("$cacheDir/$pattern") ?: [];

    $total = count($files);
    $totalSize = array_sum(array_map('filesize', $files));
    $oldestFile = null;
    $newestFile = null;

    if ($files) {
        usort($files, function($a, $b) { return filemtime($a) - filemtime($b); });
        $oldestFile = filemtime($files[0]);
        $newestFile = filemtime($files[count($files) - 1]);
    }

    return [
        'type' => $type ?: 'all',
        'cache_dir' => $cacheDir,
        'total_files' => $total,
        'total_size_kb' => round($totalSize / 1024, 2),
        'oldest_file' => $oldestFile ? date('c', $oldestFile) : null,
        'newest_file' => $newestFile ? date('c', $newestFile) : null,
    ];
}
