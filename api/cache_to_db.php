<?php
declare(strict_types=1);

/**
 * AJAX endpoint: Migrate file-based cache to database
 * POST /api/cache_to_db.php
 * Body: { "action": "migrate" | "status" | "clear_cache" }
 *
 * Migrates to: ecosystem_cache, researchers, publications
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__));
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

function getCacheStatus(): array
{
    $cacheDir = ROOT_PATH . '/cache';
    if (!is_dir($cacheDir)) return ['cache_files' => 0, 'total_size_kb' => 0, 'status' => 'no_cache_dir'];
    $files = array_merge(glob($cacheDir . '/*.json') ?: [], glob($cacheDir . '/*.gz') ?: []);
    return [
        'cache_files'   => count($files),
        'total_size_kb' => round(array_sum(array_map('filesize', $files)) / 1024, 2),
        'status'        => 'ok',
        'sample_keys'   => array_slice(array_map(fn ($f) => basename($f), $files), 0, 5),
    ];
}

function migrateCacheToDb(): array
{
    $cacheDir = ROOT_PATH . '/cache';
    if (!is_dir($cacheDir)) return ['migrated' => 0, 'errors' => 0, 'message' => 'Cache directory not found'];

    $pdo = null;
    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (Throwable $e) { $pdo = null; }
    }

    $files    = array_merge(glob($cacheDir . '/*.json') ?: [], glob($cacheDir . '/*.gz') ?: []);
    $migrated = 0;
    $errors   = 0;
    $skipped  = 0;

    foreach ($files as $file) {
        try {
            $raw = file_get_contents($file);
            if (str_ends_with($file, '.gz')) $raw = gzdecode($raw);
            $payload = json_decode($raw, true);
            if (!$payload) { $skipped++; continue; }

            $base     = basename($file, '.json');
            $base     = basename($base, '.gz');
            $cacheKey = $base;

            if ($pdo) {
                $isOrcid = str_contains($base, 'orcid') && !empty($payload['orcid_id']);
                $isDoi   = str_contains($base, 'doi')   && !empty($payload['doi']);

                if ($isOrcid) {
                    // Persist to researchers table (correct table for ORCID data)
                    $pdo->prepare(
                        'INSERT INTO researchers (orcid, name, profile_cache_json, cache_expires_at, updated_at)
                         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())
                         ON DUPLICATE KEY UPDATE profile_cache_json = VALUES(profile_cache_json),
                                                 cache_expires_at   = VALUES(cache_expires_at),
                                                 updated_at         = NOW()'
                    )->execute([$payload['orcid_id'], $payload['name'] ?? $payload['orcid_id'], json_encode($payload)]);

                } elseif ($isDoi) {
                    // Persist to publications table (correct table for DOI data)
                    $doi   = strtolower(trim($payload['doi']));
                    $title = is_array($payload['title'] ?? '') ? ($payload['title'][0] ?? $doi) : ($payload['title'] ?? $doi);
                    $pdo->prepare(
                        'INSERT INTO publications (doi, title, raw_data_json, updated_at)
                         VALUES (?, ?, ?, NOW())
                         ON DUPLICATE KEY UPDATE raw_data_json = VALUES(raw_data_json),
                                                 updated_at    = NOW()'
                    )->execute([$doi, $title, json_encode($payload)]);

                } else {
                    // Generic cache → ecosystem_cache
                    $pdo->prepare(
                        'INSERT INTO ecosystem_cache (cache_key, payload, expires_at, created_by)
                         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?)
                         ON DUPLICATE KEY UPDATE payload     = VALUES(payload),
                                                 expires_at  = VALUES(expires_at)'
                    )->execute([$cacheKey, json_encode($payload), 'migrator']);
                }
            }

            $migrated++;
        } catch (Throwable $e) {
            $errors++;
        }
    }

    return [
        'migrated'   => $migrated,
        'errors'     => $errors,
        'skipped'    => $skipped,
        'total'      => count($files),
        'db_enabled' => $pdo !== null,
        'message'    => "Migration complete: {$migrated} migrated, {$errors} errors, {$skipped} skipped",
    ];
}

function clearMigratedCache(): array
{
    $cacheDir = ROOT_PATH . '/cache';
    if (!is_dir($cacheDir)) return ['deleted' => 0, 'message' => 'Cache directory not found'];

    $files   = array_merge(glob($cacheDir . '/*.json') ?: [], glob($cacheDir . '/*.gz') ?: []);
    $deleted = 0;
    foreach ($files as $file) {
        if (@unlink($file)) $deleted++;
    }
    return ['deleted' => $deleted, 'message' => "Cleared {$deleted} cache files"];
}
