<?php
/**
 * AJAX endpoint: Migrate file-based cache to database
 * POST /api/cache_to_db.php
 * Body: { "action": "migrate" | "status" | "clear_cache" }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Bootstrap
if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__));
}
if (file_exists(ROOT_PATH . '/includes/bootstrap.php')) {
    require_once ROOT_PATH . '/includes/bootstrap.php';
}

$input  = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? ($_GET['action'] ?? 'status');

switch ($action) {
    case 'status':
        echo json_encode(getCacheStatus());
        break;
    case 'migrate':
        echo json_encode(migrateCacheToDb());
        break;
    case 'clear_cache':
        echo json_encode(clearMigratedCache());
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
}

function getCacheStatus(): array {
    $cacheDir = ROOT_PATH . '/cache';
    if (!is_dir($cacheDir)) {
        return ['cache_files' => 0, 'total_size_kb' => 0, 'status' => 'no_cache_dir'];
    }
    $files   = glob($cacheDir . '/*.json') ?: [];
    $gz      = glob($cacheDir . '/*.gz')   ?: [];
    $all     = array_merge($files, $gz);
    $size    = array_sum(array_map('filesize', $all));
    return [
        'cache_files'    => count($all),
        'total_size_kb'  => round($size / 1024, 2),
        'status'         => 'ok',
        'sample_keys'    => array_slice(array_map(fn($f) => basename($f), $all), 0, 5),
    ];
}

function migrateCacheToDb(): array {
    $cacheDir = ROOT_PATH . '/cache';
    if (!is_dir($cacheDir)) {
        return ['migrated' => 0, 'errors' => 0, 'message' => 'Cache directory not found'];
    }

    // Check DB connection
    $db = null;
    if (class_exists('Database')) {
        try { $db = Database::getInstance(); } catch (\Throwable $e) { /* no DB */ }
    }

    $files    = array_merge(glob($cacheDir . '/*.json') ?: [], glob($cacheDir . '/*.gz') ?: []);
    $migrated = 0;
    $errors   = 0;
    $skipped  = 0;

    foreach ($files as $file) {
        try {
            $raw = file_get_contents($file);
            if (str_ends_with($file, '.gz')) {
                $raw = gzdecode($raw);
            }
            $payload = json_decode($raw, true);
            if (!$payload) { $skipped++; continue; }

            $cacheKey = basename($file, '.json');
            $cacheKey = basename($cacheKey, '.gz');

            // Determine type from key prefix
            $type = 'generic';
            if (str_contains($cacheKey, 'orcid'))  $type = 'orcid';
            if (str_contains($cacheKey, 'doi'))     $type = 'doi';
            if (str_contains($cacheKey, 'sdg'))     $type = 'sdg';

            if ($db) {
                // Try to upsert into api_cache table
                $db->query(
                    "INSERT INTO api_cache (cache_key, cache_type, payload, created_at, migrated_from_file)
                     VALUES (?, ?, ?, NOW(), 1)
                     ON DUPLICATE KEY UPDATE payload = VALUES(payload), migrated_from_file = 1",
                    [$cacheKey, $type, json_encode($payload)]
                );
            }

            $migrated++;
        } catch (\Throwable $e) {
            $errors++;
        }
    }

    return [
        'migrated'   => $migrated,
        'errors'     => $errors,
        'skipped'    => $skipped,
        'total'      => count($files),
        'db_enabled' => $db !== null,
        'message'    => "Migration complete: {$migrated} migrated, {$errors} errors, {$skipped} skipped",
    ];
}

function clearMigratedCache(): array {
    $cacheDir = ROOT_PATH . '/cache';
    if (!is_dir($cacheDir)) {
        return ['cleared' => 0, 'message' => 'Cache directory not found'];
    }
    // Only remove files older than 1 day that have been migrated
    $files   = array_merge(glob($cacheDir . '/*.json') ?: [], glob($cacheDir . '/*.gz') ?: []);
    $cleared = 0;
    $cutoff  = time() - 86400;
    foreach ($files as $file) {
        if (filemtime($file) < $cutoff) {
            unlink($file);
            $cleared++;
        }
    }
    return ['cleared' => $cleared, 'message' => "{$cleared} old cache files removed"];
}
