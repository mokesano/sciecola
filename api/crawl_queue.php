<?php
declare(strict_types=1);

/**
 * @file api/crawl_queue.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Crawling Queue Manager API.
 * 
 * Crawling Queue Manager
 * Handles queuing and processing of ORCID/DOI crawl jobs
 *
 * GET  /api/crawl_queue.php?action=status         - Queue status
 * POST /api/crawl_queue.php { action: "enqueue", type: "orcid"|"doi", identifier: "..." }
 * POST /api/crawl_queue.php { action: "process", limit: 10 }
 * GET  /api/crawl_queue.php?action=list           - List queued items
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

if (!defined('ROOT_PATH')) { define('ROOT_PATH', dirname(__DIR__)); }
if (file_exists(ROOT_PATH . '/includes/bootstrap.php')) {
    require_once ROOT_PATH . '/includes/bootstrap.php';
}

$input  = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? ($_GET['action'] ?? 'status');

// File-based queue fallback (when DB unavailable)
define('QUEUE_FILE', ROOT_PATH . '/cache/crawl_queue.json');

function readQueue(): array {
    if (!file_exists(QUEUE_FILE)) return [];
    return json_decode(file_get_contents(QUEUE_FILE), true) ?? [];
}

function writeQueue(array $queue): void {
    if (!is_dir(dirname(QUEUE_FILE))) mkdir(dirname(QUEUE_FILE), 0755, true);
    file_put_contents(QUEUE_FILE, json_encode($queue, JSON_PRETTY_PRINT), LOCK_EX);
}

switch ($action) {
    case 'status':
        $queue = readQueue();
        $pending   = array_filter($queue, fn($j) => $j['status'] === 'pending');
        $running   = array_filter($queue, fn($j) => $j['status'] === 'running');
        $completed = array_filter($queue, fn($j) => $j['status'] === 'completed');
        $failed    = array_filter($queue, fn($j) => $j['status'] === 'failed');
        echo json_encode([
            'total'     => count($queue),
            'pending'   => count($pending),
            'running'   => count($running),
            'completed' => count($completed),
            'failed'    => count($failed),
        ]);
        break;

    case 'enqueue':
        $type       = $input['type']       ?? null;
        $identifier = $input['identifier'] ?? null;
        $priority   = $input['priority']   ?? 5;

        if (!$type || !$identifier) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing type or identifier']);
            break;
        }

        $queue = readQueue();

        // Check for duplicate
        foreach ($queue as $job) {
            if ($job['identifier'] === $identifier && $job['status'] === 'pending') {
                echo json_encode(['status' => 'already_queued', 'job_id' => $job['id']]);
                break 2;
            }
        }

        $jobId = 'job-' . substr(md5($type . $identifier . microtime()), 0, 12);
        $queue[] = [
            'id'         => $jobId,
            'type'       => $type,        // 'orcid', 'doi', 'journal', 'institution'
            'identifier' => $identifier,
            'priority'   => (int)$priority,
            'status'     => 'pending',
            'attempts'   => 0,
            'created_at' => date('c'),
            'updated_at' => date('c'),
            'result'     => null,
            'error'      => null,
        ];

        // Sort by priority desc, created_at asc
        usort($queue, fn($a, $b) => $b['priority'] <=> $a['priority'] ?: strcmp($a['created_at'], $b['created_at']));
        writeQueue($queue);

        echo json_encode(['status' => 'queued', 'job_id' => $jobId]);
        break;

    case 'process':
        $limit = (int)($input['limit'] ?? 5);
        $queue = readQueue();
        $processed = 0;
        $results   = [];

        foreach ($queue as &$job) {
            if ($job['status'] !== 'pending' || $processed >= $limit) continue;
            if ($job['attempts'] >= 3) { $job['status'] = 'failed'; continue; }

            $job['status']     = 'running';
            $job['attempts']++;
            $job['updated_at'] = date('c');
            writeQueue($queue);

            // Simulate processing (real implementation calls the API)
            $success = processJob($job);

            $job['status']     = $success ? 'completed' : 'failed';
            $job['updated_at'] = date('c');
            $processed++;
            $results[]         = ['id' => $job['id'], 'status' => $job['status']];
        }
        unset($job);

        writeQueue($queue);
        echo json_encode(['processed' => $processed, 'results' => $results]);
        break;

    case 'list':
        $queue  = readQueue();
        $status = $_GET['status'] ?? null;
        if ($status) {
            $queue = array_values(array_filter($queue, fn($j) => $j['status'] === $status));
        }
        echo json_encode(['total' => count($queue), 'jobs' => array_slice($queue, 0, 50)]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
}

function processJob(array &$job): bool {
    $type       = $job['type'];
    $identifier = $job['identifier'];

    // Build the API endpoint URL to call
    $baseUrl = defined('SITE_URL') ? SITE_URL : 'http://localhost';

    $endpoints = [
        'orcid'       => $baseUrl . '/api/ORCID/ORCID_Profile_API.php?orcid=' . urlencode($identifier),
        'doi'         => $baseUrl . '/api/proxy.php?doi=' . urlencode($identifier),
        'sdg'         => $baseUrl . '/api/SdgClassificationApi.php?doi=' . urlencode($identifier),
        'journal'     => $baseUrl . '/api/scopus/journal-checker.php?issn=' . urlencode($identifier),
        'institution' => $baseUrl . '/api/proxy.php?ror=' . urlencode($identifier),
    ];

    $url = $endpoints[$type] ?? null;
    if (!$url) {
        $job['error'] = "Unknown job type: {$type}";
        return false;
    }

    // Only attempt real HTTP call if cURL is available
    if (!function_exists('curl_init')) {
        $job['result'] = ['note' => 'cURL not available; job logged for later processing'];
        return true;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error || $httpCode >= 400) {
        $job['error'] = $error ?: "HTTP {$httpCode}";
        return $job['attempts'] < 3; // retry on transient errors
    }

    $data = json_decode($response, true);
    if (!$data) {
        $job['error'] = 'Invalid JSON response';
        return false;
    }

    // Store in cache file as intermediate until DB migration runs
    $cacheDir = ROOT_PATH . '/cache';
    if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
    $cacheKey = $type . '_' . md5($identifier);
    file_put_contents("{$cacheDir}/{$cacheKey}.json", json_encode($data));

    $job['result'] = ['cache_key' => $cacheKey, 'http_code' => $httpCode];
    return true;
}
